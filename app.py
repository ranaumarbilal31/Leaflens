"""Hugging Face entry point; fetch only the pinned, checksum-verified release."""
import hashlib
from io import BytesIO
import os
from pathlib import Path
import sys
import tempfile
from urllib.request import urlopen
import zipfile

RELEASE = 'https://github.com/ranaumarbilal31/leaflens/releases/download/v1.0.0-demo.3/leaflens-space.zip'
SHA256 = 'fc3bb8ee2848e879ae9b7687623ac48283269b68cc9822fc6a5bb09c4d9a3dc0'


def main():
    with urlopen(RELEASE, timeout=120) as response:
        bundle = response.read(40 * 1024 * 1024 + 1)
    if hashlib.sha256(bundle).hexdigest() != SHA256:
        raise RuntimeError('The deployment bundle failed its integrity check.')
    root = Path(tempfile.mkdtemp(prefix='leaflens-')).resolve()
    with zipfile.ZipFile(BytesIO(bundle)) as archive:
        for member in archive.infolist():
            if not (root / member.filename).resolve().is_relative_to(root):
                raise RuntimeError('Invalid deployment archive path.')
        archive.extractall(root)
    sys.path.insert(0, str(root))
    os.chdir(root)
    from space.backend import main as serve
    serve()


if __name__ == '__main__':
    main()
