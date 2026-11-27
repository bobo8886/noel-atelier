"""Generate the correspondence webfont from LXGW WenKai Regular v1.530.

Usage: python tools/subset-letter-font.py LXGWWenKai-Regular.ttf
Requires fonttools[woff] only when regenerating the checked-in font.
"""
from pathlib import Path
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
font = TTFont(sys.argv[1], recalcTimestamp=False)
letters = set()
for lead in range(0xB0, 0xD8):  # GB 2312 first-level Chinese characters
    for trail in range(0xA1, 0xFF):
        letters.update(bytes((lead, trail)).decode("gb2312", errors="ignore"))
for file in ("index.html", "assets/letter.js", "assets/wish-note.js"):
    letters.update((root / file).read_text(encoding="utf-8"))
codes = {ord(letter) for letter in letters if ord(letter) >= 0x3000}
for start, stop in [(0x2000, 0x2070), (0x3000, 0x3040), (0xFF00, 0xFFF0)]:
    codes.update(range(start, stop))
codes.add(0xB7)
options = subset.Options()
options.name_IDs = ["*"]
options.name_languages = ["*"]
sub = subset.Subsetter(options=options)
sub.populate(unicodes=codes)
sub.subset(font)
names = {1: "Noel Letter Hand", 2: "Regular", 3: "NoelLetterHand-Regular-1.530",
         4: "Noel Letter Hand Regular", 6: "NoelLetterHand-Regular",
         16: "Noel Letter Hand", 17: "Regular"}
for record in font["name"].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = "woff2"
font.save(root / "assets/fonts/letter-hand.woff2")
