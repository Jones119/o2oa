#!/usr/bin/env python3
import subprocess
import re
import os
import sys

BASE_URL = "https://maven.aliyun.com/repository/public"
REPO = os.path.expanduser("~/.m2/repository")

def download_artifact(group_path, artifact_id, version):
    dir_path = os.path.join(REPO, group_path, artifact_id, version)
    os.makedirs(dir_path, exist_ok=True)
    for ext in ["pom", "jar"]:
        filename = f"{artifact_id}-{version}.{ext}"
        filepath = os.path.join(dir_path, filename)
        if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
            continue
        url = f"{BASE_URL}/{group_path}/{artifact_id}/{version}/{filename}"
        try:
            result = subprocess.run(
                ["curl", "-sL", "-o", filepath, url],
                timeout=30, capture_output=True
            )
            if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                print(f"OK: {group_path}/{artifact_id}/{version}/{filename}")
            else:
                if os.path.exists(filepath):
                    os.remove(filepath)
                if ext == "pom":
                    print(f"MISSING POM: {group_path}/{artifact_id}/{version}")
        except Exception as e:
            print(f"ERROR: {e}")

def parse_pom_deps(pom_path):
    deps = []
    try:
        with open(pom_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        parent_match = re.search(
            r'<parent>\s*<groupId>(.*?)</groupId>\s*<artifactId>(.*?)</artifactId>\s*<version>(.*?)</version>',
            content, re.DOTALL
        )
        if parent_match:
            deps.append((parent_match.group(1).strip(), parent_match.group(2).strip(), parent_match.group(3).strip()))
        dep_matches = re.findall(
            r'<dependency>\s*<groupId>(.*?)</groupId>\s*<artifactId>(.*?)</artifactId>\s*(?:<version>(.*?)</version>)?',
            content, re.DOTALL
        )
        for g, a, v in dep_matches:
            g, a = g.strip(), a.strip()
            v = v.strip() if v else ""
            if v and '${' not in v:
                deps.append((g, a, v))
    except Exception as e:
        pass
    return deps

def resolve_recursive(group_id, artifact_id, version, depth=0, visited=None):
    if visited is None:
        visited = set()
    key = f"{group_id}:{artifact_id}:{version}"
    if key in visited or depth > 5:
        return
    visited.add(key)
    group_path = group_id.replace('.', '/')
    download_artifact(group_path, artifact_id, version)
    pom_path = os.path.join(REPO, group_path, artifact_id, version, f"{artifact_id}-{version}.pom")
    if os.path.exists(pom_path):
        deps = parse_pom_deps(pom_path)
        for g, a, v in deps:
            resolve_recursive(g, a, v, depth + 1, visited)

if __name__ == "__main__":
    resolve_recursive("io.swagger.core.v3", "swagger-jaxrs2-jakarta", "2.2.30")
    resolve_recursive("com.fasterxml.jackson.jakarta.rs", "jackson-jakarta-rs-json-provider", "2.18.2")
    print("\nDone resolving all dependencies")
