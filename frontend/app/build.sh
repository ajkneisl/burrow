#!/bin/bash

version=$(npx expo config --json | jq -r .version)
build_number=$(eas build:version:get -p ios | grep -oE '[0-9]+$')
output="builds/burrow-${version}-${build_number}.ipa"

eas build --platform ios --clear-cache --local --output "$output"
xcrun altool --upload-app -f "$output" -t ios -u "$APPLE_ID" -p "$APPLE_SP"