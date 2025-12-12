# GIF Accessibility Reader  
**Local ML Rebuild & Model Comparison**

**Author:** Jason Xu  
**Advisor:** Prof. Min Chen  
**Course:** CSS 497 – Capstone  
**University of Washington Bothell**

---

## Project Overview

GIFs and short animated videos are widely used on modern web platforms but remain largely inaccessible to visually impaired users because screen readers cannot interpret motion or visual context. The original GIF Accessibility Reader (2023) relied on a legacy codebase and produced single-frame captions with limited accuracy.

This project rebuilds the entire system using a modern FastAPI backend and evaluates multiple vision-language models to determine the most effective captioning strategy for animated content. The system supports both a **Chrome Extension** for real-time accessibility and a **TestBench Web App** for model evaluation and benchmarking.

---

## System Architecture

The project consists of three main components:

### 1. FastAPI Backend
- Provides a single unified captioning endpoint: /caption/blip/url
- Internally runs **one model at a time**, depending on which backend module is started.
- Supported models:
- **BLIP** (default, fast, real-time use)
- **MobileCLIP** (classification baseline)
- **BLIP-2** (multi-frame, high-quality captions)

Model selection is done **at backend startup**, not in the frontend.

---

### 2. Chrome Extension (`GifBrowserExtension`)
- Detects GIFs and short MP4 videos on webpages using a `MutationObserver`
- Sends media URLs to the backend
- Injects accessibility attributes into the DOM:
- `alt` text for GIFs
- `aria-label` for videos
- Highlights processed elements for visual confirmation

---

### 3. TestBench Web App (`GifTestBenchWebApp`)
- React-based web application
- Used to upload GIFs/videos and observe caption outputs
- Designed for evaluation and comparison during development
- Uses the same backend endpoint as the Chrome Extension

---

## Model Weights (Important)

### MobileCLIP model weights are NOT included in this repository

Due to GitHub file size limitations, **model weight files (`.pt`) are intentionally excluded** from this repository.

### How to download MobileCLIP

Download the MobileCLIP model weights from the official source:

- **MobileCLIP (Apple Research):**  
https://github.com/apple/ml-mobileclip

After downloading, place the model file here: submission/models/mobileclip_s0.pt
> Note: BLIP and BLIP-2 weights are loaded via their respective libraries and are not stored directly in this repository.

---

## How to Run the Project

### 1. Backend Setup

Create and activate a Python virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
Install dependencies: pip install -r requirements.txt
Run one backend at a time:
**Run BLIP (default, recommended)**
uvicorn api_blip:app --reload
**Run MobileCLIP**
uvicorn api_mobileclip:app --reload
**Run BLIP-2**
uvicorn api_blip2:app --reload
The backend will run at: http://127.0.0.1:8000

### 2. Chrome Extension

Open Chrome

Go to:

chrome://extensions


Enable Developer mode

Click Load unpacked

Select:

submission/GifBrowserExtension


Visit a webpage with GIFs (e.g., Twitter, Reddit)

Captions will be injected automatically
