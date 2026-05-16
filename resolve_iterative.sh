#!/bin/bash
# Iteratively resolve missing Maven dependencies
cd /workspace/o2server
M2=~/.m2/repository

while true; do
  # Try to compile x_base_core_project in offline mode
  output=$(mvn compile -DskipTests -o -pl x_base_core_project 2>&1)
  
  if echo "$output" | grep -q "BUILD SUCCESS"; then
    echo "BUILD SUCCESS!"
    break
  fi
  
  # Extract missing artifacts
  missing=$(echo "$output" | grep "has not been downloaded" | sed 's/.*artifact //' | sed 's/ has not.*//' | sort -u)
  
  if [ -z "$missing" ]; then
    echo "No more missing artifacts found, but build still fails:"
    echo "$output" | tail -20
    break
  fi
  
  echo "Found $(echo "$missing" | wc -l) missing artifacts, downloading..."
  
  for artifact in $missing; do
    # Parse groupId:artifactId:packaging:version
    IFS=':' read -r g a p v <<< "$artifact"
    if [ -z "$v" ]; then
      # Try groupId:artifactId:version format
      IFS=':' read -r g a v <<< "$artifact"
      p="jar"
    fi
    
    path=$(echo $g | tr '.' '/')
    dir=$M2/$path/$a/$v
    mkdir -p "$dir"
    base="https://repo1.maven.org/maven2/$path/$a/$v/$a-$v"
    
    if [ "$p" = "pom" ] || [ "$p" = "pom" ]; then
      if [ ! -f "$dir/$a-$v.pom" ]; then
        echo "  Downloading POM: $g:$a:$v"
        curl -sL "$base.pom" -o "$dir/$a-$v.pom" 2>/dev/null
        if [ ! -s "$dir/$a-$v.pom" ]; then
          rm -f "$dir/$a-$v.pom"
          echo "    FAILED"
        fi
      fi
    else
      if [ ! -f "$dir/$a-$v.pom" ]; then
        echo "  Downloading: $g:$a:$v"
        curl -sL "$base.pom" -o "$dir/$a-$v.pom" 2>/dev/null
        curl -sL "$base.jar" -o "$dir/$a-$v.jar" 2>/dev/null
        if [ ! -s "$dir/$a-$v.pom" ]; then
          rm -f "$dir/$a-$v.pom"
        fi
        if [ -f "$dir/$a-$v.jar" ] && [ ! -s "$dir/$a-$v.jar" ]; then
          rm -f "$dir/$a-$v.jar"
        fi
      elif [ ! -f "$dir/$a-$v.jar" ]; then
        echo "  Downloading JAR: $g:$a:$v"
        curl -sL "$base.jar" -o "$dir/$a-$v.jar" 2>/dev/null
        if [ -f "$dir/$a-$v.jar" ] && [ ! -s "$dir/$a-$v.jar" ]; then
          rm -f "$dir/$a-$v.jar"
        fi
      fi
    fi
  done
  
  echo "Retrying build..."
done
