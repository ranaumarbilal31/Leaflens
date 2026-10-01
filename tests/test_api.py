from io import BytesIO
from pathlib import Path
import struct
import zlib

from fastapi.testclient import TestClient
from PIL import Image, ImageOps
import pytest
import torch
from torchvision.transforms.functional import to_tensor

from api.inference import CLASSES, MAX_BYTES, prepare_image
from api.main import app


@pytest.fixture(scope='module')
def client():
    with TestClient(app) as client:
        yield client


def image_bytes(mode='RGB', size=(128, 128), fmt='PNG', **kwargs):
    data = BytesIO()
    Image.new(mode, size).save(data, format=fmt, **kwargs)
    return data.getvalue()


def upload(client, content, name='leaf.png'):
    return client.post('/api/predict', files={'image': (name, content)})


def test_ready_and_categories(client):
    assert client.get('/api/health').json() == {'status': 'ready'}
    categories = client.get('/api/categories').json()
    assert len(categories) == 38
    assert len({category['plant'] for category in categories}) == 14


def test_built_interface_routes(client):
    if not Path('web/dist/index.html').exists():
        pytest.skip('Build the frontend to verify static routes')
    for path in ['/', '/how-it-works', '/favicon.svg', '/samples/1.png', '/licenses/dm-sans.txt']:
        assert client.get(path).status_code == 200
    assert client.get('/api/missing').status_code == 404


def test_crawlable_pages_and_metadata(client):
    if not Path('web/dist/index.html').exists():
        pytest.skip('Build the frontend before checking prerendered content')
    home = client.get('/').text
    about = client.get('/how-it-works').text
    assert 'Get to know' in home and '<h1>' in home
    assert 'A closer look at' in about and 'checkpoint' in about
    assert '<title>LeafLens' in home
    assert '<title>How LeafLens Works' in about
    for html in (home, about):
        assert 'application/ld+json' in html
        assert 'name="description"' in html
        assert 'index, follow' in html
    from urllib.robotparser import RobotFileParser
    parser = RobotFileParser()
    parser.parse(client.get('/robots.txt').text.splitlines())
    for agent in ('Googlebot', 'bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot'):
        assert parser.can_fetch(agent, '/how-it-works')
        assert parser.can_fetch(agent, '/assets/index.js')
        assert not parser.can_fetch(agent, '/api/predict')
    import xml.etree.ElementTree as ET
    xml = ET.fromstring(client.get('/sitemap.xml').text)
    assert len(xml) == 2
    assert 'not confirmed diagnoses' in client.get('/llms.txt').text
    assert client.get('/social-preview.png').headers['content-type'] == 'image/png'


@pytest.mark.parametrize('filename,expected', [('1.png',19), ('2.png',8), ('3.png',26)])
def test_actual_checkpoint_samples(client, filename, expected):
    content = (Path('test images') / filename).read_bytes()
    response = upload(client, content)
    assert response.status_code == 200
    result = response.json()
    assert result['class_id'] == expected
    assert result['label'] == CLASSES[expected]
    assert 0 <= result['confidence'] <= 100
    # Results must be repeatable and not change with application state.
    assert upload(client, content).json() == result


@pytest.mark.parametrize('mode,size', [('RGB',(120,720)), ('RGB',(720,120)), ('L',(256,256)), ('RGBA',(300,400)), ('P',(140,300))])
def test_image_variants(client, mode, size):
    data = image_bytes(mode, size)
    tensor = prepare_image(data)
    assert tensor.shape == (1,3,256,256)
    assert tensor.dtype == torch.float32
    assert 0 <= tensor.min() <= tensor.max() <= 1
    assert upload(client, data).status_code == 200


def test_transparency_is_white():
    tensor = prepare_image(image_bytes('RGBA'))
    assert torch.all(tensor == 1)


def test_exif_orientation():
    image = Image.new('RGB', (300,100), 'green')
    for x in range(100):
        for y in range(100):
            image.putpixel((x,y), (220,40,40))
    exif = image.getexif(); exif[274] = 6
    buffer = BytesIO(); image.save(buffer, format='JPEG', exif=exif)
    data = buffer.getvalue()
    with Image.open(BytesIO(data)) as source:
        expected = to_tensor(ImageOps.exif_transpose(source).convert('RGB').resize((256,256),Image.Resampling.BILINEAR)).unsqueeze(0)
    assert torch.equal(prepare_image(data), expected)


@pytest.mark.parametrize('content', [b'', b'not an image', image_bytes()[:45], image_bytes(fmt='GIF')])
def test_bad_uploads(client, content):
    response = upload(client,content)
    assert response.status_code == 422
    assert isinstance(response.json()['detail'],str)


def test_oversized_file(client):
    assert upload(client,b'x' * (MAX_BYTES+1)).status_code == 413
    assert upload(client,b'x' * (MAX_BYTES+100_000)).status_code == 413


def test_pixel_limit(client):
    # Change the PNG dimensions and checksum without allocating a 20 MP image.
    data = bytearray(image_bytes())
    data[16:24] = struct.pack('>II',5000,4001)
    data[29:33] = struct.pack('>I',zlib.crc32(data[12:29]))
    response = upload(client,bytes(data))
    assert response.status_code == 422
    assert 'megapixels' in response.json()['detail']


def test_busy_is_bounded(client):
    predictor = app.state.predictor
    with predictor._slot:
        response = upload(client,image_bytes())
    assert response.status_code == 429
    assert response.headers['retry-after'] == '2'
    assert upload(client,image_bytes()).status_code == 200


def test_failure_releases_slot(client):
    assert upload(client,b'broken').status_code == 422
    assert upload(client,image_bytes()).status_code == 200


def test_model_unavailable(client):
    predictor = app.state.predictor
    app.state.predictor = None
    try:
        assert client.get('/api/health').status_code == 503
        assert upload(client,image_bytes()).status_code == 503
    finally:
        app.state.predictor = predictor


def test_request_validation(client):
    assert client.post('/api/predict',json={}).status_code == 415
    assert client.post('/api/predict',files={'wrong':('leaf.png',image_bytes())}).status_code == 422
    assert client.post('/api/predict',files=[('image',('a.png',image_bytes())),('image',('b.png',image_bytes()))]).status_code == 400
    assert client.post('/api/predict',content=b'invalid',headers={'content-type':'multipart/form-data'}).status_code == 400


def test_upload_stays_in_memory(client, monkeypatch):
    from tempfile import SpooledTemporaryFile
    def forbid_rollover(self):
        raise AssertionError('Upload must not be written to disk')
    monkeypatch.setattr(SpooledTemporaryFile,'rollover',forbid_rollover)
    padded = image_bytes() + b'\0' * 2_000_000
    assert upload(client,padded).status_code == 200
