import io
import time
import os

import requests
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
from transformers import Blip2ForConditionalGeneration, Blip2Processor

from extract_frames import extract_frames

MODEL_NAME = "Salesforce/blip2-opt-2.7b"

device = "cpu"
print("Using device for blip_2:", device)

processor = Blip2Processor.from_pretrained(MODEL_NAME)
model = Blip2ForConditionalGeneration.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float32,
    low_cpu_mem_usage=True,
).to(device)

FRAMES_DIR = "frames"

app = FastAPI(title="Video BLIP2 Captioning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for Chrome extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_blip_2(frame_paths):
    """
    Takes a list of JPG frame paths and runs BLIP-2 using all of them
    together as context.
    """
    images = [Image.open(p).convert("RGB") for p in frame_paths]

    start = time.time()
    inputs = processor(images=images, return_tensors="pt").to(device)

    output_ids = model.generate(
        **inputs,
        max_new_tokens=40,
    )
    caption = processor.decode(output_ids[0], skip_special_tokens=True).strip()
    runtime = round(time.time() - start, 2)
    return caption, runtime


@app.post("/caption/blip/url")
async def caption_blip_2_from_url(url: str):
    try:
        frame_paths = extract_frames(url, output_folder=FRAMES_DIR, max_frames=3)
        if not frame_paths:
            return {"error": "Frame extraction failed"}

        caption, runtime = run_blip_2(frame_paths)
        return {"caption": caption, "runtime_secs": runtime}

    except Exception as e:
        print("ERROR in /caption/blip_2/url:", e)
        return {"error": "Internal Server Error", "details": str(e)}


@app.post("/caption/blip_2/file")
async def caption_blip_2_from_file(file: UploadFile = File(...)):
    tmp_path = "upload_blip_2_media"
    try:
        with open(tmp_path, "wb") as f:
            f.write(await file.read())

        frame_paths = extract_frames(tmp_path, output_folder=FRAMES_DIR, max_frames=3)
        if not frame_paths:
            return {"error": "Frame extraction failed"}

        caption, runtime = run_blip_2(frame_paths)
        return {"caption": caption, "runtime_secs": runtime}

    except Exception as e:
        print("ERROR in /caption/blip_2/file:", e)
        return {"error": "Internal Server Error", "details": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)