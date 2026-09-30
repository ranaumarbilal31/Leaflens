---
title: LeafLens
emoji: 🌿
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
---

# LeafLens

A leaf-photo checker with a React interface and a FastAPI/PyTorch service.

## Run locally

Use Python 3.11 and Node.js 22. Install `requirements.txt`, then run:

```sh
cd web
npm ci
npm run build
cd ..
python -m uvicorn api.main:app --host 127.0.0.1 --port 7860
```

Open http://localhost:7860. For Docker, build the provided Dockerfile and publish port 7860.

## Checks

```sh
python -m pip install -r requirements-dev.txt
python -m pytest tests
cd web
npm run build
npm run test:e2e
```

The browser tests expect the built application running on port 7860 and a Playwright Chromium installation.

## Model provenance

The supplied checkpoint contains 38 outputs and uses the ResNet9 architecture from the [reference notebook by Atharva Ingle](https://www.kaggle.com/atharvaingle/plant-disease-classification-resnet-99-2). The reference uses augmented data derived from [PlantVillage](https://github.com/spMohanty/PlantVillage-Dataset). The exact training history of the supplied weights is not independently verified. The original 14-class notebook is not the deployed model specification.

Photos are processed in memory and not saved. Predictions are possible matches, not confirmed diagnoses. The model cannot reliably reject non-leaf images. No independently verified field accuracy is claimed.

The original academic documents, screenshots, notebooks, and virtual environment remain local and are excluded from publication. A fuller portfolio README follows in phase two.
