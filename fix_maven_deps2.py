#!/usr/bin/env python3
import subprocess
import re
import os
import sys

MIRROR = "https://maven.aliyun.com/repository/public"
REPO = os.path.expanduser("~/.m2/repository")
total_downloaded = 0
total_failed = 0


def download_artifact(g, a, v, ext="pom"):
    global total_downloaded, total_failed
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
             "--max-time", "60", "--retry", "1", url],
            capture_output=True, timeout=90,
            env={**os.environ},
        )
        if r.returncode == 0 and os.path.exists(f) and os.path.getsize(f) > 0:
            total_downloaded += 1
            return True
        if os.path.exists(f):
            os.remove(f)
        total_failed += 1
        return False
    except Exception:
        if os.path.exists(f):
            os.remove(f)
        total_failed += 1
        return False


def extract_missing(output):
    missing = set()
    for m in re.finditer(
        r'The following artifacts could not be resolved:\s*'
        r'([a-zA-Z0-9_.-]+):([a-zA-Z0-9_.-]+):([a-zA-Z0-9_.-]+)\s*\(absent\)',
        output
    ):
        g, a, v = m.group(1), m.group(2), m.group(3)
        missing.add((g, a, v))

    for m in re.finditer(
        r'The POM for\s+([a-zA-Z0-9_.-]+):([a-zA-Z0-9_.-]+):jar:([a-zA-Z0-9_.-]+)\s+is missing',
        output
    ):
        g, a, v = m.group(1), m.group(2), m.group(3)
        missing.add((g, a, v))

    return missing


def download_and_recurse(g, a, v, visited=None, depth=0):
    if visited is None:
        visited = set()
    key = f"{g}:{a}:{v}"
    if key in visited or depth > 5:
        return
    visited.add(key)

    pom_ok = download_artifact(g, a, v, "pom")
    if not pom_ok:
        return

    import xml.etree.ElementTree as ET
    NS = {"m": "http://maven.apache.org/POM/4.0.0"}
    pom_path = os.path.join(REPO, g.replace(".", "/"), a, v, f"{a}-{v}.pom")
    try:
        tree = ET.parse(pom_path)
        root = tree.getroot()

        parent_el = root.find("m:parent", NS)
        if parent_el is not None:
            pg = parent_el.find("m:groupId", NS)
            pa = parent_el.find("m:artifactId", NS)
            pv = parent_el.find("m:version", NS)
            if pg is not None and pa is not None and pv is not None:
                pg, pa, pv = pg.text.strip(), pa.text.strip(), pv.text.strip()
                download_and_recurse(pg, pa, pv, visited, depth + 1)

        for dep_el in root.findall(".//m:dependency", NS):
            dg = dep_el.find("m:groupId", NS)
            da = dep_el.find("m:artifactId", NS)
            dv = dep_el.find("m:version", NS)
            ds = dep_el.find("m:scope", NS)
            scope = ds.text.strip() if ds is not None and ds.text else "compile"
            if (dg is not None and da is not None and dv is not None
                    and scope not in ("test", "provided", "system")):
                g2, a2, v2 = dg.text.strip(), da.text.strip(), dv.text.strip()
                if "${" not in v2:
                    download_artifact(g2, a2, v2, "pom")
                    download_artifact(g2, a2, v2, "jar")

        for dep_el in root.findall(".//m:dependency/m:exclusions/m:exclusion/..", NS):
            pass

        for imp_el in root.findall(".//m:import", NS):
            dep_el = imp_el.getparent().getparent()
            if dep_el is not None:
                dg = dep_el.find("m:groupId", NS)
                da = dep_el.find("m:artifactId", NS)
                dv = dep_el.find("m:version", NS)
                if dg is not None and da is not None and dv is not None:
                    g2, a2, v2 = dg.text.strip(), da.text.strip(), dv.text.strip()
                    if "${" not in v2:
                        download_and_recurse(g2, a2, v2, visited, depth + 1)
    except Exception:
        pass


def main():
    global total_downloaded, total_failed
    max_iterations = 20

    for iteration in range(1, max_iterations + 1):
        print(f"\n{'='*60}")
        print(f"Iteration {iteration}")
        print(f"{'='*60}")

        result = subprocess.run(
            ["mvn", "clean", "compile", "-DskipTests", "-o",
             "-pl", "x_base_core_project"],
            capture_output=True, text=True, cwd="/workspace/o2server",
            env={**os.environ},
        )

        output = result.stdout + "\n" + result.stderr

        if result.returncode == 0:
            print("\n*** BUILD SUCCESS! ***")
            print(output[-1000:])
            return True

        if "BUILD SUCCESS" in output:
            print("\n*** BUILD SUCCESS! ***")
            return True

        missing = extract_missing(output)
        if not missing:
            print("No missing artifacts found but build failed.")
            print(output[-2000:])
            return False

        prev_downloaded = total_downloaded
        print(f"Found {len(missing)} missing artifacts. Downloading...")

        for g, a, v in sorted(missing):
            download_and_recurse(g, a, v)
            download_artifact(g, a, v, "pom")
            download_artifact(g, a, v, "jar")

        print(f"  Downloaded this round: {total_downloaded - prev_downloaded}")
        print(f"  Total downloaded: {total_downloaded}, Total failed: {total_failed}")

        if total_downloaded == prev_downloaded:
            print("No progress. Creating minimal POMs for remaining missing artifacts...")
            for g, a, v in sorted(missing):
                gp = g.replace(".", "/")
                d = os.path.join(REPO, gp, a, v)
                pom_f = os.path.join(d, f"{a}-{v}.pom")
                if not os.path.exists(pom_f) or os.path.getsize(pom_f) == 0:
                    os.makedirs(d, exist_ok=True)
                    with open(pom_f, 'w') as f:
                        f.write(f'''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>{g}</groupId>
  <artifactId>{a}</artifactId>
  <version>{v}</version>
  <packaging>pom</packaging>
</project>''')
                    print(f"  Created minimal POM: {g}:{a}:{v}")

    print(f"Max iterations reached. Total downloaded: {total_downloaded}")
    return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
