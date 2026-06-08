#!/bin/bash

set -e
set -o pipefail

GRADLE_COMMANDS=("testDebugUnitTest" "jacocoUnitTestReport")
GRADLE_COMMANDS_DEMO_APP=("testDebugUnitTest" "jacocoUnitTestReportDemo")

PROJECTS=$(find . -maxdepth 3 -type d -name "android" -not -path "*/node_modules/*")
echo "$PROJECTS"

for PROJECT in $PROJECTS; do
    echo "Running tests in $PROJECT"
    cd "$PROJECT" || { echo "Failed to enter $PROJECT"; exit 1; }

    if [[ "$PROJECT" == *"DemoAppExpo"* ]]; then
        echo "Skipping Kotlin unit tests in the demo app."
    else
        GRADLEW_PATH="../../../gradlew"
        for CMD in "${GRADLE_COMMANDS[@]}"; do
            echo "Executing $GRADLEW_PATH $CMD in $PROJECT with full stacktrace"

            if ! $GRADLEW_PATH "$CMD" --stacktrace --info; then
                echo "Error: Command gradlew $CMD failed in $PROJECT"
                cd - > /dev/null || exit 1
                exit 1
            fi
        done
    fi
    cd - > /dev/null || exit 1
done

echo "All tests completed successfully."
