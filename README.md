# Fluent Note Taker AI

This project is a full-stack application featuring a React/Vite frontend and a FastAPI backend designed for uploading audio files, transcribing them using Whisper, generating summaries/action items/decisions using an LLM via LangChain, and exporting results in various formats (JSON, TXT, PDF).

## Technologies Used

**Frontend:**
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

**Backend:**
- FastAPI
- Python
- OpenAI Whisper (for ASR)
- LangChain (for LLM interaction)
- Ollama / OpenAI (configurable LLM providers)
- SQLite (for data storage)
- FPDF (for PDF generation)
- Uvicorn / Gunicorn (for serving)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js and npm:** For managing frontend dependencies and running the development server. [Install Node.js](https://nodejs.org/) (npm is included).
- **Python:** Version 3.9 or higher recommended. [Install Python](https://www.python.org/downloads/).
- **pip:** Python package installer (usually included with Python).
- **ffmpeg:** Required by OpenAI Whisper for audio processing.
    - macOS: `brew install ffmpeg`
    - Debian/Ubuntu: `sudo apt update && sudo apt install ffmpeg`
    - Windows: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.
- **(Optional) Ollama:** If using Ollama as the LLM provider, ensure it's installed and running. [Install Ollama](https://ollama.com/). You'll also need to pull the desired model (e.g., `ollama pull llama3`).
- **(Optional) Git:** For cloning the repository if you haven't already.

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone <YOUR_GIT_URL>
    cd fluent-note-taker-ai
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    *   It's recommended to use a Python virtual environment:
        ```bash
        python -m venv venv
        # Activate the virtual environment
        # Windows (Command Prompt): venv\Scripts\activate.bat
        # Windows (PowerShell):   venv\Scripts\Activate.ps1
        # macOS/Linux:            source venv/bin/activate
        ```
    *   Install dependencies from `requirements.txt`:
        ```bash
        pip install -r backend/requirements.txt
        ```
    *   *(Note for GPU users):* Ensure your PyTorch version matches your CUDA toolkit version for GPU acceleration with Whisper/LangChain. You might need to install a specific PyTorch version manually (see [PyTorch website](https://pytorch.org/get-started/locally/)).

4.  **Configure Backend Environment:**
    *   Create a `.env` file in the project root directory (`fluent-note-taker-ai/.env`).
    *   Add the following variables, adjusting values as needed:

        ```dotenv
        # .env

        # --- ASR (Whisper) ---
        # Model size: tiny, base, small, medium, large-v3
        WHISPER_MODEL_NAME=base
        # Device: cpu or cuda (if GPU available and configured)
        ASR_DEVICE=cpu

        # --- LLM (LangChain) ---
        # Provider: ollama or openai
        LLM_PROVIDER=ollama
        # Model name (ensure it's available via the provider)
        # Ollama examples: llama3, mistral, qwen
        # OpenAI examples: gpt-3.5-turbo, gpt-4
        LLM_MODEL_NAME=llama3
        # Ollama base URL (only needed if not default http://localhost:11434)
        # OLLAMA_BASE_URL=http://localhost:11434

        # --- OpenAI API Key (ONLY if LLM_PROVIDER=openai) ---
        # IMPORTANT: Keep your API key secret! Do not commit this file with the key.
        # OPENAI_API_KEY=sk-YourSecretKeyHere
        # Optional base URL for OpenAI proxies
        # OPENAI_API_BASE=
        ```

## Running for Development

You need to run both the backend and frontend servers concurrently.

1.  **Start the Backend Server:**
    *   Open a terminal in the project root directory (`fluent-note-taker-ai`).
    *   Make sure your Python virtual environment (if used) is activated.
    *   Run:
        ```bash
        uvicorn backend.main:app --reload --port 8000
        ```
    *   The backend API will be available at `http://localhost:8000`.
    *   Swagger UI (API docs) will be at `http://localhost:8000/docs`.

2.  **Start the Frontend Development Server:**
    *   Open a *second* terminal, also in the project root directory.
    *   Run:
        ```bash
        npm run dev
        ```
    *   The frontend will likely be available at `http://localhost:5173` (check the terminal output for the exact URL).

Open the frontend URL in your browser to use the application.

## Running for Production

1.  **Build the Frontend:**
    ```bash
    npm run build
    ```
    This creates optimized static assets in the `dist/` directory.

2.  **Run the Backend with Gunicorn:**
    *   Make sure your Python virtual environment is activated.
    *   Run from the project root directory:
        ```bash
        gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --env-file .env
        ```
        *   Adjust `-w 4` (number of worker processes) based on your server's CPU cores.
        *   `--env-file .env` loads the configuration.
        *   `-b 0.0.0.0:8000` binds the server to port 8000 on all network interfaces.

3.  **Configure a Web Server (Nginx Example):**
    *   Install Nginx.
    *   Configure Nginx as a reverse proxy. Create a site configuration (e.g., in `/etc/nginx/sites-available/fluent-note-taker`):

        ```nginx
        server {
            listen 80;
            server_name your_domain.com; # Or your server's IP address

            # Location for API requests (proxy to Gunicorn)
            location /upload/ {
                proxy_pass http://127.0.0.1:8000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            location /meetings/ {
                proxy_pass http://127.0.0.1:8000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

             # Location for static PDF files (optional, if linking directly)
            location /static/pdfs/ {
                alias /path/to/your/fluent-note-taker-ai/generated_pdfs/; # Update this path
                expires 1d; # Cache control
            }

            # Location for serving the frontend static files
            location / {
                root /path/to/your/fluent-note-taker-ai/dist; # Update this path
                try_files $uri /index.html; # Handle client-side routing
            }

            # Optional: Add SSL configuration (Let's Encrypt) here
        }
        ```
    *   Replace `/path/to/your/fluent-note-taker-ai/` with the actual path to your project.
    *   Enable the site: `sudo ln -s /etc/nginx/sites-available/fluent-note-taker /etc/nginx/sites-enabled/`
    *   Test Nginx configuration: `sudo nginx -t`
    *   Reload Nginx: `sudo systemctl reload nginx`

4.  **Process Management (Optional but Recommended):**
    *   Use `systemd` or `supervisor` to manage the Gunicorn process (auto-restart on failure, run on boot).

## Project Structure

```
fluent-note-taker-ai/
├── backend/              # FastAPI Backend
│   ├── db/               # SQLite DB setup (database.py)
│   ├── routers/          # API route definitions (upload.py, transcript.py)
│   ├── services/         # Business logic (asr.py, summarizer.py, storage.py, pdf_generator.py)
│   ├── utils/            # Utility functions
│   ├── db_data/          # SQLite database file (fluent_notes.db) - Gitignored
│   ├── generated_pdfs/   # Generated PDF reports - Gitignored
│   ├── uploads/          # Uploaded audio files - Gitignored
│   ├── main.py           # FastAPI app entrypoint
│   └── requirements.txt  # Python dependencies
├── public/               # Static assets for frontend
├── src/                  # Frontend React source code
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Frontend utility functions
│   ├── pages/            # Page components
│   └── services/         # Frontend API service (api.ts)
│   ├── App.tsx           # Main React application component
│   ├── index.css         # Global CSS
│   └── main.tsx          # Frontend entrypoint
├── .env                  # Environment variables (Gitignored)
├── .gitignore            # Specifies intentionally untracked files
├── index.html            # Main HTML file for Vite
├── package.json          # Frontend dependencies and scripts
├── README.md             # This file
└── vite.config.ts        # Vite configuration
└── ...                   # Other config files (tsconfig, postcss, etc.)
```

