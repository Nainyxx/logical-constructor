#!/usr/bin/env bash
# собирает React-приложение, вшивает его в лаунчер и кросс-компилирует
# под windows/macos/linux — запускать из папки launcher/
set -euo pipefail
cd "$(dirname "$0")"

echo "== npm run build (cons-front) =="
(cd .. && npm run build)

echo "== копирую dist =="
rm -rf dist
cp -r ../dist ./dist

echo "== собираю бинарники =="
rm -rf build
mkdir -p build

build() {
  local goos=$1 goarch=$2 out=$3
  echo "  -> $out"
  # CGO_ENABLED=0 — иначе при сборке linux/amd64 на linux/amd64-хосте Go
  # молча линкует бинарник динамически с glibc хоста, и он не запустится
  # на системе с другой/старой libc (например Alpine)
  CGO_ENABLED=0 GOOS=$goos GOARCH=$goarch go build -trimpath -ldflags="-s -w" -o "build/$out" .
}

build windows amd64 "constructor-windows.exe"
build linux   amd64 "constructor-linux"

chmod +x build/constructor-linux

echo "== готово: launcher/build/ =="
ls -la build
