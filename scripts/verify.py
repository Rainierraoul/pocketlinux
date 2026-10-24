#!/usr/bin/env python3
"""Static site sanity checks; not a replacement for an actual Safari boot test."""
import json
import pathlib
import sys
root = pathlib.Path(sys.argv[1])
needed = ['index.html', 'app.js', 'app.css', 'sw.js', 'manifest.webmanifest',
          'asset-list.json', 'vm/index.html', 'vm/jslinux.js', 'vm/root-riscv64.cfg',
          'vm/riscvemu64-wasm.js', 'vm/riscvemu64-wasm.wasm']
missing = [p for p in needed if not (root / p).is_file()]
if missing:
    raise SystemExit('Missing files: ' + ', '.join(missing))
manifest = json.loads((root / 'asset-list.json').read_text())
for entry in manifest['files']:
    path = (root / entry['path']).resolve()
    if root.resolve() not in path.parents or not path.is_file() or path.stat().st_size != entry['bytes']:
        raise SystemExit('Invalid manifest item: ' + entry['path'])
print(f"Verified {len(needed)} required entrypoints and {len(manifest['files'])} asset references")
