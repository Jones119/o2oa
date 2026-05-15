#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import subprocess
import os
import sys
import re
import json
from collections import defaultdict

MIRROR = "https://maven.aliyun.com/repository/public"
LOCAL_REPO = os.path.expanduser("~/.m2/repository")
NS = {"m": "http://maven.apache.org/POM/4.0.0"}

stats = {"downloaded": 0, "skipped": 0, "failed": 0, "failed_list": []}
pom_cache = {}


def gav_key(g, a, v):
    return f"{g}:{a}:{v}"


def gav_to_dir(g, a, v):
    return os.path.join(LOCAL_REPO, g.replace(".", "/"), a, v)


def artifact_url(g, a, v, ext):
    return f"{MIRROR}/{g.replace('.', '/')}/{a}/{v}/{a}-{v}.{ext}"


def curl_download(url, dest):
    d = os.path.dirname(dest)
    os.makedirs(d, exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        stats["skipped"] += 1
        return True
    try:
        r = subprocess.run(
            ["curl", "-sL", "-f", "-o", dest, "--connect-timeout", "10",
             "--max-time", "60", "--retry", "1", url],
            capture_output=True, timeout=90,
        )
        if r.returncode == 0 and os.path.exists(dest) and os.path.getsize(dest) > 0:
            stats["downloaded"] += 1
            return True
        if os.path.exists(dest):
            os.remove(dest)
        stats["failed"] += 1
        return False
    except Exception:
        if os.path.exists(dest):
            os.remove(dest)
        stats["failed"] += 1
        return False


def download_pom(g, a, v):
    d = gav_to_dir(g, a, v)
    f = os.path.join(d, f"{a}-{v}.pom")
    ok = curl_download(artifact_url(g, a, v, "pom"), f)
    if not ok:
        stats["failed_list"].append(f"{g}:{a}:{v}:pom")
    return ok


def download_jar(g, a, v, packaging="jar"):
    d = gav_to_dir(g, a, v)
    f = os.path.join(d, f"{a}-{v}.{packaging}")
    ok = curl_download(artifact_url(g, a, v, packaging), f)
    if not ok and packaging == "jar":
        stats["failed_list"].append(f"{g}:{a}:{v}:jar")
    return ok


def resolve_props(text, props):
    if not text:
        return text
    prev = None
    while prev != text:
        prev = text
        def repl(m, p=props):
            v = m.group(1)
            return p.get(v, m.group(0))
        text = re.sub(r"\$\{([^}]+)\}", repl, text)
    return text


def parse_pom_file(pom_path):
    if pom_path in pom_cache:
        return pom_cache[pom_path]
    if not os.path.exists(pom_path):
        return None
    try:
        tree = ET.parse(pom_path)
    except ET.ParseError:
        return None

    root = tree.getroot()

    def ft(parent, tag):
        el = parent.find(f"m:{tag}", NS)
        return el.text.strip() if el is not None and el.text else None

    props = {}
    pe = root.find("m:properties", NS)
    if pe is not None:
        for c in pe:
            t = c.tag.replace(f"{{{NS['m']}}}", "")
            if c.text:
                props[t] = c.text.strip()

    pg, pa, pv = ft(root, "groupId"), ft(root, "artifactId"), ft(root, "version")
    packaging = ft(root, "packaging") or "jar"

    parent = None
    pel = root.find("m:parent", NS)
    if pel is not None:
        ppg, ppa, ppv = ft(pel, "groupId"), ft(pel, "artifactId"), ft(pel, "version")
        if ppg and ppa and ppv:
            parent = (ppg, ppa, ppv)

    if not pg and parent:
        pg = parent[0]
    if not pv and parent:
        pv = parent[2]

    deps = []
    for d in root.findall(".//m:dependency", NS):
        g, a, v = ft(d, "groupId"), ft(d, "artifactId"), ft(d, "version")
        scope = ft(d, "scope") or "compile"
        opt = ft(d, "optional") or "false"
        if g and a:
            g, a = resolve_props(g, props), resolve_props(a, props)
            if v:
                v = resolve_props(v, props)
            deps.append((g, a, v, scope, opt))

    dep_mgmt = {}
    dm = root.find("m:dependencyManagement/m:dependencies", NS)
    if dm is not None:
        for d in dm.findall("m:dependency", NS):
            g, a, v = ft(d, "groupId"), ft(d, "artifactId"), ft(d, "version")
            scope = ft(d, "scope") or "compile"
            if g and a:
                g, a = resolve_props(g, props), resolve_props(a, props)
                if v:
                    v = resolve_props(v, props)
                dep_mgmt[(g, a)] = (v, scope)

    plugins = []
    for p in root.findall(".//m:plugin", NS):
        g = ft(p, "groupId") or "org.apache.maven.plugins"
        a, v = ft(p, "artifactId"), ft(p, "version")
        if a:
            g, a = resolve_props(g, props), resolve_props(a, props)
            if v:
                v = resolve_props(v, props)
            plugins.append((g, a, v))

    result = {
        "groupId": pg, "artifactId": pa, "version": pv,
        "packaging": packaging, "parent": parent, "properties": props,
        "dependencies": deps, "dependencyManagement": dep_mgmt, "plugins": plugins,
    }
    pom_cache[pom_path] = result
    return result


def get_pom_data(g, a, v):
    d = gav_to_dir(g, a, v)
    pf = os.path.join(d, f"{a}-{v}.pom")
    if not os.path.exists(pf):
        download_pom(g, a, v)
    return parse_pom_file(pf)


def resolve_parent_chain(g, a, v, visited=None):
    if visited is None:
        visited = set()
    key = gav_key(g, a, v)
    if key in visited:
        return
    visited.add(key)

    download_pom(g, a, v)
    data = get_pom_data(g, a, v)
    if data and data["parent"]:
        pg, pa, pv = data["parent"]
        resolve_parent_chain(pg, pa, pv, visited)


def resolve_transitive_deps(g, a, v, visited=None, depth=0, max_depth=8):
    if visited is None:
        visited = set()
    key = gav_key(g, a, v)
    if key in visited or depth > max_depth:
        return
    visited.add(key)

    data = get_pom_data(g, a, v)
    if not data:
        return

    if data["parent"]:
        pg, pa, pv = data["parent"]
        resolve_parent_chain(pg, pa, pv)

    packaging = data.get("packaging", "jar")
    if packaging not in ("pom", "bom"):
        download_jar(g, a, v, packaging)

    for dg, da, dv, scope, opt in data["dependencies"]:
        if scope in ("test", "provided", "system"):
            continue
        if opt == "true":
            continue
        if not dv or "${" in dv:
            if (dg, da) in data.get("dependencyManagement", {}):
                dv = data["dependencyManagement"][(dg, da)][0]
        if not dv or "${" in dv:
            continue
        resolve_transitive_deps(dg, da, dv, visited, depth + 1, max_depth)


def main():
    print("=" * 60)
    print("Maven Dependency Downloader v2 (focused)")
    print(f"Mirror: {MIRROR}")
    print(f"Local repo: {LOCAL_REPO}")
    print("=" * 60)

    # Phase 1: Essential parent POMs
    print("\n[Phase 1] Downloading essential parent POMs...")
    parent_poms = [
        ("org.apache.maven.plugins", "maven-plugins", "31"),
        ("org.apache.maven.plugins", "maven-plugins", "32"),
        ("org.apache.maven.plugins", "maven-plugins", "33"),
        ("org.apache.maven.plugins", "maven-plugins", "34"),
        ("org.apache.maven.plugins", "maven-plugins", "35"),
        ("org.apache.maven.plugins", "maven-plugins", "36"),
        ("org.apache.maven.plugins", "maven-plugins", "37"),
        ("org.apache.maven.plugins", "maven-plugins", "38"),
        ("org.apache.maven.plugins", "maven-plugins", "39"),
        ("org.apache.maven.plugins", "maven-plugins", "40"),
        ("org.apache.maven", "maven-parent", "31"),
        ("org.apache.maven", "maven-parent", "32"),
        ("org.apache.maven", "maven-parent", "33"),
        ("org.apache.maven", "maven-parent", "34"),
        ("org.apache.maven", "maven-parent", "35"),
        ("org.apache.maven", "maven-parent", "36"),
        ("org.apache.maven", "maven-parent", "37"),
        ("org.apache.maven", "maven-parent", "38"),
        ("org.apache.maven", "maven-parent", "39"),
        ("org.apache.maven", "maven-parent", "40"),
        ("org.apache", "apache", "21"),
        ("org.apache", "apache", "23"),
        ("org.apache", "apache", "24"),
        ("org.apache", "apache", "25"),
        ("org.apache", "apache", "27"),
        ("org.apache", "apache", "29"),
        ("org.apache", "apache", "30"),
        ("org.apache", "apache", "31"),
        ("org.codehaus.mojo", "mojo-parent", "50"),
        ("org.codehaus.mojo", "mojo-parent", "60"),
        ("org.codehaus.mojo", "mojo-parent", "65"),
        ("org.codehaus.mojo", "mojo-parent", "70"),
        ("org.codehaus.mojo", "mojo-parent", "74"),
        ("org.codehaus.mojo", "mojo-parent", "77"),
        ("org.codehaus.mojo", "mojo-parent", "80"),
        ("org.eclipse.jetty", "jetty-project", "12.0.22"),
        ("org.glassfish.jersey", "jersey", "4.0.0-M2"),
        ("org.apache.cxf", "cxf", "4.1.1"),
        ("org.apache.poi", "poi-parent", "5.5.1"),
        ("org.apache.tika", "tika", "3.2.3"),
        ("org.apache.pdfbox", "pdfbox-parent", "3.0.6"),
        ("org.apache.lucene", "lucene-parent", "9.4.2"),
        ("org.apache.lucene", "lucene-solr-grandparent", "9.4.2"),
        ("org.apache.logging.log4j", "log4j", "2.24.3"),
        ("org.eclipse.jgit", "org.eclipse.jgit-parent", "6.2.0.202206071550-r"),
        ("io.swagger.core.v3", "swagger-project", "2.2.30"),
        ("org.graalvm", "graalvm", "24.2.1"),
        ("com.google.guava", "guava-parent", "33.3.1-jre"),
        ("org.junit", "junit-bom", "5.10.0"),
    ]
    for g, a, v in parent_poms:
        resolve_parent_chain(g, a, v)
    print(f"  Phase 1 done. Downloaded: {stats['downloaded']}, Skipped: {stats['skipped']}")

    # Phase 2: Direct dependencies from root POM
    print("\n[Phase 2] Downloading direct dependencies with transitive deps...")
    direct_deps = [
        ("jakarta.platform", "jakarta.jakartaee-api", "11.0.0"),
        ("com.google.code.gson", "gson", "2.12.1"),
        ("org.apache.openjpa", "openjpa", "4.0.1"),
        ("org.apache.commons", "commons-lang3", "3.20.0"),
        ("commons-cli", "commons-cli", "1.8.0"),
        ("commons-beanutils", "commons-beanutils", "1.11.0"),
        ("commons-net", "commons-net", "3.11.1"),
        ("org.apache.commons", "commons-math3", "3.6.1"),
        ("org.apache.commons", "commons-collections4", "4.4"),
        ("commons-codec", "commons-codec", "1.17.1"),
        ("commons-io", "commons-io", "2.17.0"),
        ("org.apache.commons", "commons-vfs2-jackrabbit2", "2.10.0"),
        ("org.apache.commons", "commons-pool2", "2.12.0"),
        ("org.apache.commons", "commons-text", "1.12.0"),
        ("org.apache.commons", "commons-compress", "1.27.1"),
        ("org.apache.commons", "commons-configuration2", "2.11.0"),
        ("org.apache.commons", "commons-email", "1.5"),
        ("commons-fileupload", "commons-fileupload", "1.6.0"),
        ("org.eclipse.jetty", "jetty-server", "12.0.22"),
        ("org.eclipse.jetty", "jetty-deploy", "12.0.22"),
        ("org.eclipse.jetty", "jetty-annotations", "12.0.22"),
        ("org.eclipse.jetty", "jetty-quickstart", "12.0.22"),
        ("org.eclipse.jetty", "jetty-proxy", "12.0.22"),
        ("jakarta.servlet", "jakarta.servlet-api", "6.1.0"),
        ("org.glassfish.jersey.containers", "jersey-container-jetty-servlet", "4.0.0-M2"),
        ("org.glassfish.jersey.inject", "jersey-hk2", "4.0.0-M2"),
        ("org.glassfish.jersey.media", "jersey-media-json-gson", "4.0.0-M2"),
        ("org.glassfish.jersey.core", "jersey-server", "4.0.0-M2"),
        ("org.glassfish.jersey.media", "jersey-media-multipart", "4.0.0-M2"),
        ("com.google.zxing", "core", "3.4.0"),
        ("org.apache.ftpserver", "ftpserver-core", "1.2.1"),
        ("org.apache.ftpserver", "ftplet-api", "1.2.1"),
        ("org.apache.cxf", "cxf-core", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-frontend-jaxws", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-frontend-simple", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-wsdl", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-databinding-jaxb", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-transports-http", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-bindings-soap", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-bindings-xml", "4.1.1"),
        ("org.apache.cxf", "cxf-rt-ws-addr", "4.1.1"),
        ("com.fasterxml.woodstox", "woodstox-core", "6.7.0"),
        ("org.codehaus.woodstox", "stax2-api", "4.2.1"),
        ("org.apache.neethi", "neethi", "3.1.1"),
        ("org.apache.poi", "poi", "5.5.1"),
        ("org.apache.poi", "poi-ooxml", "5.5.1"),
        ("org.apache.poi", "poi-scratchpad", "5.5.1"),
        ("fr.opensagres.xdocreport", "fr.opensagres.poi.xwpf.converter.xhtml", "2.0.2"),
        ("fr.opensagres.xdocreport", "xdocreport", "2.0.2"),
        ("org.apache.tika", "tika-core", "3.2.3"),
        ("org.apache.tika", "tika-parsers-standard-package", "3.2.3"),
        ("org.apache.pdfbox", "pdfbox", "3.0.6"),
        ("org.apache.pdfbox", "pdfbox-tools", "3.0.6"),
        ("net.sourceforge.tess4j", "tess4j", "5.13.0"),
        ("io.github.classgraph", "classgraph", "4.8.89"),
        ("org.dom4j", "dom4j", "2.1.4"),
        ("org.quartz-scheduler", "quartz", "2.5.0-rc1"),
        ("org.imgscalr", "imgscalr-lib", "4.2"),
        ("com.github.stuxuhai", "jpinyin", "1.1.8"),
        ("com.hankcs", "hanlp", "portable-1.8.3"),
        ("com.hankcs.nlp", "hanlp-lucene-plugin", "1.1.7"),
        ("org.apache.lucene", "lucene-core", "9.4.2"),
        ("org.apache.lucene", "lucene-queryparser", "9.4.2"),
        ("org.apache.lucene", "lucene-highlighter", "9.4.2"),
        ("org.apache.lucene", "lucene-grouping", "9.4.2"),
        ("org.apache.lucene", "lucene-luke", "9.4.2"),
        ("de.vandermeer", "asciitable", "0.3.2"),
        ("com.h2database", "h2", "2.3.232"),
        ("org.mnode.ical4j", "ical4j", "3.0.9"),
        ("org.apache.xbean", "xbean-asm8-shaded", "4.17"),
        ("com.squareup", "javapoet", "1.11.1"),
        ("com.github.neuroph", "neuroph-core", "2.98"),
        ("com.github.neuroph", "neuroph-imgrec", "2.98"),
        ("com.github.neuroph", "neuroph-ocr", "2.98"),
        ("com.github.neuroph", "neuroph-contrib", "2.98"),
        ("com.alibaba", "druid", "1.2.24"),
        ("com.itextpdf", "html2pdf", "6.3.1"),
        ("com.itextpdf", "font-asian", "9.5.0"),
        ("redis.clients", "jedis", "5.2.0"),
        ("com.sun.mail", "jakarta.mail", "2.0.2"),
        ("jakarta.activation", "jakarta.activation-api", "2.1.3"),
        ("net.lingala.zip4j", "zip4j", "2.11.5"),
        ("com.github.xuwei-k", "html2image", "0.1.0"),
        ("com.microsoft.playwright", "playwright", "1.47.0"),
        ("jakarta.cache", "jakarta.cache-api", "1.1.1"),
        ("org.jsr107.ri", "cache-ri-impl", "1.1.1"),
        ("org.apache.logging.log4j", "log4j-api", "2.24.3"),
        ("org.apache.logging.log4j", "log4j-core", "2.24.3"),
        ("org.apache.logging.log4j", "log4j-slf4j-impl", "2.24.3"),
        ("org.slf4j", "slf4j-api", "2.0.17"),
        ("io.swagger.core.v3", "swagger-annotations", "2.2.30"),
        ("io.swagger.core.v3", "swagger-core", "2.2.30"),
        ("io.swagger.core.v3", "swagger-jaxrs2", "2.2.30"),
        ("org.eclipse.jgit", "org.eclipse.jgit", "6.2.0.202206071550-r"),
        ("org.ldaptive", "ldaptive-jldap", "1.3.1"),
        ("org.jsoup", "jsoup", "1.19.1"),
        ("com.github.jsqlparser", "jsqlparser", "4.6"),
        ("com.zaxxer", "SparseBitSet", "1.2"),
        ("org.junit.jupiter", "junit-jupiter-api", "5.10.0"),
        ("org.junit.jupiter", "junit-jupiter-engine", "5.10.0"),
        ("org.graalvm.sdk", "graal-sdk", "24.2.1"),
        ("org.graalvm.js", "js", "24.2.1"),
        ("org.graalvm.js", "js-scriptengine", "24.2.1"),
        ("org.graalvm.tools", "profiler", "24.2.1"),
        ("org.graalvm.tools", "chromeinspector", "24.2.1"),
        ("com.google.guava", "guava", "33.3.1-jre"),
        ("org.apache.maven", "maven-model", "3.9.9"),
    ]
    visited = set()
    for g, a, v in direct_deps:
        resolve_transitive_deps(g, a, v, visited, depth=0, max_depth=10)
    print(f"  Phase 2 done. Total visited: {len(visited)}")

    # Phase 3: Maven plugins (POM + JAR only, no deep transitive)
    print("\n[Phase 3] Downloading Maven plugins...")
    plugins = [
        ("org.apache.maven.plugins", "maven-clean-plugin", "3.1.0"),
        ("org.apache.maven.plugins", "maven-resources-plugin", "3.1.0"),
        ("org.apache.maven.plugins", "maven-compiler-plugin", "3.13.0"),
        ("org.apache.maven.plugins", "maven-surefire-plugin", "3.0.0-M3"),
        ("org.apache.maven.plugins", "maven-jar-plugin", "3.2.0"),
        ("org.apache.maven.plugins", "maven-war-plugin", "3.2.3"),
        ("org.apache.maven.plugins", "maven-source-plugin", "3.1.0"),
        ("org.apache.maven.plugins", "maven-javadoc-plugin", "3.2.0"),
        ("org.apache.maven.plugins", "maven-gpg-plugin", "1.6"),
        ("org.apache.maven.plugins", "maven-install-plugin", "3.0.0-M1"),
        ("org.apache.maven.plugins", "maven-deploy-plugin", "3.0.0-M1"),
        ("org.apache.maven.plugins", "maven-site-plugin", "3.8.2"),
        ("org.codehaus.mojo", "exec-maven-plugin", "1.6.0"),
        ("org.eclipse.m2e", "lifecycle-mapping", "1.0.0"),
    ]
    for g, a, v in plugins:
        resolve_parent_chain(g, a, v)
        download_jar(g, a, v)
        data = get_pom_data(g, a, v)
        if data:
            for dg, da, dv, scope, opt in data["dependencies"]:
                if scope in ("test", "provided", "system"):
                    continue
                if not dv or "${" in dv:
                    continue
                resolve_parent_chain(dg, da, dv)
                download_pom(dg, da, dv)
                download_jar(dg, da, dv)
    print(f"  Phase 3 done.")

    # Phase 4: Scan module POMs for extra deps
    print("\n[Phase 4] Scanning module POMs for additional deps...")
    base = "/workspace/o2server"
    module_visited = set()
    for entry in sorted(os.listdir(base)):
        mpom = os.path.join(base, entry, "pom.xml")
        if not os.path.isfile(mpom):
            continue
        try:
            tree = ET.parse(mpom)
            root = tree.getroot()
            for d in root.findall(".//m:dependency", NS):
                g_el = d.find("m:groupId", NS)
                a_el = d.find("m:artifactId", NS)
                v_el = d.find("m:version", NS)
                s_el = d.find("m:scope", NS)
                if g_el is not None and a_el is not None:
                    g = g_el.text.strip() if g_el.text else None
                    a = a_el.text.strip() if a_el.text else None
                    v = v_el.text.strip() if v_el.text else None
                    scope = s_el.text.strip() if s_el is not None and s_el.text else "compile"
                    if g and a and v and scope not in ("test", "provided", "system"):
                        if "${" not in v:
                            resolve_transitive_deps(g, a, v, module_visited, depth=0, max_depth=6)
            for p in root.findall(".//m:plugin", NS):
                g_el = p.find("m:groupId", NS)
                a_el = p.find("m:artifactId", NS)
                v_el = p.find("m:version", NS)
                if a_el is not None:
                    g = (g_el.text.strip() if g_el.text else "org.apache.maven.plugins") if g_el is not None else "org.apache.maven.plugins"
                    a = a_el.text.strip() if a_el.text else None
                    v = v_el.text.strip() if v_el.text else None
                    if a and v and "${" not in v:
                        resolve_parent_chain(g, a, v)
                        download_jar(g, a, v)
        except Exception:
            pass
    print(f"  Phase 4 done. Module deps visited: {len(module_visited)}")

    # Summary
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print(f"  Downloaded: {stats['downloaded']}")
    print(f"  Skipped (already exist): {stats['skipped']}")
    print(f"  Failed: {stats['failed']}")

    if stats["failed_list"]:
        print(f"\nFailed artifacts ({len(stats['failed_list'])}):")
        for f in sorted(set(stats["failed_list"])):
            print(f"  - {f}")

    total_poms = 0
    total_jars = 0
    for root_dir, dirs, files in os.walk(LOCAL_REPO):
        for f in files:
            if f.endswith(".pom"):
                total_poms += 1
            elif f.endswith(".jar"):
                total_jars += 1
    print(f"\nLocal repository totals: {total_poms} POMs, {total_jars} JARs")
    print("=" * 60)


if __name__ == "__main__":
    main()
