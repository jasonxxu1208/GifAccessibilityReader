import time
import os

import torch
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from mobileclip import create_model_and_transforms
from open_clip import tokenize
from extract_frames import extract_frames

FRAMES_DIR = "frames"
MODEL_PATH = "models/mobileclip_s0.pt"

# Load MobileCLIP
model, _, preprocess = create_model_and_transforms(
    model_name="mobileclip_s0",
    pretrained=MODEL_PATH,
)

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Using device for MobileCLIP:", device)
model.to(device)
model.eval()

# Load ImageNet class names
with open("models/imagenet_classes.txt", "r") as f:
    IMAGENET_CLASSES = [line.strip() for line in f.readlines()]

app = FastAPI(title="MobileCLIP Caption API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for Chrome extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_mobileclip(image_path: str):
    img = Image.open(image_path).convert("RGB")
    image_tensor = preprocess(img).unsqueeze(0).to(device)

    start = time.time()
    with torch.no_grad():
        image_features = model.encode_image(image_tensor)
        text_tokens = tokenize(IMAGENET_CLASSES).to(device)
        text_features = model.encode_text(text_tokens)
        similarity = (image_features @ text_features.T).squeeze(0)
        top5 = torch.topk(similarity, 5)
        results = [IMAGENET_CLASSES[idx] for idx in top5.indices.tolist()]
    runtime = round(time.time() - start, 2)

    return results, runtime


@app.post("/caption/blip/url")
async def caption_mobileclip_from_url(url: str):
    try:
        frame_paths = extract_frames(url, output_folder=FRAMES_DIR, max_frames=3)
        if not frame_paths:
            return {"error": "Frame extraction failed"}

        mid = len(frame_paths) // 2
        labels, runtime = run_mobileclip(frame_paths[mid])

        return {
            "top5_predictions": labels,
            "frame_used": frame_paths[mid],
            "runtime_secs": runtime,
        }

    except Exception as e:
        print("ERROR in /caption/mobileclip/url:", e)
        return {"error": "Internal Server Error", "details": str(e)}


@app.post("/caption/mobileclip/file")
async def caption_mobileclip_from_file(file: UploadFile = File(...)):
    tmp_path = "upload_mobileclip_media"
    try:
        with open(tmp_path, "wb") as f:
            f.write(await file.read())

        frame_paths = extract_frames(tmp_path, output_folder=FRAMES_DIR, max_frames=3)
        if not frame_paths:
            return {"error": "Frame extraction failed"}

        mid = len(frame_paths) // 2
        labels, runtime = run_mobileclip(frame_paths[mid])

        return {
            "top5_predictions": labels,
            "frame_used": frame_paths[mid],
            "runtime_secs": runtime,
        }

    except Exception as e:
        print("ERROR in /caption/mobileclip/file:", e)
        return {"error": "Internal Server Error", "details": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)