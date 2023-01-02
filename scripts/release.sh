#!/bin/bash

set -eux
TAG="$(git describe --tags)"

npm run build-production
7z a "kagimori-${TAG}.zip" dist icons static manifest.json LICENSE README.md
7z a "kagimori-${TAG}.src.zip" . -x!dist -x!node_modules -x!*.zip
