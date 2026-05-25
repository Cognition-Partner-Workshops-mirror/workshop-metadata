# Natural Language Database Query Tool

A Streamlit-based application that converts natural language questions into SQL queries using **Ollama** LLMs, **FAISS** vector search for retrieval-augmented generation (RAG), and **PostgreSQL** as the target database.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Streamlit UI (app.py + pages/)              │
│  ┌──────────┐  ┌───────────────┐  ┌──────────┐  ┌────────┐ │
│  │  Query    │  │ Schema        │  │ Document │  │Settings│ │
│  │  Chat     │  │ Explorer      │  │ Manager  │  │        │ │
│  └────┬─────┘  └───────────────┘  └────┬─────┘  └────────┘ │
│       │                                │                     │
├───────┼────────────────────────────────┼─────────────────────┤
│       ▼                                ▼                     │
│  ┌─────────────┐    ┌──────────────────────────┐             │
│  │ LLM Layer   │    │ VectorDB Layer           │             │
│  │ (Ollama)    │    │ (FAISS + DocStore)        │             │
│  │ client.py   │◄───│ faiss_index.py            │             │
│  │ prompts.py  │    │ docstore.py               │             │
│  │ retriever.py│    │ ingestion.py              │             │
│  │ embeddings  │    │ (5 document types)        │             │
│  └──────┬──────┘    └──────────────────────────┘             │
│         │                                                    │
├─────────┼────────────────────────────────────────────────────┤
│         ▼                                                    │
│  ┌─────────────┐    ┌──────────────────────────┐             │
│  │ Security    │    │ Database Layer            │             │
│  │ validator.py│───►│ connection.py             │             │
│  │             │    │ executor.py               │             │
│  └─────────────┘    └──────────┬───────────────┘             │
│                                │                             │
└────────────────────────────────┼─────────────────────────────┘
                                 ▼
                          ┌──────────────┐
                          │ PostgreSQL   │
                          │ Database     │
                          └──────────────┘
```

## Features

- **Natural Language Queries** – Ask questions in plain English and get SQL + results
- **RAG-Enhanced Generation** – Context documents improve SQL generation accuracy
- **SQL Validation** – Security layer blocks DDL/DML, enforces row limits, prevents injection
- **Schema Explorer** – Interactive browser for tables, columns, and sample data
- **Document Manager** – Add/view/remove RAG context documents (5 types)
- **Query History** – Review past queries with export to CSV
- **Chat Interface** – Conversational UI with streaming-capable responses

## Document Types (RAG)

The vector store supports 5 document types to provide contextual knowledge:

1. **Schema Descriptions** – Human-readable notes about tables and columns
2. **SQL Examples** – Question-to-SQL pairs for few-shot learning
3. **Business Glossary** – Domain-specific term definitions
4. **Query Patterns** – Common analytical query templates
5. **Documentation** – Free-form reference material

## Project Structure

```
nl-database-query-tool/
├── app.py                          # Main Streamlit entry point
├── pages/
│   ├── 1_Schema_Explorer.py        # Database schema browser
│   ├── 2_Document_Manager.py       # RAG document management
│   ├── 3_Query_History.py          # Session query history
│   └── 4_Settings.py               # Configuration and diagnostics
├── config/
│   └── settings.py                 # Environment-based configuration
├── db/
│   ├── connection.py               # SQLAlchemy engine and schema introspection
│   └── executor.py                 # Safe SQL execution with validation
├── llm/
│   ├── client.py                   # Ollama LLM API wrapper
│   ├── embeddings.py               # Ollama embedding generation
│   ├── prompts.py                  # Prompt templates for SQL generation
│   └── retriever.py                # RAG pipeline orchestrator
├── vectordb/
│   ├── faiss_index.py              # FAISS index management and persistence
│   ├── docstore.py                 # Document metadata store (JSON-backed)
│   └── ingestion.py                # Document ingestion pipeline (5 types)
├── security/
│   └── validator.py                # SQL validation and sanitization
├── scripts/
│   └── init_db.sql                 # PostgreSQL schema and seed data
├── .streamlit/
│   └── config.toml                 # Streamlit theme and server settings
├── docker-compose.yml              # Ollama + PostgreSQL + Streamlit app
├── Dockerfile                      # App container definition
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
└── README.md                       # This file
```

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd nl-database-query-tool

# Start all services (PostgreSQL, Ollama, Streamlit app)
docker compose up --build

# The app will be available at http://localhost:8501
# Note: First run will download Ollama models (~4GB) – this takes several minutes.
```

### Local Development

```bash
# Prerequisites: Python 3.11+, PostgreSQL, Ollama

# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start PostgreSQL and create the database
#    (or use Docker: docker run -d -p 5432:5432 -e POSTGRES_USER=nlquery -e POSTGRES_PASSWORD=nlquery -e POSTGRES_DB=nlquery postgres:16-alpine)
psql -U nlquery -d nlquery -f scripts/init_db.sql

# 3. Start Ollama and pull required models
ollama serve &
ollama pull llama3
ollama pull nomic-embed-text

# 4. Copy and edit environment variables
cp .env.example .env

# 5. Run the application
streamlit run app.py
```

## Configuration

All settings are managed via environment variables. See `.env.example` for the complete list.

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `nlquery` | Database user |
| `POSTGRES_PASSWORD` | `nlquery` | Database password |
| `POSTGRES_DB` | `nlquery` | Database name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_LLM_MODEL` | `llama3` | Model for SQL generation |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Model for embeddings |
| `OLLAMA_TEMPERATURE` | `0.0` | LLM temperature (0 = deterministic) |
| `FAISS_EMBEDDING_DIM` | `768` | Embedding vector dimension |
| `FAISS_TOP_K` | `5` | Number of RAG context documents |
| `SQL_MAX_ROWS` | `1000` | Maximum query result rows |

## Security

The SQL validation layer (`security/validator.py`) enforces:

- **Read-only**: Only `SELECT` queries are allowed
- **Blocked keywords**: `DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT`, `REVOKE`, `EXEC`, `EXECUTE`
- **Single statement**: No query chaining via semicolons
- **No comments**: SQL comments (`--`, `/* */`) are blocked
- **Row limits**: Configurable maximum rows per query
- **Input sanitization**: Strips markdown fences and trailing semicolons from LLM output

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| UI | Streamlit | Web interface |
| Vector Search | FAISS (CPU) | RAG document retrieval |
| LLM | Ollama (llama3) | Natural language to SQL |
| Embeddings | Ollama (nomic-embed-text) | Text vectorization |
| Database | PostgreSQL 16 | Target query database |
| ORM | SQLAlchemy + psycopg2-binary | Database connectivity |
| SQL Parsing | sqlparse | Query validation |
| Containerization | Docker Compose | Service orchestration |

## License

This project is open source.
