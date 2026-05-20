# Apigee Proxy Reporter

A Node.js CLI tool that connects to the **Apigee Management API** and generates reports on API proxies and their labels.

Supports both **Apigee X / hybrid** (Google Cloud OAuth) and **Apigee Edge** (basic auth).

---

## Features

- Lists all API proxies in an Apigee organisation
- Retrieves detailed metadata including labels, revisions, and timestamps
- Outputs a formatted console table, JSON file, and CSV file
- Concurrency-limited requests (batch of 5) to avoid rate limits
- Automatic exponential back-off retry on 429 and 5xx errors
- Graceful error handling — continues processing if individual proxies fail

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** (bundled with Node.js)
- An Apigee organisation with Management API access
- For **Apigee X / hybrid**: a Google Cloud service account with the
  `roles/apigee.admin` (or `roles/apigee.readOnlyAdmin`) role, or
  Application Default Credentials configured
- For **Apigee Edge** (legacy): username and password

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and edit it:

```bash
cp .env.example .env
```

Fill in the required values — see `.env.example` for documentation of
each variable.

#### Apigee X / hybrid (recommended)

```dotenv
APIGEE_ORG=my-gcp-project
APIGEE_AUTH_TYPE=oauth
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

> **Tip:** If you have already run `gcloud auth application-default login`,
> you can leave `GOOGLE_APPLICATION_CREDENTIALS` blank and the tool will
> use Application Default Credentials automatically.

#### Apigee Edge (legacy)

```dotenv
APIGEE_ORG=my-edge-org
APIGEE_AUTH_TYPE=basic
APIGEE_USERNAME=user@example.com
APIGEE_PASSWORD=secret
```

---

## Usage

```bash
npm start
```

The tool will:

1. Authenticate with the Apigee Management API
2. Fetch the list of all API proxies
3. Retrieve detailed metadata for each proxy (5 at a time)
4. Print a formatted table to the console
5. Write `report.json` and `report.csv` to the project root (configurable)
6. Print a summary showing total proxies, labelled vs. unlabelled counts

---

## Output

### Console

```
=== Apigee API Proxy Report ===

┌─────────┬────────────────┬──────────────────────────┬──────────┬──────────────────────────┬──────────────────────────┐
│ (index) │  Proxy Name    │         Labels           │ Revision │       Created At         │    Last Modified At      │
├─────────┼────────────────┼──────────────────────────┼──────────┼──────────────────────────┼──────────────────────────┤
│    0    │ 'hello-world'  │ 'env=prod, team=api'     │ '3'      │ '2024-01-15T10:30:00Z'   │ '2024-06-20T14:45:00Z'   │
│    1    │ 'weather-api'  │ '—'                      │ '1'      │ '2024-03-01T08:00:00Z'   │ '2024-03-01T08:00:00Z'   │
│    2    │ 'payment-proxy'│ 'env=staging, pci=true'  │ '7'      │ '2023-11-10T12:00:00Z'   │ '2024-07-01T09:15:00Z'   │
└─────────┴────────────────┴──────────────────────────┴──────────┴──────────────────────────┴──────────────────────────┘

=== Summary ===
Total proxies:          3
Proxies with labels:    2
Proxies without labels: 1
```

### JSON (`report.json`)

```json
[
  {
    "proxyName": "hello-world",
    "labels": "env=prod, team=api",
    "revision": "3",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastModifiedAt": "2024-06-20T14:45:00.000Z"
  }
]
```

### CSV (`report.csv`)

```
Proxy Name,Labels,Revision,Created At,Last Modified At
hello-world,"env=prod, team=api",3,2024-01-15T10:30:00.000Z,2024-06-20T14:45:00.000Z
```

---

## Configuration Reference

| Variable                        | Required | Default  | Description                                     |
| ------------------------------- | -------- | -------- | ----------------------------------------------- |
| `APIGEE_ORG`                    | Yes      | —        | Apigee organisation name                        |
| `APIGEE_AUTH_TYPE`              | No       | `oauth`  | `oauth` (Apigee X) or `basic` (Apigee Edge)    |
| `GOOGLE_APPLICATION_CREDENTIALS`| No*      | —        | Path to service account JSON (Apigee X)         |
| `APIGEE_USERNAME`               | No*      | —        | Username for Apigee Edge basic auth             |
| `APIGEE_PASSWORD`               | No*      | —        | Password for Apigee Edge basic auth             |
| `OUTPUT_JSON`                   | No       | `true`   | Write `report.json`                             |
| `OUTPUT_CSV`                    | No       | `true`   | Write `report.csv`                              |

\* Required depending on the chosen `APIGEE_AUTH_TYPE`.

---

## Project Structure

```
apigee-proxy-reporter/
├── src/
│   ├── config.js          # Environment variable loading and validation
│   ├── auth.js            # Google Cloud OAuth / basic auth helpers
│   ├── apigeeClient.js    # Axios client with retry logic for Apigee API
│   ├── reportGenerator.js # Console, JSON, and CSV report output
│   └── index.js           # Main entry point and orchestration
├── .env.example           # Documented environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## License

ISC
