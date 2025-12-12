import time
import os

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image

from extract_frames import extract_frames

FRAMES_DIR = "frames"

app = FastAPI(title="BLIP Caption API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # for Chrome extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load BLIP 
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained(
    "Salesforce/blip-image-captioning-base"
)


def run_blip(image_path: str):
    image = Image.open(image_path).convert("RGB")
    inputs = processor(image, return_tensors="pt")
    start = time.time()
    output = model.generate(**inputs, max_new_tokens=30)
    caption = processor.decode(output[0], skip_special_tokens=True)
    runtime = round(time.time() - start, 2)
    return caption, runtime


@app.post("/caption/blip/url")
async def caption_blip_from_url(url: str):
    frame_paths = extract_frames(url, output_folder=FRAMES_DIR, max_frames=3)
    if not frame_paths:
        return {"error": "Frame extraction failed"}

    # use middle frame
    mid = len(frame_paths) // 2
    caption, runtime = run_blip(frame_paths[mid])

    return {"caption": caption, "runtime_secs": runtime}


@app.post("/caption/blip/file")
async def caption_blip_from_file(file: UploadFile = File(...)):
    tmp_path = "upload_blip_media"
    try:
        with open(tmp_path, "wb") as f:
            f.write(await file.read())

        frame_paths = extract_frames(tmp_path, output_folder=FRAMES_DIR, max_frames=3)
        if not frame_paths:
            return {"error": "Frame extraction failed"}

        mid = len(frame_paths) // 2
        caption, runtime = run_blip(frame_paths[mid])

        return {"caption": caption, "runtime_secs": runtime}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)