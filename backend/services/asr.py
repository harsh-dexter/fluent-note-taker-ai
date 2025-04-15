# Automatic Speech Recognition (ASR) logic using Whisper
# Requires: pip install -U openai-whisper
# Requires: brew install ffmpeg (macOS) or sudo apt update && sudo apt install ffmpeg (Linux) or choco install ffmpeg (Windows)

import os
import whisper # Use the actual library
import torch # Whisper uses PyTorch
from typing import Dict, Any, Optional

# --- Configuration ---
# Use environment variables for model name and device
# Example values: "tiny", "base", "small", "medium", "large-v3"
WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL_NAME", "base")
# Use "cuda" if GPU is available and PyTorch with CUDA is installed, otherwise "cpu"
ASR_DEVICE = os.getenv("ASR_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")

# --- Load Model ---
# Load the model globally on module import to avoid reloading on each request
# This assumes the service runs as a single process or manages model loading appropriately
# In a multi-worker setup (like gunicorn), consider shared memory or a dedicated inference service.
_whisper_model = None
try:
    print(f"Loading Whisper model '{WHISPER_MODEL_NAME}' onto device '{ASR_DEVICE}'...")
    _whisper_model = whisper.load_model(WHISPER_MODEL_NAME, device=ASR_DEVICE)
    print("Whisper model loaded successfully.")
except Exception as e:
    print(f"Error loading Whisper model '{WHISPER_MODEL_NAME}': {e}")
    # Application might not function correctly if model fails to load.
    # Consider raising an error or having a fallback mechanism.

async def transcribe_audio(file_path: str, language: Optional[str] = None) -> Dict[str, Any]:
    """
    Transcribes the audio file using the loaded Whisper model.

    Args:
        file_path: The path to the audio file.
        language: The language code (e.g., 'en', 'zh'). Auto-detect if None.

    Returns:
        A dictionary containing:
        - transcript: The full transcribed text.
        - language: Detected language.
        - segments: List of segments with timestamps (if available).
        - diarization: Placeholder (Whisper doesn't do diarization out-of-the-box).
        - timestamps: Placeholder (word-level timestamps require specific model options).
    """
    if not _whisper_model:
        print("Error: Whisper model is not loaded.")
        return {
            "transcript": "Error: ASR model not available.",
            "language": None,
            "segments": [],
            "diarization": [],
            "timestamps": []
        }

    print(f"Starting Whisper transcription for: {file_path}")
    transcript = "Transcription failed."
    detected_language = language
    segments = []
    # Placeholders - base Whisper doesn't provide these easily
    diarization = []
    timestamps = []

    try:
        # Perform transcription
        # verbose=True provides progress in logs, verbose=None is quieter
        # word_timestamps=True can provide word-level data but increases computation
        # fp16=False might be needed on CPU or if GPU has issues with float16
        options = whisper.DecodingOptions(
            language=language,
            fp16=(ASR_DEVICE == "cuda"), # Use fp16 only on CUDA
            # word_timestamps=True # Enable if word-level timestamps are needed
        )
        result = _whisper_model.transcribe(file_path, **options.__dict__) # Pass options as dict

        transcript = result.get("text", "Transcription result empty.")
        detected_language = result.get("language", detected_language)
        segments = result.get("segments", []) # Contains start, end, text per segment

        # --- Diarization & Word Timestamps ---
        # Base Whisper doesn't perform speaker diarization.
        # You would need additional libraries/models like:
        # - pyannote.audio (requires accepting user agreements)
        # - NeMo Speaker Diarization
        # These would typically run after or alongside Whisper and results merged.
        # For word timestamps, ensure word_timestamps=True in DecodingOptions
        # and parse result["segments"] which will contain 'words' list if enabled.
        # For now, diarization and word timestamps remain placeholders.

        print(f"Whisper transcription complete. Detected language: {detected_language}")

    except Exception as e:
        print(f"Error during Whisper transcription for {file_path}: {e}")
        transcript = f"Error during transcription: {e}"
        # Reset other fields on error
        detected_language = None
        segments = []
        diarization = []
        timestamps = []

    return {
        "transcript": transcript,
        "language": detected_language,
        "segments": segments, # Return segment-level timestamps
        "diarization": diarization, # Placeholder
        "timestamps": timestamps    # Placeholder (word-level)
    }
