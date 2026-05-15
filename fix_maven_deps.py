#!/usr/bin/env python3
import subprocess
import re
import os
import sys

MIRROR = "https://maven.aliyun.com/repository/public"
LOCAL_REPO = os.path.expanduser("~/.m2/repository")


def gav_to_path(g, a, v):
    return os.path.join(LOCAL_REPO, g.replace(".", "/"), a, v)


def download_file(url, dest):
    d = os.path.dirname(dest)
    os.makedirs(d, exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return True
    try:
        r = subprocess.run(
            ["curl", "-sL", "-f", "-o", dest, "--connect-timeout", "10",
             "--max-time", "60", "--retry", "1", url],
            capture_output=True, timeout=90,
        )
        if r.returncode == 0 and os.path.exists(dest) and os.path.getsize(dest) > 0:
            return True
        if os.path.exists(dest):
            os.remove(dest)
        return False
    except Exception:
        if os.path.exists(dest):
            os.remove(dest)
        return False


def download_artifact(g, a, v, ext="pom"):
    gp = g.replace(".", "/")
    url = f"{MIRROR}/{gp}/{a}/{v}/{a}-{v}.{ext}"
    dest_dir = gav_to_path(g, a, v)
    dest = os.path.join(dest_dir, f"{a}-{v}.{ext}")
    ok = download_file(url, dest)
    return ok


def extract_missing_from_maven(output):
    missing = set()
    patterns = [
        r'The following artifacts could not be resolved:\s*([^\s]+):([^\s]+):([^\s]+)\s*\(absent\)',
        r'Could not resolve artifact\s+([^:]+):([^:]+):([^:\s]+)',
        r'The POM for\s+([^:]+):([^:]+):jar:([^:\s]+)\s+is missing',
    ]
    for pattern in patterns:
        for m in re.finditer(pattern, output):
            g, a, v = m.group(1), m.group(2), m.group(3)
            missing.add((g, a, v))

    bom_pattern = r'([^:]+):([^:]+):pom:([^\s]+)\s*\(absent\)'
    for m in re.finditer(bom_pattern, output):
        g, a, v = m.group(1), m.group(2), m.group(3)
        missing.add((g, a, v))

    return missing


def download_with_transitive_poms(g, a, v, visited=None, depth=0):
    if visited is None:
        visited = set()
    key = f"{g}:{a}:{v}"
    if key in visited or depth > 3:
        return
    visited.add(key)

    ok = download_artifact(g, a, v, "pom")
    if not ok:
        return

    pom_path = os.path.join(gav_to_path(g, a, v), f"{a}-{v}.pom")
    if not os.path.exists(pom_path):
        return

    import xml.etree.ElementTree as ET
    NS = {"m": "http://maven.apache.org/POM/4.0.0"}
    try:
        tree = ET.parse(pom_path)
        root = tree.getroot()

        parent_el = root.find("m:parent", NS)
        if parent_el is not None:
            pg = parent_el.find("m:groupId", NS)
            pa = parent_el.find("m:artifactId", NS)
            pv = parent_el.find("m:version", NS)
            if pg is not None and pa is not None and pv is not None:
                download_with_transitive_poms(
                    pg.text.strip(), pa.text.strip(), pv.text.strip(),
                    visited, depth + 1
                )

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

        for imp_el in root.findall(".//m:import", NS):
            dep_el = imp_el.getparent().getparent()
            if dep_el is not None:
                dg = dep_el.find("m:groupId", NS)
                da = dep_el.find("m:artifactId", NS)
                dv = dep_el.find("m:version", NS)
                if dg is not None and da is not None and dv is not None:
                    g2, a2, v2 = dg.text.strip(), da.text.strip(), dv.text.strip()
                    if "${" not in v2:
                        download_with_transitive_poms(g2, a2, v2, visited, depth + 1)
    except Exception:
        pass


def main():
    max_iterations = 15
    for iteration in range(1, max_iterations + 1):
        print(f"\n{'='*60}")
        print(f"Iteration {iteration}: Running Maven offline build...")
        print(f"{'='*60}")

        result = subprocess.run(
            ["mvn", "clean", "compile", "-DskipTests", "-o",
             "-pl", "x_base_core_project"],
            capture_output=True, text=True, cwd="/workspace/o2server",
        )

        output = result.stdout + "\n" + result.stderr

        if result.returncode == 0:
            print("BUILD SUCCESS!")
            print(output[-500:])
            return True

        missing = extract_missing_from_maven(output)
        if not missing:
            print("No missing artifacts found in error output, but build failed.")
            print(output[-2000:])
            return False

        print(f"\nFound {len(missing)} missing artifacts. Downloading...")
        downloaded_count = 0
        failed_list = []
        for g, a, v in sorted(missing):
            download_with_transitive_poms(g, a, v)
            pom_ok = download_artifact(g, a, v, "pom")
            jar_ok = download_artifact(g, a, v, "jar")
            if pom_ok or jar_ok:
                downloaded_count += 1
                print(f"  OK: {g}:{a}:{v}")
            else:
                failed_list.append(f"{g}:{a}:{v}")
                print(f"  FAIL: {g}:{a}:{v}")

        print(f"\nDownloaded: {downloaded_count}, Failed: {len(failed_list)}")

        if failed_list:
            print("Failed artifacts:")
            for f in failed_list:
                print(f"  - {f}")

        if downloaded_count == 0 and failed_list:
            print("No progress made. Stopping.")
            return False

    print(f"Max iterations ({max_iterations}) reached.")
    return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
