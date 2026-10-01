"""The custom React interface, backed by Gradio's metered ZeroGPU queue."""

import os

# Disable telemetry and image/input run history. Import spaces before torch.
os.environ['GRADIO_ANALYTICS_ENABLED'] = 'False'
import spaces
import base64
import binascii
from contextlib import asynccontextmanager

import gradio as gr
import torch

from api.inference import CLASSES, MAX_BYTES, ROOT, InvalidImage, prepare_image
from api.main import app
from utils.model import ResNet9

# A CPU option exists only for local integration tests. Spaces uses CUDA.
DEVICE = 'cuda' if os.environ.get('SPACE_ID') else 'cpu'
torch.set_num_threads(2)
model = ResNet9(3, len(CLASSES))
model.load_state_dict(torch.load(ROOT / 'models/plant_model.pth', map_location='cpu', weights_only=True))
model.eval().to(DEVICE)


@spaces.GPU(duration=10)
def check_leaf(photo: str):
    """Base64 transport avoids Gradio's disk-based file upload cache."""
    if len(photo) > 4 * ((MAX_BYTES + 2) // 3):
        raise gr.Error('This photo is too large. Choose one under 10 MB.')
    try:
        content = base64.b64decode(photo, validate=True)
        tensor = prepare_image(content).to(DEVICE)
    except (binascii.Error, ValueError, InvalidImage) as exc:
        raise gr.Error(str(exc) if isinstance(exc, InvalidImage) else 'We could not read this photo. Try another JPEG or PNG.') from None
    with torch.inference_mode():
        scores = model(tensor).softmax(dim=1)[0].cpu()
    index = int(scores.argmax())
    label = CLASSES[index]
    plant, condition = label.split(' - ', 1)
    return {'class_id': index, 'label': label, 'plant': plant, 'condition': condition, 'confidence': round(float(scores[index]) * 100, 2)}


with gr.Blocks(analytics_enabled=False) as demo:
    photo = gr.Textbox(label='Photo encoded as base64', max_lines=1)
    output = gr.JSON(label='Leaf prediction')
    button = gr.Button('Check leaf')
    button.click(check_leaf, inputs=photo, outputs=output, api_name='check_leaf', concurrency_limit=1)

demo.queue(max_size=8, default_concurrency_limit=1)


@asynccontextmanager
async def hosted_lifespan(application):
    application.state.hosted_gpu = True
    yield


def main():
    # Gradio launch runs Spaces' GPU registration and uses its assigned port.
    # Register our customer-facing routes before Gradio's default homepage.
    demo.launch(
        app_kwargs={'routes': app.router.routes, 'lifespan': hosted_lifespan},
        server_name='0.0.0.0',
        server_port=int(os.environ.get('GRADIO_SERVER_PORT', '7860')),
        ssr_mode=False,
        enable_monitoring=False,
        run_history=False,
        show_error=True,
        share=False,
    )


if __name__ == '__main__':
    main()
