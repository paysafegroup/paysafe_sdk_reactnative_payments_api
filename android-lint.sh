#!/bin/bash

set -e
set -o pipefail

PROJECTS=$(find . -maxdepth 3 -type d -name "android" -not -path "*/node_modules/*" -not -path "./demo/demo-app/android" -not -path "./DemoAppExpo/*")

echo "$PROJECTS"

for PROJECT in $PROJECTS; do
    echo "Running lint in $PROJECT"
    cd "$PROJECT" || { echo "Failed to enter $PROJECT"; exit 1; }

    if ! ../../.././gradlew ktlintCheck; then
        echo "Error: ktlintCheck failed in $PROJECT"

        REPORT_PATH="./app/build/reports/ktlint/ktlintMainSourceSetCheck/ktlintMainSourceSetCheck.json"
        if [ -f "$REPORT_PATH" ]; then
            cp "$REPORT_PATH" "$OLDPWD/ktlint-output.json"
        fi

        exit 1
    fi

    cd - > /dev/null
done
