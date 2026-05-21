#!/usr/bin/env bash
# Demo app iOS unit tests (DemoAppExpoTests) + Swift coverage for Sonar (packages/*/ios/*.swift)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
IOS="$ROOT/DemoAppExpo/ios"
OUT="$ROOT/tests-report/coverage"
LCOV="$OUT/swift.lcov"
XML="$OUT/swift-sonar-generic.xml"

write_empty_xml() {
  mkdir -p "$OUT"
  printf '%s\n' '<?xml version="1.0" encoding="UTF-8"?>' '<coverage version="1">' '</coverage>' > "$XML"
}

if [[ "$(uname -s)" != "Darwin" ]]; then
  write_empty_xml
  echo "Non-macOS: empty Swift coverage stub at $XML"
  exit 0
fi

command -v xcodebuild >/dev/null 2>&1 || {
  echo "xcodebuild not found"
  write_empty_xml
  exit 0
}

DEST="platform=iOS Simulator,name=iPhone 16"
if ! xcrun simctl list devices available 2>/dev/null | grep -q "iPhone 16"; then
  if xcrun simctl list devices available 2>/dev/null | grep -q "iPhone 15"; then
    DEST="platform=iOS Simulator,name=iPhone 15"
  else
    DEST="generic/platform=iOS Simulator"
  fi
fi

DERIVED="$IOS/.derived-test-coverage"
rm -rf "$DERIVED"
mkdir -p "$OUT"

cd "$IOS"
pod install

xcodebuild test \
  -workspace DemoAppExpo.xcworkspace \
  -scheme DemoAppExpo \
  -destination "$DEST" \
  -derivedDataPath "$DERIVED" \
  -enableCodeCoverage YES \
  -only-testing:DemoAppExpoTests

PROFILES=()
while IFS= read -r p; do
  [[ -n "$p" ]] && PROFILES+=("$p")
done < <(find "$DERIVED/Build/ProfileData" -name "*.profdata" 2>/dev/null || true)
if [[ ${#PROFILES[@]} -eq 0 ]]; then
  echo "No .profdata found; empty Swift Sonar XML"
  write_empty_xml
  exit 0
fi

if [[ ${#PROFILES[@]} -eq 1 ]]; then
  MERGED="${PROFILES[0]}"
else
  MERGED="$DERIVED/merged.profdata"
  xcrun llvm-profdata merge -sparse "${PROFILES[@]}" -o "$MERGED"
fi

OBJECT_ARGS=()
while IFS= read -r bin; do
  [[ -f "$bin" ]] && OBJECT_ARGS+=(-object "$bin")
done < <(find "$DERIVED/Build/Products" -type f \( \
  -path "*/PaysafeVenmo.framework/PaysafeVenmo" \
  -o -path "*/PaysafeCardPayments.framework/PaysafeCardPayments" \
  -o -path "*/paysafe_payments_sdk_common.framework/paysafe_payments_sdk_common" \
  -o -path "*/libreact-native-paysafe-apple-pay.a" \
  \) 2>/dev/null)

while IFS= read -r xct; do
  exe="$xct/DemoAppExpoTests"
  if [[ -f "$exe" ]]; then
    OBJECT_ARGS+=(-object "$exe")
    break
  fi
done < <(find "$DERIVED" -name "DemoAppExpoTests.xctest" -type d 2>/dev/null)

if [[ ${#OBJECT_ARGS[@]} -eq 0 ]]; then
  echo "No coverage binaries found; empty Swift Sonar XML"
  write_empty_xml
  exit 0
fi

set +e
xcrun llvm-cov export "${OBJECT_ARGS[@]}" -instr-profile="$MERGED" -format=lcov >"$LCOV" 2>/dev/null
COV=$?
set -e
if [[ $COV -ne 0 ]] || [[ ! -s "$LCOV" ]]; then
  echo "llvm-cov export failed or empty; empty Swift Sonar XML"
  write_empty_xml
  exit 0
fi

node "$ROOT/scripts/lcov-to-sonar-generic.js" "$LCOV" "$ROOT" "$XML"
echo "Swift coverage for Sonar: $XML"
