# Google ADK Fraud Detection Agent

A comprehensive fraud detection AI agent built with [Google Agent Development Kit (ADK)](https://github.com/google/adk-java) for Java 21. This agent identifies users (including by alias/name variants), analyzes transaction patterns, and detects fraudulent activity with actionable recommendations.

## Overview

The Fraud Detection Agent helps analysts investigate suspicious transactions by combining user identification, location analysis, and risk scoring in one conversational interface. It handles alias/name variant matching to catch fraud even when perpetrators use different name variations.

### Features

- **User Identification**: Locate users by ID, name, or alias with fuzzy matching
- **Alias Resolution**: Cross-reference known name variants (nicknames, initials, translations) on transactions
- **Location Analysis**: Track login locations, detect impossible travel patterns
- **Transaction Analysis**: Identify suspicious spending patterns, unusual amounts, and high-risk categories
- **Fraud Risk Scoring**: Generate comprehensive risk scores with decision recommendations (BLOCK/FLAG/AUTH/APPROVE)
- **Multi-Agent Architecture**: Specialized sub-agents for identity, transactions, and risk scoring
- **Interactive Console**: Investigate fraud cases in your terminal
- **Dev UI**: Browser-based testing interface powered by Google ADK

### Demo Users

| User ID | Name | Location | Risk Level |
|---------|------|----------|------------|
| USR-10042 | John Martinez | Tampa, FL | Compromised account |
| USR-20087 | Sarah Chen | San Francisco, CA | Clean history |
| USR-30156 | Michael Thompson | New York, NY | Card cloning suspected |
| USR-40201 | Emily Rodriguez | Miami, FL | Fraud ring activity |

## Prerequisites

- **Java 21** (required)
- **Maven 3.8+**
- **Google API Key** with Gemini API access

## Setup

### 1. Get a Google API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create or select a project
3. Generate an API key
4. Enable the Gemini API if not already enabled

### 2. Set Environment Variable

```bash
export GOOGLE_API_KEY=your-api-key-here
```

### 3. Build the Project

```bash
cd google-adk-fraud-detection
mvn clean compile
```

## Running the Agent

### Interactive Console Mode

Chat with the agent to investigate fraud cases:

```bash
mvn exec:java
```

Example queries:
- "Investigate user USR-10042 for fraud"
- "Search for a user named Johnny Martinez"
- "Check if 'Juan Martinez' is a known alias"
- "Show all flagged transactions for USR-40201"
- "Score a $5000 crypto transaction from Lagos for USR-10042"
- "Is Mike Thompson the same as Michael Thompson?"
- "Show location history for USR-30156"

### Demo Mode

Run a pre-configured investigation of user USR-10042 (John Martinez) showing alias-based fraud detection:

```bash
mvn exec:java -Dexec.args="--demo"
```

### Dev UI Mode

Launch the browser-based ADK Dev UI for testing and debugging:

```bash
mvn exec:java -Dexec.mainClass="com.example.frauddetection.FraudDetectionDevServer"
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              ROOT AGENT (fraud_detection_agent)                   │
│                                                                   │
│  Orchestrates fraud investigation workflow                        │
│  Model: gemini-2.0-flash                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ user_identity    │  │ transaction      │  │ risk_scoring  │  │
│  │    _agent        │  │    _agent        │  │    _agent     │  │
│  │                  │  │                  │  │               │  │
│  │ • lookupUser     │  │ • getTransactions│  │ • generate    │  │
│  │ • searchByName   │  │ • analyzeFraud   │  │   RiskReport  │  │
│  │   OrAlias        │  │   Patterns       │  │ • score       │  │
│  │ • getUserLocation│  │ • verifyTxn      │  │   Transaction │  │
│  │   History        │  │   Name           │  │ • getInvest   │  │
│  │ • verifyUser     │  │                  │  │   Summary     │  │
│  │   Location       │  │                  │  │               │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
google-adk-fraud-detection/
├── pom.xml                                        # Maven config (Java 21, ADK 1.2.0)
├── README.md                                      # This file
└── src/main/java/com/example/frauddetection/
    ├── FraudDetectionApp.java                     # Main app with interactive & demo modes
    ├── FraudDetectionDevServer.java               # ADK Dev UI web server
    ├── agents/
    │   └── FraudDetectionAgent.java              # Agent definitions & orchestration
    └── tools/
        ├── UserIdentificationTool.java           # User lookup, alias matching, location
        ├── TransactionAnalysisTool.java          # Transaction history & fraud patterns
        └── FraudRiskScoringTool.java             # Risk scoring & investigation summaries
```

## Alias Handling

A key feature of this agent is its ability to handle name aliases/variants when investigating fraud:

| Primary Name | Known Aliases |
|-------------|---------------|
| John Martinez | J. Martinez, Johnny Martinez, Juan Martinez, John M. |
| Sarah Chen | S. Chen, Sara Chen, Sarah C., Xiao Chen |
| Michael Thompson | Mike Thompson, M. Thompson, Michael T., Mike T. |
| Emily Rodriguez | E. Rodriguez, Em Rodriguez, Emily R., Emilia Rodriguez |

The agent cross-references every transaction's "name on card" against all known aliases to determine:
- **Known alias + normal location** = Likely legitimate
- **Known alias + suspicious location** = Elevated risk
- **Unknown name variant** = High risk of unauthorized use

## Example: Investigating USR-10042

```
Analyst> Investigate user USR-10042 for fraud

Agent> INVESTIGATION REPORT: USR-10042 (John Martinez)

USER PROFILE
  Name: John Martinez
  Aliases: J. Martinez, Johnny Martinez, Juan Martinez, John M.
  Location: Tampa, FL | Risk Score: 12 (was low)

LOCATION ANOMALIES
  WARNING 2025-03-11 22:45 - Lagos, Nigeria (UNUSUAL - Unknown Android)
  WARNING 2025-03-12 01:30 - Moscow, Russia (UNUSUAL - Windows PC)
  OK Normal activity from Tampa, FL on 03/10 and 03/11 morning

SUSPICIOUS TRANSACTIONS
  TXN-004: $2,499.99 - Electronics Hub Online (Lagos, Nigeria)
    Name: "Johnny Martinez" (known alias)
    Flags: HIGH_RISK_LOCATION, HIGH_VALUE, IMPOSSIBLE_TRAVEL

  TXN-005: $1,899.00 - LuxuryWatches.net (Lagos, Nigeria)
    Name: "J. Martinez" (known alias)
    Flags: HIGH_RISK_LOCATION, HIGH_VALUE

  TXN-006: $5,000.00 - CryptoExchange Pro (Moscow, Russia)
    Name: "Juan Martinez" (known alias)
    Flags: HIGH_RISK_LOCATION, HIGH_VALUE, HIGH_RISK_CATEGORY

RISK ASSESSMENT: CRITICAL (Score: 95+)
  Recommendation: IMMEDIATE ACTION
  - Freeze account immediately
  - Block all pending transactions
  - Contact customer to verify
  - Issue new card
  - File SAR (Suspicious Activity Report)
```

## Extending the Agent

### Adding New Users

Add user data to the tool classes:

1. **UserIdentificationTool.java**: Add to `USER_PROFILES`, `USER_USUAL_LOCATIONS`, `USER_LOCATION_HISTORY`
2. **TransactionAnalysisTool.java**: Add to `USER_TRANSACTIONS`
3. **FraudRiskScoringTool.java**: Add to `ACCOUNT_BEHAVIOR_BASELINES`

### Integrating Real APIs

The tool classes are designed to be swapped with real integrations:

- **User Identity**: [Jumio](https://www.jumio.com/), [Onfido](https://onfido.com/), [Plaid Identity](https://plaid.com/products/identity/)
- **Transactions**: [Stripe Radar](https://stripe.com/radar), [Plaid Transactions](https://plaid.com/products/transactions/)
- **Risk Scoring**: [Featurespace](https://www.featurespace.com/), [Feedzai](https://feedzai.com/), [FICO Falcon](https://www.fico.com/en/products/fico-falcon-platform)

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | Java 21 |
| AI Framework | Google ADK 1.2.0 |
| LLM | Gemini 2.0 Flash |
| Build Tool | Maven |
| Reactive | RxJava 3 |
| Logging | Logback + SLF4J |

## License

This project is part of the Cognition Partner Workshops collection.
