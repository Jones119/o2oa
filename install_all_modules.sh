#!/bin/bash
set -e

cd /workspace/o2server

echo "=== Step 1: Compile all modules in offline mode ==="
mvn compile -DskipTests -o -T 4 2>&1 | tail -20

echo ""
echo "=== Step 2: Create JARs and install to local repo ==="

# Find all modules with target/classes
for pom in $(find . -name "pom.xml" -not -path "./target/*" | sort); do
    dir=$(dirname "$pom")
    
    # Skip root pom
    if [ "$dir" = "." ]; then
        continue
    fi
    
    # Check if this module has compiled classes
    if [ ! -d "$dir/target/classes" ]; then
        continue
    fi
    
    # Extract artifact info from pom
    artifactId=$(grep -m1 '<artifactId>' "$pom" | sed 's/.*<artifactId>//;s/<\/artifactId>.*//')
    groupId=$(grep -m1 '<groupId>' "$pom" | sed 's/.*<groupId>//;s/<\/groupId>.*//')
    version=$(grep -m1 '<version>' "$pom" | sed 's/.*<version>//;s/<\/version>.*//')
    packaging=$(grep -m1 '<packaging>' "$pom" | sed 's/.*<packaging>//;s/<\/packaging>.*//' || echo "jar")
    
    # Default packaging is jar
    if [ -z "$packaging" ]; then
        packaging="jar"
    fi
    
    # Skip if groupId is inherited (not in this pom)
    if [ -z "$groupId" ]; then
        groupId="net.o2oa"
    fi
    if [ -z "$version" ]; then
        version="10.0"
    fi
    
    echo "  Installing: $groupId:$artifactId:$version ($packaging)"
    
    if [ "$packaging" = "war" ]; then
        # Create WAR file
        mkdir -p "$dir/target/${artifactId}/WEB-INF/classes"
        cp -r "$dir/target/classes/"* "$dir/target/${artifactId}/WEB-INF/classes/" 2>/dev/null || true
        (cd "$dir/target" && jar cf "${artifactId}.war" -C "${artifactId}" . 2>/dev/null) || true
        if [ -f "$dir/target/${artifactId}.war" ]; then
            mvn install:install-file -Dfile="$dir/target/${artifactId}.war" -DgroupId="$groupId" -DartifactId="$artifactId" -Dversion="$version" -Dpackaging=war -o 2>&1 | tail -1
        fi
    else
        # Create JAR file
        (cd "$dir" && jar cf "target/${artifactId}.jar" -C target/classes . 2>/dev/null) || true
        if [ -f "$dir/target/${artifactId}.jar" ]; then
            mvn install:install-file -Dfile="$dir/target/${artifactId}.jar" -DgroupId="$groupId" -DartifactId="$artifactId" -Dversion="$version" -Dpackaging=jar -o 2>&1 | tail -1
        fi
    fi
done

echo ""
echo "=== Step 3: Verify compilation with installed dependencies ==="
mvn compile -DskipTests -o -T 4 2>&1 | grep -E "SUCCESS|FAILURE" | head -60
