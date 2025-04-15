from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Define directories relative to main.py location
PDF_OUTPUT_DIR = "generated_pdfs" # Should match pdf_generator.py
STATIC_DIR_NAME = "static" # URL path prefix
PDF_STATIC_PATH = os.path.join(STATIC_DIR_NAME, "pdfs") # URL path: /static/pdfs/

# Ensure the PDF output directory exists (though pdf_generator should also do this)
os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)


app = FastAPI(
    title="Fluent Note Taker AI Backend",
    description="API for uploading audio, processing transcripts, and generating reports.",
    version="0.1.0",
    docs_url="/docs", # Default Swagger UI path
    redoc_url="/redoc" # Alternative API docs
)

# --- CORS Middleware ---
# Allow requests from typical frontend development ports/origins
# In production, restrict origins more tightly.
origins = [
    "http://localhost",  # Localhost for dev
    "http://localhost:8080",  # Your frontend IP
    "http://172.20.14.42:8080",  # Additional frontend IPs
    "http://172.31.96.1:8080",  # Additional frontend IPs
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# --- Mount Static Directory for PDFs ---
# Serve files from the 'generated_pdfs' directory under the '/static/pdfs' URL path
# Example: A file at generated_pdfs/meeting_abc.pdf will be accessible at http://localhost:8000/static/pdfs/meeting_abc.pdf
# Note: The FileResponse in transcript.py handles direct downloads,
# mounting is useful if you want to link directly to the files from the frontend.
app.mount(f"/{PDF_STATIC_PATH}", StaticFiles(directory=PDF_OUTPUT_DIR), name="static_pdfs")


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Fluent Note Taker AI Backend"}

# Include routers
from .routers import upload, transcript
app.include_router(upload.router)
app.include_router(transcript.router)
