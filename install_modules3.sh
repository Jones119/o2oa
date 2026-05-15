#!/bin/bash
cd /workspace/o2server

echo "=== Installing all compiled modules with their real POMs ==="

for dir in $(ls -d x_*/); do
    dir=${dir%/}
    
    if [ ! -d "$dir/target/classes" ]; then
        continue
    fi
    
    artifactId="$dir"
    groupId="net.o2oa"
    version="10.0"
    
    packaging="jar"
    if grep -q '<packaging>war</packaging>' "$dir/pom.xml" 2>/dev/null; then
        packaging="war"
    fi
    
    if [ "$packaging" = "war" ]; then
        warDir="$dir/target/${artifactId}"
        rm -rf "$warDir"
        mkdir -p "$warDir/WEB-INF/classes"
        cp -r "$dir/target/classes/"* "$warDir/WEB-INF/classes/" 2>/dev/null || true
        (cd "$dir/target" && jar cf "${artifactId}.war" -C "${artifactId}" . 2>/dev/null) || true
        if [ -f "$dir/target/${artifactId}.war" ]; then
            mvn install:install-file \
                -Dfile="$dir/target/${artifactId}.war" \
                -DgroupId="$groupId" \
                -DartifactId="$artifactId" \
                -Dversion="$version" \
                -Dpackaging=war \
                -DpomFile="$dir/pom.xml" \
                -o 2>/dev/null
            echo "  INSTALLED WAR: $artifactId (with real POM)"
        fi
    else
        (cd "$dir" && jar cf "target/${artifactId}.jar" -C target/classes . 2>/dev/null) || true
        if [ -f "$dir/target/${artifactId}.jar" ]; then
            mvn install:install-file \
                -Dfile="$dir/target/${artifactId}.jar" \
                -DgroupId="$groupId" \
                -DartifactId="$artifactId" \
                -Dversion="$version" \
                -Dpackaging=jar \
                -DpomFile="$dir/pom.xml" \
                -o 2>/dev/null
            echo "  INSTALLED JAR: $artifactId (with real POM)"
        fi
    fi
done

echo ""
echo "=== Re-compiling with installed dependencies ==="
mvn compile -DskipTests -o -T 4 2>&1 | grep -E "SUCCESS|FAILURE" | head -60
