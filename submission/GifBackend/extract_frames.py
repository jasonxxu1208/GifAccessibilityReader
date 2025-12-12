import os
import glob
import subprocess
import tempfile
from urllib.parse import urlparse

import requests

FRAMES_DIR_DEFAULT = "frames"


def _is_url(path: str) -> bool:
    return path.startswith("http://") or path.startswith("https://")


def extract_frames(source: str, output_folder: str = FRAMES_DIR_DEFAULT, max_frames: int = 3):
    """
    Given a URL or local path to a GIF / MP4 / WebM / etc.,
    extract frames using ffmpeg and return up to `max_frames`
    evenly spaced frames.

    Returns:
        List[str]: paths to selected frame JPGs (may be fewer than max_frames).
    """
    os.makedirs(output_folder, exist_ok=True)

    # Clear old frames
    for f in glob.glob(os.path.join(output_folder, "frame_*.jpg")):
        try:
            os.remove(f)
        except OSError:
            pass

    temp_path = None
    media_path = source

    try:
        # download the Gif
        if _is_url(source):
            resp = requests.get(source, timeout=15)
            resp.raise_for_status()

            parsed = urlparse(source)
            ext = os.path.splitext(parsed.path)[1] or ".mp4"  # default if no extension
            fd, temp_path = tempfile.mkstemp(suffix=ext)
            os.close(fd)

            with open(temp_path, "wb") as f:
                f.write(resp.content)

            media_path = temp_path

        # use ffmpeg to extract frames
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            media_path,
            "-vf",
            "fps=1,scale=224:224",
            os.path.join(output_folder, "frame_%03d.jpg"),
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        frame_files = sorted(glob.glob(os.path.join(output_folder, "frame_*.jpg")))
        if not frame_files:
            return []

        # if fewer frames than we want, just return all of them
        if max_frames is None or len(frame_files) <= max_frames:
            return frame_files

        # otherwise, pick `max_frames` evenly spaced indices
        n = len(frame_files)
        indices = []
        for i in range(max_frames):
            idx = round(i * (n - 1) / (max_frames - 1))
            indices.append(idx)

        indices = sorted(set(indices))
        return [frame_files[i] for i in indices]

    finally:
        # cleanup temp file if we downloaded it
        if temp_path is not None and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

