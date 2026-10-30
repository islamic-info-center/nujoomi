#!/bin/sh
set -e
cd "$(dirname "$0")"
cat src/head.part src/icons.part src/i18n.part src/i18n2.part src/main.part src/faces.part src/main2.part src/places.part src/main3.part src/main4.part src/sky.part src/buddy.part src/end.part > src/app.js
npx esbuild src/app.js --bundle --format=esm --minify --target=es2020,safari15 --outfile=../docs/app.js --log-level=warning
