# SQLite database interaction logic using sqlite3
# Handles saving, retrieving, and searching meeting transcripts and metadata.

import sqlite3
import json
import datetime
import os
from typing import Dict, Any, List, Optional

DATABASE_DIR = "db_data"
DATABASE_PATH = os.path.join(DATABASE_DIR, "fluent_notes.db")
os.makedirs(DATABASE_DIR, exist_ok=True)

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row # Return rows as dictionary-like objects
    return conn

def init_db():
    """Initializes the database schema and FTS table if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create main table for meeting data
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            job_id TEXT PRIMARY KEY,
            filename TEXT,
            transcript TEXT,
            summary TEXT,
            action_items TEXT, -- Store as JSON string
            decisions TEXT,    -- Store as JSON string
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create FTS5 table for full-text search on transcripts
    # Note: FTS table content is automatically synchronized with the meetings table
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS meetings_fts USING fts5(
            job_id UNINDEXED, -- Don't index job_id in FTS
            transcript,
            content='meetings', -- Link to the main table
            content_rowid='rowid' -- Use rowid for linking (implicit in meetings table)
            -- Add other fields like summary if needed for search
        )
    """)

    # Triggers to keep FTS table synchronized with the main table
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS meetings_ai AFTER INSERT ON meetings BEGIN
            INSERT INTO meetings_fts (rowid, job_id, transcript) VALUES (new.rowid, new.job_id, new.transcript);
        END;
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS meetings_ad AFTER DELETE ON meetings BEGIN
            DELETE FROM meetings_fts WHERE rowid=old.rowid;
        END;
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS meetings_au AFTER UPDATE ON meetings BEGIN
            UPDATE meetings_fts SET transcript = new.transcript WHERE rowid=old.rowid;
        END;
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

# Initialize DB on module load
init_db()

async def save_processed_data(job_id: str, filename: str, processed_data: Dict[str, Any]):
    """
    Saves the transcript, summary, action items, and decisions for a job.
    Inserts a new record or updates if job_id already exists.

    Args:
        job_id: The unique identifier for the upload job.
        filename: The original filename (or UUID filename) of the uploaded audio.
        processed_data: A dictionary containing 'transcript', 'summary',
                          'action_items' (list), and 'decisions' (list).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.datetime.now()

    try:
        cursor.execute("""
            INSERT INTO meetings (job_id, filename, transcript, summary, action_items, decisions, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                filename=excluded.filename,
                transcript=excluded.transcript,
                summary=excluded.summary,
                action_items=excluded.action_items,
                decisions=excluded.decisions,
                timestamp=excluded.timestamp
        """, (
            job_id,
            filename,
            processed_data.get('transcript', ''),
            processed_data.get('summary', ''),
            json.dumps(processed_data.get('action_items', [])), # Store list as JSON string
            json.dumps(processed_data.get('decisions', [])),   # Store list as JSON string
            timestamp
        ))
        conn.commit()
        print(f"Successfully saved/updated data for job_id: {job_id}")
    except sqlite3.Error as e:
        print(f"Database error saving data for job_id {job_id}: {e}")
        conn.rollback() # Roll back changes on error
    finally:
        conn.close()

async def get_meeting_data(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves all stored data for a given job_id.

    Args:
        job_id: The unique identifier for the upload job.

    Returns:
        A dictionary containing the meeting data, or None if not found.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM meetings WHERE job_id = ?", (job_id,))
        row = cursor.fetchone()
        if row:
            meeting_data = dict(row)
            # Decode JSON strings back into lists
            meeting_data['action_items'] = json.loads(meeting_data.get('action_items', '[]'))
            meeting_data['decisions'] = json.loads(meeting_data.get('decisions', '[]'))
            return meeting_data
        else:
            return None
    except sqlite3.Error as e:
        print(f"Database error fetching data for job_id {job_id}: {e}")
        return None
    finally:
        conn.close()

async def search_transcripts(query: str) -> List[Dict[str, Any]]:
    """
    Performs a full-text search on the transcripts.

    Args:
        query: The search term(s). Supports FTS5 query syntax.

    Returns:
        A list of matching meeting records (dictionaries).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    results = []
    try:
        # Search the FTS table and join back to the main table to get all columns
        # The rank function provides relevance scoring (lower is better)
        cursor.execute("""
            SELECT m.*, rank
            FROM meetings_fts fts
            JOIN meetings m ON fts.rowid = m.rowid
            WHERE fts.transcript MATCH ?
            ORDER BY rank -- Order by relevance
        """, (query,))

        rows = cursor.fetchall()
        for row in rows:
            meeting_data = dict(row)
            # Decode JSON strings
            meeting_data['action_items'] = json.loads(meeting_data.get('action_items', '[]'))
            meeting_data['decisions'] = json.loads(meeting_data.get('decisions', '[]'))
            results.append(meeting_data)
        return results
    except sqlite3.Error as e:
        print(f"Database error during search for query '{query}': {e}")
        return [] # Return empty list on error
    finally:
        conn.close()

async def get_all_meeting_data() -> List[Dict[str, Any]]:
    """
    Retrieves all meeting records from the database.
    Warning: Could be inefficient for a large number of records. Consider pagination.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    results = []
    try:
        cursor.execute("SELECT * FROM meetings ORDER BY timestamp DESC") # Order by most recent
        rows = cursor.fetchall()
        for row in rows:
            meeting_data = dict(row)
            # Decode JSON strings
            meeting_data['action_items'] = json.loads(meeting_data.get('action_items', '[]'))
            meeting_data['decisions'] = json.loads(meeting_data.get('decisions', '[]'))
            results.append(meeting_data)
        return results
    except sqlite3.Error as e:
        print(f"Database error fetching all meeting data: {e}")
        return [] # Return empty list on error
    finally:
        conn.close()


# --- Keep placeholder functions for compatibility if needed by other modules ---
# --- Or update other modules to use the new function names/signatures ---

async def get_summary(job_id: str) -> str | None: # Updated type hint to str
    """Retrieves the summary for a meeting (Compatibility)."""
    data = await get_meeting_data(job_id)
    return data.get('summary') if data else None

async def get_transcript(job_id: str) -> str | None: # Updated type hint to str
    """Retrieves the summary for a meeting (Compatibility)."""
    data = await get_meeting_data(str(job_id)) # Convert int if necessary
    return data.get('summary') if data else None

async def get_transcript(job_id: int) -> str | None: # Note: ID is now job_id (string)
    """Retrieves the transcript for a meeting (Compatibility)."""
    data = await get_meeting_data(str(job_id)) # Convert int if necessary
    return data.get('transcript') if data else None

# Remove or adapt old save functions if no longer needed
# async def save_meeting_details(...)
# async def save_transcript(...)
# async def save_summary(...)
