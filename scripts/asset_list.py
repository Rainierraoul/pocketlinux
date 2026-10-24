#!/usr/bin/env python3
"""Build a path-safe offline manifest for all static assets."""
import json
import pathlib
import sys
root = pathlib.Path(sys.argv[1]).resolve()
files = []
for path in sorted(root.rglob('*')):
    if not path.is_file() or path.name == 'asset-list.json':
        continue
    rel = path.relative_to(root).as_posix()
    files.append({'path': rel, 'bytes': path.stat().st_size})
manifest = {'version': 1, 'files': files, 'bytes': sum(x['bytes'] for x in files)}
(root / 'asset-list.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
print(f"Manifest: {len(files)} assets / {manifest['bytes']/1048576:.1f} MiB")
