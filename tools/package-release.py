"""Assemble the playable HTML and a source edition with local camera tracking."""
from pathlib import Path
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
dist.mkdir(exist_ok=True)
portable = (root / "assets/gift-template.html").read_bytes()
(dist / "noel-atelier-offline.html").write_bytes(portable)
tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")

def add_file(bundle, name, content):
    # Fixed ZIP timestamps and modes keep re-built release archives identical.
    entry = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
    entry.create_system = 3
    entry.external_attr = 0o100644 << 16
    bundle.writestr(entry, content, compress_type=zipfile.ZIP_DEFLATED, compresslevel=8)

with zipfile.ZipFile(dist / "noel-atelier.zip", "w", zipfile.ZIP_DEFLATED, compresslevel=8) as bundle:
    add_file(bundle, "Open the gift - 打开礼物.html", portable)
    for name in tracked:
        if not name or name.startswith("."):
            continue
        add_file(bundle, "Noel Atelier/" + name, (root / name).read_bytes())
