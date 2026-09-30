"""The deployed checkpoint's label order and deterministic inference pipeline."""

from io import BytesIO
from pathlib import Path
import threading
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError
import torch
from torchvision.transforms.functional import to_tensor

from utils.model import ResNet9

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 20_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

# Checkpoint outputs follow the 38-class ImageFolder alphabetical order.
CLASSES = [
    'Apple - Apple scab', 'Apple - Black rot', 'Apple - Cedar apple rust', 'Apple - Healthy',
    'Blueberry - Healthy', 'Cherry - Powdery mildew', 'Cherry - Healthy',
    'Corn - Cercospora leaf spot / Gray leaf spot', 'Corn - Common rust',
    'Corn - Northern Leaf Blight', 'Corn - Healthy', 'Grape - Black rot',
    'Grape - Esca (Black Measles)', 'Grape - Leaf blight (Isariopsis Leaf Spot)',
    'Grape - Healthy', 'Orange - Huanglongbing (Citrus greening)', 'Peach - Bacterial spot',
    'Peach - Healthy', 'Pepper, bell - Bacterial spot', 'Pepper, bell - Healthy',
    'Potato - Early blight', 'Potato - Late blight', 'Potato - Healthy',
    'Raspberry - Healthy', 'Soybean - Healthy', 'Squash - Powdery mildew',
    'Strawberry - Leaf scorch', 'Strawberry - Healthy', 'Tomato - Bacterial spot',
    'Tomato - Early blight', 'Tomato - Late blight', 'Tomato - Leaf Mold',
    'Tomato - Septoria leaf spot', 'Tomato - Spider mites (Two-spotted spider mite)',
    'Tomato - Target Spot', 'Tomato - Tomato Yellow Leaf Curl Virus',
    'Tomato - Tomato mosaic virus', 'Tomato - Healthy',
]


class InvalidImage(ValueError):
    pass


class ModelBusy(Exception):
    pass


def prepare_image(content: bytes) -> torch.Tensor:
    if not content:
        raise InvalidImage('Choose a JPEG or PNG photo to get started.')
    if len(content) > MAX_BYTES:
        raise InvalidImage('This photo is too large. Choose one under 10 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as source:
                if source.format not in {'JPEG', 'PNG'}:
                    raise InvalidImage('Please use a JPEG or PNG photo.')
                if source.width * source.height > MAX_PIXELS:
                    raise InvalidImage('This photo has too many pixels. Choose one under 20 megapixels.')
                source.verify()
            with Image.open(BytesIO(content)) as source:
                oriented = ImageOps.exif_transpose(source)
                # White compositing avoids turning transparent PNG backgrounds black.
                if oriented.mode in {'RGBA', 'LA'} or 'transparency' in oriented.info:
                    rgba = oriented.convert('RGBA')
                    image = Image.new('RGB', rgba.size, 'white')
                    image.paste(rgba, mask=rgba.getchannel('A'))
                else:
                    image = oriented.convert('RGB')
                image = image.resize((256, 256), Image.Resampling.BILINEAR)
                return to_tensor(image).unsqueeze(0)
    except InvalidImage:
        raise
    except (Image.DecompressionBombWarning, Image.DecompressionBombError):
        raise InvalidImage('This photo has too many pixels. Choose one under 20 megapixels.') from None
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError):
        raise InvalidImage('We could not read this photo. Try a different JPEG or PNG.') from None


class Predictor:
    def __init__(self, model_path: Path = ROOT / 'models' / 'plant_model.pth'):
        torch.set_num_threads(2)
        self.model = ResNet9(3, len(CLASSES))
        weights = torch.load(model_path, map_location='cpu', weights_only=True)
        self.model.load_state_dict(weights, strict=True)
        self.model.eval()
        self._slot = threading.Lock()

    def predict(self, content: bytes) -> dict:
        # Fail fast rather than creating an unbounded CPU/memory queue.
        if not self._slot.acquire(blocking=False):
            raise ModelBusy()
        try:
            tensor = prepare_image(content)
            with torch.inference_mode():
                probabilities = self.model(tensor).softmax(dim=1)[0]
            index = int(probabilities.argmax())
            label = CLASSES[index]
            plant, condition = label.split(' - ', 1)
            return {
                'class_id': index,
                'label': label,
                'plant': plant,
                'condition': condition,
                'confidence': round(float(probabilities[index]) * 100, 2),
            }
        finally:
            self._slot.release()
