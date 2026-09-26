#!/bin/sh
set -eu

TEMPLATE=/usr/share/nginx/html/assets/runtime-config.template.js
OUTPUT=/usr/share/nginx/html/assets/runtime-config.js

# tránh lỗi nếu từng tồn tại directory sai
rm -rf "$OUTPUT"

# replace biến môi trường (không dùng gettext)
sed "s|\${WHS_API_URL:-/api/v1/}|${WHS_API_URL:-/api/v1/}|g" "$TEMPLATE" > "$OUTPUT"

echo "runtime-config generated: WHS_API_URL=${WHS_API_URL:-/api/v1/}"
