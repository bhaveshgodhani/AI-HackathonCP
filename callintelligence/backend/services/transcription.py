import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def transcribe_audio(file_path: str) -> dict:
    """Transcribe audio using OpenAI Whisper API. Returns transcript text and duration."""
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing in backend environment")
    client = OpenAI(api_key=api_key)
    abs_path = os.path.abspath(file_path)
    with open(abs_path, "rb") as audio_file:
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
        )
    text = getattr(result, "text", None) or ""
    duration = getattr(result, "duration", None)
    if duration is None:
        duration = 0.0
    return {"transcript": text, "duration": float(duration)}
