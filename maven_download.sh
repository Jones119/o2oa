#!/bin/bash
set -euo pipefail

REPO="$HOME/.m2/repository"
BASE_URL="https://repo1.maven.org/maven2"
COUNT_FILE="/tmp/maven_download_count"
echo 0 > "$COUNT_FILE"

download_file() {
    local url="$1"
    local dest="$2"

    if [ -f "$dest" ]; then
        return 0
    fi

    mkdir -p "$(dirname "$dest")"
    local http_code
    http_code=$(curl -sL -o "$dest" -w "%{http_code}" "$url")

    if [ "$http_code" != "200" ]; then
        rm -f "$dest"
        return 1
    fi

    local count
    count=$(cat "$COUNT_FILE")
    echo $((count + 1)) > "$COUNT_FILE"
    echo "  Downloaded: $url"
    return 0
}

group_to_path() {
    echo "$1" | tr '.' '/'
}

download_artifact() {
    local groupId="$1"
    local artifactId="$2"
    local version="$3"
    local packaging="${4:-jar}"

    local gpath
    gpath=$(group_to_path "$groupId")
    local dir="$REPO/$gpath/$artifactId/$version"
    local url_prefix="$BASE_URL/$gpath/$artifactId/$version"

    echo "Processing: $groupId:$artifactId:$version ($packaging)"

    download_file "$url_prefix/$artifactId-$version.pom" "$dir/$artifactId-$version.pom" || {
        echo "  WARNING: Could not download POM for $groupId:$artifactId:$version"
        return 1
    }

    if [ "$packaging" != "pom" ]; then
        download_file "$url_prefix/$artifactId-$version.jar" "$dir/$artifactId-$version.jar" || {
            echo "  NOTE: No JAR for $groupId:$artifactId:$version"
        }
    fi

    return 0
}

extract_parent_from_pom() {
    local pom_file="$1"

    if [ ! -f "$pom_file" ]; then
        return
    fi

    python3 -c "
import xml.etree.ElementTree as ET
import sys

ns = {'m': 'http://maven.apache.org/POM/4.0.0'}

try:
    tree = ET.parse('$pom_file')
    root = tree.getroot()
    parent = root.find('m:parent', ns)
    if parent is not None:
        gid = parent.find('m:groupId', ns)
        aid = parent.find('m:artifactId', ns)
        ver = parent.find('m:version', ns)
        if gid is not None and aid is not None and ver is not None:
            print(f'{gid.text}:{aid.text}:{ver.text}')
except Exception as e:
    pass
" 2>/dev/null
}

extract_dependencies_from_pom() {
    local pom_file="$1"

    if [ ! -f "$pom_file" ]; then
        return
    fi

    python3 -c "
import xml.etree.ElementTree as ET
import sys

ns = {'m': 'http://maven.apache.org/POM/4.0.0'}

try:
    tree = ET.parse('$pom_file')
    root = tree.getroot()

    deps = root.find('m:dependencies', ns)
    if deps is None:
        sys.exit()

    for dep in deps.findall('m:dependency', ns):
        gid_el = dep.find('m:groupId', ns)
        aid_el = dep.find('m:artifactId', ns)
        ver_el = dep.find('m:version', ns)
        scope_el = dep.find('m:scope', ns)
        type_el = dep.find('m:type', ns)

        if gid_el is None or aid_el is None:
            continue

        scope = scope_el.text if scope_el is not None else 'compile'
        if scope in ('test', 'provided', 'system'):
            continue

        dep_type = type_el.text if type_el is not None else 'jar'

        gid = gid_el.text
        aid = aid_el.text
        ver = ver_el.text if ver_el is not None else ''

        if ver and not ver.startswith('\$'):
            print(f'{gid}:{aid}:{ver}:{dep_type}')
        else:
            print(f'{gid}:{aid}::')
except Exception as e:
    pass
" 2>/dev/null
}

PROCESSED_FILE="/tmp/maven_processed_artifacts"
> "$PROCESSED_FILE"

is_processed() {
    local key="$1"
    grep -qF "$key" "$PROCESSED_FILE" 2>/dev/null
}

mark_processed() {
    local key="$1"
    echo "$key" >> "$PROCESSED_FILE"
}

process_artifact() {
    local groupId="$1"
    local artifactId="$2"
    local version="$3"
    local packaging="${4:-jar}"

    local key="$groupId:$artifactId:$version"
    if is_processed "$key"; then
        return 0
    fi
    mark_processed "$key"

    download_artifact "$groupId" "$artifactId" "$version" "$packaging"

    local gpath
    gpath=$(group_to_path "$groupId")
    local pom_file="$REPO/$gpath/$artifactId/$version/$artifactId-$version.pom"

    if [ ! -f "$pom_file" ]; then
        return 0
    fi

    local parent
    parent=$(extract_parent_from_pom "$pom_file")
    if [ -n "$parent" ]; then
        local pgid paid pver
        pgid=$(echo "$parent" | cut -d: -f1)
        paid=$(echo "$parent" | cut -d: -f2)
        pver=$(echo "$parent" | cut -d: -f3)
        echo "  Found parent: $pgid:$paid:$pver"
        process_artifact "$pgid" "$paid" "$pver" "pom"
    fi

    while IFS= read -r dep; do
        [ -z "$dep" ] && continue
        local dgid daid dver dtype
        dgid=$(echo "$dep" | cut -d: -f1)
        daid=$(echo "$dep" | cut -d: -f2)
        dver=$(echo "$dep" | cut -d: -f3)
        dtype=$(echo "$dep" | cut -d: -f4)

        if [ -z "$dver" ]; then
            echo "  Skipping $dgid:$daid (version not resolved)"
            continue
        fi

        [ -z "$dtype" ] && dtype="jar"

        echo "  Found dependency: $dgid:$daid:$dver ($dtype)"
        process_artifact "$dgid" "$daid" "$dver" "$dtype"
    done < <(extract_dependencies_from_pom "$pom_file")
}

echo "============================================"
echo "Step 1: Download initial 4 artifacts"
echo "============================================"

process_artifact "org.apache.maven.plugins" "maven-compiler-plugin" "3.13.0" "jar"
process_artifact "org.apache.maven.plugins" "maven-plugins" "41" "pom"
process_artifact "org.apache.maven" "maven-parent" "41" "pom"
process_artifact "org.apache" "apache" "31" "pom"

echo ""
echo "============================================"
echo "Step 2: Parse maven-compiler-plugin POM for dependencies"
echo "============================================"

COMPILER_POM="$REPO/org/apache/maven/plugins/maven-compiler-plugin/3.13.0/maven-compiler-plugin-3.13.0.pom"
if [ -f "$COMPILER_POM" ]; then
    echo "Dependencies found in maven-compiler-plugin-3.13.0.pom:"
    extract_dependencies_from_pom "$COMPILER_POM"
fi

echo ""
echo "============================================"
echo "Step 3: Download key dependency artifacts"
echo "============================================"

KEY_DEPS=(
    "org.apache.maven:maven-plugin-api:3.9.6:jar"
    "org.apache.maven:maven-model:3.9.6:jar"
    "org.apache.maven:maven-artifact:3.9.6:jar"
    "org.apache.maven:maven-core:3.9.6:jar"
    "org.codehaus.plexus:plexus-compiler-api:2.13.0:jar"
    "org.codehaus.plexus:plexus-compiler-javac:2.13.0:jar"
    "org.codehaus.plexus:plexus-utils:3.5.1:jar"
    "org.codehaus.plexus:plexus-compiler-manager:2.13.0:jar"
)

for dep in "${KEY_DEPS[@]}"; do
    dgid=$(echo "$dep" | cut -d: -f1)
    daid=$(echo "$dep" | cut -d: -f2)
    dver=$(echo "$dep" | cut -d: -f3)
    dtype=$(echo "$dep" | cut -d: -f4)
    process_artifact "$dgid" "$daid" "$dver" "$dtype"
done

echo ""
echo "============================================"
echo "Download Complete"
echo "============================================"
TOTAL=$(cat "$COUNT_FILE")
echo "Total files downloaded: $TOTAL"
