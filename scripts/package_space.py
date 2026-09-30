"""Build a small, allowlisted Space release from the current frontend build."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / '.local/leaflens-space.zip'
TARGET.parent.mkdir(exist_ok=True)
files = []
for directory in ('api', 'space', 'web/dist'):
    files.extend(path for path in (ROOT / directory).rglob('*') if path.is_file() and '__pycache__' not in path.parts)
files.extend(ROOT / name for name in ('utils/model.py', 'models/plant_model.pth', 'THIRD_PARTY_NOTICES.md'))
assert (ROOT / 'web/dist/index.html').is_file(), 'Build the frontend first'
with zipfile.ZipFile(TARGET, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(files):
        info = zipfile.ZipInfo(path.relative_to(ROOT).as_posix(), (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, path.read_bytes())
print(TARGET)
print('SHA256:', hashlib.sha256(TARGET.read_bytes()).hexdigest())
print('Bytes:', TARGET.stat().st_size)
