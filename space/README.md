---
title: LeafLens — Plant Leaf Checker
emoji: 🌿
colorFrom: green
colorTo: yellow
sdk: gradio
sdk_version: 6.29.0
python_version: "3.12"
app_file: app.py
pinned: false
short_description: Plant leaf classification across 14 plants and 38 categories
tags: [plant-disease-detection, image-classification, computer-vision, pytorch, react, fastapi, zerogpu]
---

# LeafLens

Check a leaf photo for a possible plant and condition match. This free plant leaf image classifier covers **14 plants and 38 leaf categories**. Upload a JPEG or PNG, try a sample, and explore the supported categories.

[Open the app](https://ranaumarbilal31-leaflens.hf.space/) · [How it works](https://ranaumarbilal31-leaflens.hf.space/how-it-works) · [Source code and full documentation](https://github.com/ranaumarbilal31/leaflens)

![LeafLens interface](https://raw.githubusercontent.com/ranaumarbilal31/leaflens/main/docs/images/leaflens-desktop.png)

## What to expect

- React interface with a PyTorch ResNet9 classifier and Gradio ZeroGPU inference.
- Predictions are possible matches, not confirmed diagnoses. Confidence is not a claim of accuracy.
- The classifier always chooses a supported category; it cannot reliably reject unrelated images.
- The application processes photos in memory without saving an upload history. Hugging Face operates the hosting service.
- Free hosting has usage quotas and may need time to wake up.

Model provenance, preprocessing, supported categories, limitations, and third-party attribution are documented on the [explanation page](https://ranaumarbilal31-leaflens.hf.space/how-it-works) and in the [repository](https://github.com/ranaumarbilal31/leaflens).
