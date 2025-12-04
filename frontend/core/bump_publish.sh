#!/bin/bash

# bump version by 0.0.1 and publish

set -e

echo "Bumping version..."
npm version patch --no-git-tag-version

echo "Building package..."
npm run build

echo "Publishing to npm..."
npm publish

echo "Done!"
