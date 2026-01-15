#!/bin/bash

version=$(npx expo config --json | jq -r .version)
build_number=$(eas build:version:get -p android | grep -oE '[0-9]+$')
output="./builds/burrow-${version}-${build_number}.aab"

eas build --platform android --clear-cache --local --output "$output"
eas submit --platform android --path "$output"
