#!/bin/bash
set -e
cd /workspace/o2server
REPO=/root/.m2/repository
LOGFILE=build-log.txt

install_module() {
    local module=$1
    local version=10.0
    local artifactId=${module##*/}
    local groupId=net.o2oa
    local groupPath=$(echo "$groupId" | sed 's/\./\//g')
    local localPath="$REPO/${groupPath}/$module/$version"

    mkdir -p "$localPath"
    cp "$module/pom.xml" "$localPath/${artifactId}-${version}.pom" 2>/dev/null

    if [ -d "$module/target/classes" ]; then
        echo "Manifest-Version: 1.0" > /tmp/manifest.txt
        (cd "$module/target/classes" && jar cfm "$localPath/${artifactId}-${version}.jar" /tmp/manifest.txt . 2>/dev/null)
    fi
    if [ -f "$module/target/${artifactId}-${version}.war" ]; then
        cp "$module/target/${artifactId}-${version}.war" "$localPath/${artifactId}-${version}.war"
    fi
    if [ -f "$module/target/${artifactId}-${version}.jar" ]; then
        cp "$module/target/${artifactId}-${version}.jar" "$localPath/${artifactId}-${version}.jar"
    fi
    echo "  Installed: $module"
}

install_all_compiled() {
    for module in x_base_core_project x_query_core_entity x_attendance_core_entity x_ai_core_entity \
                  x_bbs_core_entity x_calendar_core_entity x_cms_core_entity x_component_core_entity \
                  x_file_core_entity x_general_core_entity x_hotpic_core_entity x_jpush_core_entity \
                  x_meeting_core_entity x_message_core_entity x_mind_core_entity x_organization_core_entity \
                  x_portal_core_entity x_processplatform_core_entity x_correlation_core_entity \
                  x_program_center_core_entity x_organization_core_express x_query_core_express \
                  x_correlation_core_express x_processplatform_core_express x_cms_core_express \
                  x_ai_assemble_control x_bbs_assemble_control x_calendar_assemble_control \
                  x_cms_assemble_control x_attendance_assemble_control x_component_assemble_control \
                  x_file_assemble_control x_general_assemble_control x_hotpic_assemble_control \
                  x_meeting_assemble_control x_mind_assemble_control; do
        [ -f "$module/pom.xml" ] && install_module "$module"
    done
}

download_dep() {
    local path=$1
    local url="https://maven.aliyun.com/repository/central/$path"
    local dir=$(dirname "$REPO/$path")
    mkdir -p "$dir"
    local size=0
    [ -f "$REPO/$path" ] && size=$(stat -c%s "$REPO/$path" 2>/dev/null || echo 0)
    if [ "$size" -lt 10000 ]; then
        curl -sL --max-time 60 -o "$REPO/$path" "$url"
        local new_size=$(stat -c%s "$REPO/$path" 2>/dev/null || echo 0)
        if [ "$new_size" -gt 10000 ]; then
            echo "  Downloaded: $path (${new_size} bytes)"
        fi
    fi
}

fix_jackson() {
    if [ -f "$REPO/com/fasterxml/jackson/core/jackson-annotations/2.20.0/jackson-annotations-2.20.0.jar" ]; then
        size=$(stat -c%s "$REPO/com/fasterxml/jackson/core/jackson-annotations/2.20.0/jackson-annotations-2.20.0.jar")
        if [ "$size" -lt 50000 ]; then
            echo "  Fixing corrupted jackson-annotations 2.20.0..."
            rm -f "$REPO/com/fasterxml/jackson/core/jackson-annotations/2.20.0/jackson-annotations-2.20.0.jar"
            download_dep "com/fasterxml/jackson/core/jackson-annotations/2.20.0/jackson-annotations-2.20.0.jar"
        fi
    fi
}

fix_jackson

echo "=== Starting automated build iteration ===" | tee -a "$LOGFILE"
iteration=0
success_count=0

while true; do
    iteration=$((iteration + 1))
    echo "" | tee -a "$LOGFILE"
    echo "=== Iteration $iteration ===" | tee -a "$LOGFILE"

    install_all_compiled

    echo "Running Maven compile..." | tee -a "$LOGFILE"
    output=$(mvn compile -DskipTests -o 2>&1 || true)
    echo "$output" >> "$LOGFILE"

    failed=$(echo "$output" | grep -E "BUILD FAILURE|FAILURE \[" | head -1)
    if [ -z "$failed" ]; then
        echo "=== BUILD SUCCESS ===" | tee -a "$LOGFILE"
        break
    fi

    echo "$output" | tail -30

    echo "Checking for missing dependencies..." | tee -a "$LOGFILE"
    missing=$(echo "$output" | grep "dependency:" | grep -oP "dependency: \K[^ ]+" | sort -u)
    if [ -n "$missing" ]; then
        for dep in $missing; do
            IFS=':' read -ra parts <<< "$dep"
            groupId=${parts[0]}
            artifactId=${parts[1]}
            version=${parts[3]}
            groupPath=$(echo "$groupId" | sed 's/\./\//g')
            path="${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar"
            download_dep "$path"
            pom_path="${path%.jar}.pom"
            download_dep "$pom_path"
        done
    fi

    module_failed=$(echo "$output" | grep "FAILURE \[" | tail -1 | grep -oP "net\.o2oa:[^:]+" | tail -1)
    if [ -n "$module_failed" ]; then
        module_name=$(echo "$module_failed" | cut -d: -f2)
        echo "Module $module_name failed, trying to install deps and skip..." | tee -a "$LOGFILE"

        cd /workspace/o2server
        temp_modules=$(grep -n "<module>" pom.xml | cut -d: -f1)
        echo "Current modules in pom.xml: $temp_modules"
    fi

    current_success=$(echo "$output" | grep "Reactor Summary" -A 100 | grep "SUCCESS" | wc -l)
    if [ "$current_success" -le "$success_count" ]; then
        echo "No progress made, stopping." | tee -a "$LOGFILE"
        break
    fi
    success_count=$current_success

    if [ $iteration -ge 30 ]; then
        echo "Max iterations reached." | tee -a "$LOGFILE"
        break
    fi
done

echo "" | tee -a "$LOGFILE"
echo "=== Build process completed ===" | tee -a "$LOGFILE"
echo "$output" | grep "Reactor Summary" -A 60 | tee -a "$LOGFILE"
