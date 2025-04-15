from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
import shutil
import os
import uuid
import datetime
from ..services import asr, summarizer, storage # Import necessary services
# from ..utils.file_operations import save_upload_file # Optional: Use utility

# Define the directory to save uploads
UPLOAD_DIRECTORY = "uploads"
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a"}
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

router = APIRouter(
    prefix="/upload", # Keep prefix, change endpoint below
    tags=["upload"],
)

# --- Background Task Function ---
async def process_audio_task(file_path: str, job_id: str, filename: str):
    """
    Background task to process audio: transcribe, summarize, and save.
    """
    print(f"[Task {job_id}] Starting background processing for: {file_path}")
    try:
        # 1. Transcribe Audio (using service from asr.py)
        # Language detection can be added here or passed from the request if needed
        asr_result = await asr.transcribe_audio(file_path)
        transcript = asr_result.get("transcript", "Transcription failed.")
        # Diarization/timestamps are in asr_result if needed later

        # 2. Process Transcript (Summarize, Extract Actions/Decisions)
        processed_data = await summarizer.process_transcript(transcript)
        # Add the raw transcript to the data to be saved
        processed_data['transcript'] = transcript
        # Potentially add diarization/timestamps here too if needed in DB/output
        # processed_data['diarization'] = asr_result.get("diarization", [])
        # processed_data['timestamps'] = asr_result.get("timestamps", [])

        # 3. Save results to Database (using service from storage.py)
        await storage.save_processed_data(job_id=job_id, filename=filename, processed_data=processed_data)

        print(f"[Task {job_id}] Background processing completed successfully.")

    except Exception as e:
        print(f"[Task {job_id}] Error during background processing for {file_path}: {e}")
        # Optionally update DB record to indicate failure status
        error_data = {
            "transcript": f"Processing Error: {e}",
            "summary": "Error",
            "action_items": [],
            "decisions": []
        }
        await storage.save_processed_data(job_id=job_id, filename=filename, processed_data=error_data)
    finally:
        # Optional: Clean up the uploaded file after processing
        try:
            # os.remove(file_path)
            # print(f"[Task {job_id}] Cleaned up temporary file: {file_path}")
            pass # Keep file for now
        except OSError as e:
            print(f"[Task {job_id}] Error cleaning up file {file_path}: {e}")


@router.post("/upload-audio")
async def upload_audio(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Handles audio file uploads (.wav, .mp3, .m4a).
    Saves the file with a UUID filename and returns a job ID.
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Generate UUID filename
    job_id = str(uuid.uuid4())
    new_filename = f"{job_id}{file_ext}"
    file_location = os.path.join(UPLOAD_DIRECTORY, new_filename)

    try:
        # Save the uploaded file
        with open(file_location, "wb+") as file_object:
             shutil.copyfileobj(file.file, file_object)
        print(f"File saved to: {file_location}")

        # Add the processing job to background tasks
        background_tasks.add_task(process_audio_task, file_location, job_id, new_filename)
        print(f"Added background task for job_id: {job_id}")

        # Return immediately with 202 Accepted and the job_id
        return JSONResponse(status_code=202, content={"job_id": job_id, "filename": new_filename, "message": "File upload accepted. Processing started in background."})

    except IOError as e:
        print(f"IOError saving file {new_filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Could not save the file: {e}") # Corrected indentation
    except Exception as e:
        # Log the exception in a real app
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during file upload.")
