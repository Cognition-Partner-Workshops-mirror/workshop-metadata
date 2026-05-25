# Multi-stage Dockerfile for the Natural Language Database Query tool.
# Uses a slim Python base to minimize image size.

FROM python:3.11-slim AS base

# Set environment variables to prevent Python from writing .pyc files
# and to ensure output is sent straight to the terminal (unbuffered).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system-level dependencies required by psycopg2 and FAISS
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create application directory
WORKDIR /app

# Copy and install Python dependencies first (for layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create directory for FAISS index persistence
RUN mkdir -p /app/vectordb/index_store

# Expose the default Streamlit port
EXPOSE 8501

# Health check endpoint – Streamlit serves on 8501
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

# Run the Streamlit application
CMD ["streamlit", "run", "app.py", \
     "--server.port=8501", \
     "--server.address=0.0.0.0", \
     "--server.headless=true", \
     "--browser.gatherUsageStats=false"]
