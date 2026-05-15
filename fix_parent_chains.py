#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import subprocess
import os

MIRROR = "https://maven.aliyun.com/repository/public"
REPO = os.path.expanduser("~/.m2/repository")
NS = {"m": "http://maven.apache.org/POM/4.0.0"}


def download(g, a, v, ext="pom"):
    gp = g.replace(".", "/")
    d = os.path.join(REPO, gp, a, v)
    f = os.path.join(d, f"{a}-{v}.{ext}")
    if os.path.exists(f) and os.path.getsize(f) > 0:
        return True
    os.makedirs(d, exist_ok=True)
    url = f"{MIRROR}/{gp}/{a}/{v}/{a}-{v}.{ext}"
    try:
        r = subprocess.run(
            ["curl", "-sL", "-f", "-o", f, "--connect-timeout", "10",
             "--max-time", "60", url],
            capture_output=True, timeout=90, env={**os.environ},
        )
        if r.returncode == 0 and os.path.exists(f) and os.path.getsize(f) > 0:
            print(f"  OK: {g}:{a}:{v}.{ext}")
            return True
        if os.path.exists(f):
            os.remove(f)
        return False
    except Exception:
        if os.path.exists(f):
            os.remove(f)
        return False


def get_parent(pom_path):
    if not os.path.exists(pom_path):
        return None
    try:
        tree = ET.parse(pom_path)
        root = tree.getroot()
        pel = root.find("m:parent", NS)
        if pel is not None:
            g = pel.find("m:groupId", NS)
            a = pel.find("m:artifactId", NS)
            v = pel.find("m:version", NS)
            if g is not None and a is not None and v is not None:
                return (g.text.strip(), a.text.strip(), v.text.strip())
    except Exception:
        pass
    return None


def resolve_chain(g, a, v, visited=None, depth=0):
    if visited is None:
        visited = set()
    key = f"{g}:{a}:{v}"
    if key in visited or depth > 10:
        return
    visited.add(key)

    gp = g.replace(".", "/")
    pom_path = os.path.join(REPO, gp, a, v, f"{a}-{v}.pom")

    if not os.path.exists(pom_path) or os.path.getsize(pom_path) == 0:
        ok = download(g, a, v, "pom")
        if not ok:
            print(f"  FAIL: {g}:{a}:{v}.pom")
            return

    parent = get_parent(pom_path)
    if parent:
        pg, pa, pv = parent
        print(f"  {'  ' * depth}{g}:{a}:{v} -> parent: {pg}:{pa}:{pv}")
        resolve_chain(pg, pa, pv, visited, depth + 1)

    download(g, a, v, "jar")


# Trace and fix the problematic artifacts
print("=== Resolving parent chains for problematic artifacts ===")
for g, a, v in [
    ("commons-io", "commons-io", "2.11.0"),
    ("org.codehaus.plexus", "plexus-utils", "4.0.0"),
    ("org.codehaus.plexus", "plexus-xml", "3.0.0"),
]:
    print(f"\nResolving: {g}:{a}:{v}")
    resolve_chain(g, a, v)

# Also resolve all transitive deps of maven-compiler-plugin
print("\n\n=== Resolving maven-compiler-plugin dependency tree ===")
resolve_chain("org.apache.maven.plugins", "maven-compiler-plugin", "3.13.0")

# Parse the compiler plugin POM and resolve all its deps
pom_path = os.path.join(REPO, "org/apache/maven/plugins/maven-compiler-plugin/3.13.0/maven-compiler-plugin-3.13.0.pom")
if os.path.exists(pom_path):
    tree = ET.parse(pom_path)
    root = tree.getroot()
    for dep in root.findall(".//m:dependency", NS):
        g_el = dep.find("m:groupId", NS)
        a_el = dep.find("m:artifactId", NS)
        v_el = dep.find("m:version", NS)
        s_el = dep.find("m:scope", NS)
        scope = s_el.text.strip() if s_el is not None and s_el.text else "compile"
        if g_el is not None and a_el is not None and v_el is not None:
            g, a, v = g_el.text.strip(), a_el.text.strip(), v_el.text.strip()
            if scope not in ("test", "provided", "system"):
                print(f"\nResolving dep: {g}:{a}:{v}")
                resolve_chain(g, a, v)

print("\n\nDone!")
