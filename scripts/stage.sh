#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/vm
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
archive="$work/jslinux-2019-12-21.tar.gz"
# The small 2019 archive is Bellard's downloadable, precompiled TinyEMU demo.
# No dependency on bellard.org after the static GitHub Pages site is deployed.
source_url="${POCKETLINUX_DEMO_URL:-https://bellard.org/tinyemu/jslinux-2019-12-21.tar.gz}"
echo "Fetching upstream archive: $source_url"
if [[ "$source_url" == file://* ]]; then
  cp "${source_url#file://}" "$archive"
else
  curl --fail --location --retry 3 --show-error --silent "$source_url" --output "$archive"
fi
# Pin the official archive verified during deployment.
archive_sha="${BELLARD_ARCHIVE_SHA256:-c57e46f8eab6656cd9ce5c7e2825230177919b147c8c2befd1f327bbdf254088}"
if [[ -n "$archive_sha" ]]; then
  echo "${archive_sha}  $archive" | sha256sum --check --status
fi
mkdir -p "$work/unpacked"
tar xzf "$archive" -C "$work/unpacked" --no-same-owner
vm_cfg="$(find "$work/unpacked" -type f -name root-riscv64.cfg -print -quit)"
if [[ -z "$vm_cfg" ]]; then echo 'Could not find the RISC-V example in upstream archive' >&2; exit 1; fi
upstream="$(dirname "$vm_cfg")"
cp -a "$upstream"/. public/vm/
cp -a site/. public/
python3 scripts/asset_list.py public
printf 'Staged %s files.\n' "$(find public -type f | wc -l)"
