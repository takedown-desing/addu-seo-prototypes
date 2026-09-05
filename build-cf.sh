#!/usr/bin/env bash
# Сборка прототипа под Cloudflare (Worker со статическими ассетами).
# На GitHub Pages сайт лежит в подпапке /addu-seo-prototypes/, на Cloudflare — в корне,
# поэтому абсолютные пути правим на этапе сборки. Исходники в репозитории не меняются.
set -euo pipefail

OUT=dist
rm -rf "$OUT"
mkdir -p "$OUT"

for item in *; do
  case "$item" in dist|functions|build-cf.sh|worker.js|wrangler.jsonc|.gitignore) continue ;; esac
  cp -R "$item" "$OUT/"
done

find "$OUT" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.xml' -o -name '*.json' \) \
  -exec perl -pi -e 's{/addu-seo-prototypes/}{/}g' {} +

echo "собрано страниц: $(find "$OUT" -name 'index.html' | wc -l | tr -d ' ')"
