# PDF report generation logic using fpdf2
# Creates styled PDF documents from meeting data.

import os
import asyncio
from fpdf import FPDF # Requires: pip install fpdf2
from . import storage # Import storage to fetch data
from typing import Optional

PDF_OUTPUT_DIR = "generated_pdfs"
os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)

class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Meeting Report', 0, 1, 'C')
        self.ln(10)

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('Arial', '', 10)
        # Use multi_cell for potentially long text that needs wrapping
        self.multi_cell(0, 5, body)
        self.ln()

    def list_items(self, items: list, title: str):
        if items:
            self.chapter_title(title)
            self.set_font('Arial', '', 10)
            for item in items:
                # Use multi_cell for potentially long list items
                self.multi_cell(0, 5, f"- {item}")
            self.ln()

async def create_report(job_id: str, include_transcript: bool = True) -> Optional[str]:
    """
    Generates a PDF report for the given job ID using fpdf2.

    Args:
        job_id: The ID of the meeting/job.
        include_transcript: Whether to include the full transcript in the PDF.

    Returns:
        The path to the generated PDF file, or None if generation failed.
    """
    print(f"Starting PDF report generation for job ID: {job_id}")

    # 1. Fetch meeting data using storage service
    meeting_data = await storage.get_meeting_data(job_id)
    if not meeting_data:
        print(f"Error: Meeting data not found for job ID {job_id}")
        return None

    summary = meeting_data.get("summary", "No summary available.")
    action_items = meeting_data.get("action_items", [])
    decisions = meeting_data.get("decisions", [])
    transcript = meeting_data.get("transcript", "No transcript available.")
    filename = meeting_data.get("filename", job_id) # Use original filename or job_id

    pdf_filename = f"meeting_{job_id}_report.pdf"
    pdf_filepath = os.path.join(PDF_OUTPUT_DIR, pdf_filename)

    try:
        pdf = PDFReport()
        pdf.add_page()

        # Add basic info
        pdf.set_font('Arial', '', 10)
        pdf.cell(0, 5, f"Job ID: {job_id}", 0, 1)
        pdf.cell(0, 5, f"Original File: {filename}", 0, 1)
        pdf.ln(5)

        # Summary Section
        pdf.chapter_title("Summary")
        pdf.chapter_body(summary)

        # Action Items Section
        pdf.list_items(action_items, "Action Items")

        # Decisions Section
        pdf.list_items(decisions, "Decisions Made")

        # Transcript Section (Optional)
        if include_transcript:
            pdf.chapter_title("Full Transcript")
            pdf.chapter_body(transcript)

        # Save the PDF
        pdf.output(pdf_filepath, "F")

        print(f"PDF report successfully generated: {pdf_filepath}")
        return pdf_filepath

    except Exception as e:
        print(f"Error generating PDF report for job {job_id}: {e}")
        # Consider logging the full traceback in a real application
        return None
