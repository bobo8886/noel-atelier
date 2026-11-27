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
with zipfile.ZipFile(dist / "noel-atelier.zip", "w", zipfile.ZIP_DEFLATED, compresslevel=8) as bundle:
    bundle.writestr("Open the gift - 打开礼物.html", portable)
    for name in tracked:
        if not name or name.startswith("."):
            continue
        bundle.write(root / name, "Noel Atelier/" + name)
