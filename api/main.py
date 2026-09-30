"""One origin for the LeafLens interface and its CPU prediction API."""

from contextlib import asynccontextmanager
from io import BytesIO
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import UploadFile
from starlette.formparsers import MultiPartException, MultiPartParser

from api.inference import CLASSES, MAX_BYTES, ROOT, InvalidImage, ModelBusy, Predictor

log = logging.getLogger('leaflens')


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.predictor = None
    try:
        app.state.predictor = Predictor()
    except Exception:
        log.exception('Model initialization failed')
    yield
    app.state.predictor = None


app = FastAPI(title='LeafLens API', lifespan=lifespan, docs_url=None, redoc_url=None)


class Prediction(BaseModel):
    class_id: int
    label: str
    plant: str
    condition: str
    confidence: float


class MemoryMultipartParser(MultiPartParser):
    # The request body is bounded before parsing; no upload is spooled to disk.
    spool_max_size = MAX_BYTES + 65_536


@app.get('/api/health')
def health(request: Request):
    ready = request.app.state.predictor is not None
    return JSONResponse({'status': 'ready' if ready else 'unavailable'}, status_code=200 if ready else 503)


@app.get('/api/categories')
def categories():
    return [{'plant': label.split(' - ', 1)[0], 'condition': label.split(' - ', 1)[1]} for label in CLASSES]


@app.post('/api/predict', response_model=Prediction)
async def predict(request: Request):
    if request.app.state.predictor is None:
        raise HTTPException(503, 'The leaf checker is temporarily unavailable. Please try again shortly.')
    if not request.headers.get('content-type', '').lower().startswith('multipart/form-data'):
        raise HTTPException(415, 'Upload your photo using the image picker.')
    body = BytesIO()
    # Count actual bytes, including for chunked requests; do not trust Content-Length.
    async for chunk in request.stream():
        if body.tell() + len(chunk) > MAX_BYTES + 65_536:
            raise HTTPException(413, 'This photo is too large. Choose one under 10 MB.')
        body.write(chunk)

    async def stream():
        yield body.getvalue()

    try:
        parser = MemoryMultipartParser(request.headers, stream(), max_files=1, max_fields=0)
        form = await parser.parse()
    except (MultiPartException, ValueError):
        raise HTTPException(400, 'We could not read this upload. Please choose your photo again.') from None
    try:
        image = form.get('image')
        if not isinstance(image, UploadFile):
            raise HTTPException(422, 'Choose a JPEG or PNG photo to get started.')
        content = await image.read(MAX_BYTES + 1)
        if len(content) > MAX_BYTES:
            raise HTTPException(413, 'This photo is too large. Choose one under 10 MB.')
        return await run_in_threadpool(request.app.state.predictor.predict, content)
    except InvalidImage as exc:
        raise HTTPException(422, str(exc)) from None
    except ModelBusy:
        raise HTTPException(429, 'The leaf checker is helping someone else. Try again in a moment.', headers={'Retry-After': '2'}) from None
    except HTTPException:
        raise
    except Exception:
        log.exception('Prediction failed')
        raise HTTPException(500, 'We could not finish this check. Please try again.') from None
    finally:
        await form.close()
        body.close()


WEB = ROOT / 'web' / 'dist'
if WEB.exists():
    app.mount('/assets', StaticFiles(directory=WEB / 'assets'), name='assets')
    app.mount('/samples', StaticFiles(directory=WEB / 'samples'), name='samples')
    app.mount('/licenses', StaticFiles(directory=WEB / 'licenses'), name='licenses')

    @app.get('/favicon.svg', include_in_schema=False)
    def favicon():
        return FileResponse(WEB / 'favicon.svg')

    @app.get('/', include_in_schema=False)
    @app.get('/how-it-works', include_in_schema=False)
    def interface():
        return FileResponse(WEB / 'index.html')
