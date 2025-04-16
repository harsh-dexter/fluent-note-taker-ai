import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Define the path to the database file within the db_data directory
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'db_data')
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'fluent_notes.db')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} # check_same_thread only needed for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Define the Meeting model
class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(String, primary_key=True, index=True) # Using job_id as primary key
    filename = Column(String, index=True)
    upload_time = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="processing") # Added status field
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True) # Storing as JSON string
    decisions = Column(Text, nullable=True) # Storing as JSON string
    pdf_path = Column(String, nullable=True) # Path to the generated PDF

# Function to create tables
def create_db_and_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

print("SQLAlchemy Database module initialized.")
print(f"Database URL: {SQLALCHEMY_DATABASE_URL}")
