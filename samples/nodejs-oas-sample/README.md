# Node.js OAS Sample API

A sample Node.js REST API project built with **Express** and documented using an **OpenAPI 3.0 Specification (OAS)** YAML file. This project demonstrates how to build a RESTful API that aligns with an OAS definition, complete with interactive Swagger UI documentation.

## Features

- **OpenAPI 3.0 Specification** — Full API contract defined in `openapi.yaml`
- **Express.js Server** — Lightweight HTTP server with modular routing
- **Swagger UI** — Interactive API documentation served at `/api-docs`
- **CRUD Operations** — Complete Create, Read, Update, Delete for a Pet Store API
- **Input Validation** — Request body and query parameter validation
- **Pagination** — Paginated list endpoint with `limit` and `offset`
- **Error Handling** — Standardized JSON error responses
- **Unit Tests** — Jest + Supertest test suite with coverage

## Project Structure

```
nodejs-oas-sample/
├── openapi.yaml                 # OpenAPI 3.0 specification
├── package.json                 # Project dependencies and scripts
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
├── __tests__/
│   └── pets.test.js             # API test suite
└── src/
    ├── server.js                # Express app setup and entry point
    ├── middleware/
    │   └── errorHandler.js      # Global error handling middleware
    └── routes/
        ├── health.js            # Health check endpoint
        └── pets.js              # Pet CRUD endpoints
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

```bash
cd samples/nodejs-oas-sample
npm install
```

### Running the Server

```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev
```

The server starts on `http://localhost:3000`. Visit `http://localhost:3000/api-docs` for interactive API documentation.

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## API Endpoints

| Method   | Endpoint              | Description            |
|----------|-----------------------|------------------------|
| `GET`    | `/api/v1/health`      | Health check           |
| `GET`    | `/api/v1/pets`        | List all pets          |
| `POST`   | `/api/v1/pets`        | Create a new pet       |
| `GET`    | `/api/v1/pets/:petId` | Get a pet by ID        |
| `PUT`    | `/api/v1/pets/:petId` | Update a pet           |
| `DELETE` | `/api/v1/pets/:petId` | Delete a pet           |

## Sample Requests

### Create a Pet

```bash
curl -X POST http://localhost:3000/api/v1/pets \
  -H "Content-Type: application/json" \
  -d '{"name": "Rex", "species": "dog", "breed": "German Shepherd", "age": 5}'
```

### List Pets with Pagination

```bash
curl "http://localhost:3000/api/v1/pets?limit=2&offset=0"
```

### Get a Pet by ID

```bash
curl http://localhost:3000/api/v1/pets/pet-001
```

## License

MIT
