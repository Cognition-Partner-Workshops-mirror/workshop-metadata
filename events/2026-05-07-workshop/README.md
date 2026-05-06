# Workshop: 2026-05-07 Java / Data Modernization Hands-On

## Event Details

| | |
|---|---|
| **Date** | 2026-05-07 |
| **Location** | Virtual |
| **Host Organization** | *(customer)* |
| **Duration** | 2.5-3 hours |
| **Audience** | Java / Spring Boot developers, monolith-to-microservices teams, ETL and Ab Initio developers, and workflow / low-code integration teams |
| **Format** | Shared core labs + role-specific specialization lanes |
| **Primary Repos** | `ts-java-spring-boot-internet-banking-microservices`, `ts-java-spring-petclinic-rest-api`, `uc-framework-upgrade-monolith-to-microservices`, `uc-data-source-migration-legacy-to-modern` |

## Workshop Overview

This is the primary mixed-audience event in this repository. It is designed for teams that want one workshop with solid coverage across four common enterprise personas:

1. **Java / Spring Boot developers** who want code analysis, API-first service generation, and safe framework modernization
2. **Monolith and microservices teams** who want decomposition, boundary analysis, and upgrade guidance
3. **ETL and data migration teams** who want schema migration, reconciliation, and legacy-to-modern platform translation
4. **Workflow / low-code teams** who need strong API and process-integration coverage, even if they are not working from a native Appian codebase

The workshop starts with a shared foundation that every audience can follow, then branches into specialization lanes so participants can spend the second half on the work most relevant to them.

## Audience Coverage Map

| Audience | Best-Fit Labs | What They See |
|----------|---------------|---------------|
| Java / Spring Boot developers | Labs 1, 2, 3A | Architecture assessment, API-first service generation, Spring Boot monolith modernization |
| Monolith / microservices developers | Labs 1, 3A | Domain boundaries, service decomposition, upgrade + extraction planning |
| ETL / Ab Initio developers | Labs 3B, Extension A, Extension B | Data migration, reconciliation, ETL translation, Databricks-oriented modernization |
| Workflow / low-code / Appian-adjacent teams | Lab 2, Extension C | API contract generation, service integration design, approval/workflow automation patterns |

> **Scope note:** This repo does not currently include a native Appian codebase. The closest fit for that audience is API generation, integration workflow design, and human-in-the-loop automation patterns.

## Agenda

| Time | Activity | Notes |
|------|----------|-------|
| 0:00 | Welcome, Devin workflow, repo setup check | Confirm participants can access the required mirror repos |
| 0:15 | **Lab 1 — Spring Boot Microservices Assessment** | Shared foundation for everyone |
| 0:45 | **Lab 2 — API-First Service Generation** | Shared foundation for everyone |
| 1:20 | Choose a specialization lane | Participants split based on role |
| 1:25 | **Lab 3A — Spring Boot Monolith to Service Extraction** | Java / modernization lane |
| 1:25 | **Lab 3B — Legacy Data Source Migration** | Data / ETL lane |
| 2:05 | Optional extensions | SAS, Ab Initio, or workflow automation |
| 2:35 | Review PRs, discuss outputs, Q&A | Compare results across lanes |

## Lab 1 — Spring Boot Microservices Assessment (30 min)

- **Repository:** [ts-java-spring-boot-internet-banking-microservices](https://github.com/Cognition-Partner-Workshops-mirror/ts-java-spring-boot-internet-banking-microservices)
- **Modules:** [API Design Review](../../modules/architecture-design/api-design-review.md), [Dependency Graph Analysis](../../modules/architecture-design/dependency-graph-analysis.md)
- **Why it matters:** Gives Java and microservices teams a low-risk entry point while also giving data and workflow audiences a business-domain map they can build on later

### Paste into Devin

```text
Perform a technical assessment of ts-java-spring-boot-internet-banking-microservices.

Produce:
1. `docs/ARCHITECTURE_OVERVIEW.md` summarizing services, communication patterns, infrastructure, and domain boundaries
2. `docs/API_GAPS.md` identifying API inconsistencies, missing validation, weak contracts, and service-boundary concerns
3. `docs/DECOMPOSITION_NOTES.md` explaining which capabilities are good candidates for further service extraction or consolidation

Focus on practical findings for a team deciding how to evolve this codebase over the next 6-12 months. Open a PR.
```

### While Devin works

Ask Devin:
- *Which Spring Boot services are most tightly coupled?*
- *Where are the strongest seams for additional decomposition?*
- *Which APIs would most benefit from contract hardening before other modernization work?*

### Review the PR

Look for:
- Clear bounded-context reasoning, not just package-level summaries
- Concrete API risks and not generic architecture commentary
- Recommendations that would make sense to both monolith and microservices teams

## Lab 2 — API-First Service Generation (35 min)

- **Repository:** [ts-java-spring-petclinic-rest-api](https://github.com/Cognition-Partner-Workshops-mirror/ts-java-spring-petclinic-rest-api)
- **Modules:** [API Design Review](../../modules/architecture-design/api-design-review.md), [BDD Test Generation](../../modules/testing-qa/bdd-test-generation.md)
- **Why it matters:** Strong fit for Spring Boot developers and also the best Appian-adjacent lab because it centers on contracts, integrations, and workflow-safe APIs

### Paste into Devin

```text
Use the OpenAPI spec in ts-java-spring-petclinic-rest-api to generate a production-style Spring Boot service scaffold for a new scheduling capability.

Deliverables:
1. `docs/SCHEDULING_DOMAIN_PLAN.md` defining the new capability, endpoints, data model, and validation rules
2. Spring Boot controller, service, DTO, and test scaffolding for the new scheduling endpoints
3. `docs/INTEGRATION_NOTES.md` explaining how external workflow tools or low-code platforms would call these APIs safely
4. BDD-style acceptance scenarios for the new endpoints

Follow the style and conventions already present in the repo. Open a PR.
```

### While Devin works

Ask Devin:
- *What makes an API easy for an external workflow platform to adopt?*
- *Which validation and idempotency patterns matter most for human-in-the-loop workflows?*
- *What contract tests would you add before exposing these endpoints to another team?*

### Review the PR

Look for:
- Good request/response modeling and validation
- Clear explanation of external integration patterns
- Test cases that reflect real business workflows instead of happy-path only coverage

## Lab 3A — Spring Boot Monolith to Service Extraction (40 min)

- **Repository:** [uc-framework-upgrade-monolith-to-microservices](https://github.com/Cognition-Partner-Workshops-mirror/uc-framework-upgrade-monolith-to-microservices)
- **Modules:** [Framework Upgrade](../../modules/migration-modernization/framework-upgrade.md), [Containerization & Microservice Extraction](../../modules/migration-modernization/containerization-microservice-extraction.md)
- **Best for:** Java / Spring Boot teams and monolith-to-microservices programs

### Paste into Devin

```text
Analyze uc-framework-upgrade-monolith-to-microservices and perform a focused modernization plan around one bounded context.

Deliverables:
1. Upgrade the repo from Spring Boot 2.x toward Spring Boot 3.x where practical, documenting all blocking changes in `docs/UPGRADE_NOTES.md`
2. Identify one bounded context that is safe to extract first and document the reasoning in `docs/EXTRACTION_PLAN.md`
3. Create a starter `article-service/` or similar service skeleton with DTOs, controller stubs, and integration notes showing how the monolith would call it
4. Add or update tests for any changed behavior

Do not attempt a full rewrite. Optimize for a credible first extraction step with evidence. Open a PR.
```

### Review the PR

Look for:
- Honest handling of Spring Boot 2 → 3 blockers
- A bounded context with clear ownership and manageable coupling
- A realistic first step, not an over-scoped rewrite

## Lab 3B — Legacy Data Source Migration (40 min)

- **Repository:** [uc-data-source-migration-legacy-to-modern](https://github.com/Cognition-Partner-Workshops-mirror/uc-data-source-migration-legacy-to-modern)
- **Modules:** [Data Source Migration](../../modules/data-engineering/data-source-migration.md), [Data Quality & Validation](../../modules/data-engineering/data-quality-validation.md)
- **Best for:** ETL teams, migration teams, and data-oriented backend engineers

### Paste into Devin

```text
Review uc-data-source-migration-legacy-to-modern and modernize the data layer with strong validation.

Deliverables:
1. Create modern typed entities and repositories aligned to the target schema
2. Add reconciliation checks covering row counts, key business fields, and type conversions
3. Update the service layer to read from the modernized schema
4. Write `docs/MIGRATION_VALIDATION.md` describing data risks, validation strategy, and any remaining gaps

Prioritize migration safety and evidence over breadth. Open a PR.
```

### Review the PR

Look for:
- Explicit treatment of risky type conversions
- Reconciliation logic that proves data correctness
- Clear explanation of what still needs production verification

## Optional Extension A — SAS to Python / Snowflake Migration

- **Repositories:** [ts-sas-legacy-codebase](https://github.com/Cognition-Partner-Workshops-mirror/ts-sas-legacy-codebase), [uc-data-migration-sas-to-snowflake](https://github.com/Cognition-Partner-Workshops-mirror/uc-data-migration-sas-to-snowflake)
- **Module:** [SAS to Python / Snowflake](../../modules/data-engineering/sas-to-python-snowflake.md)
- **Best for:** ETL teams modernizing legacy batch flows

### Paste into Devin

```text
Translate selected SAS macros from ts-sas-legacy-codebase into Python functions and Snowflake-oriented loading assets in uc-data-migration-sas-to-snowflake.

Document all translation choices in `SAS_MIGRATION_NOTES.md`, add pytest coverage, and include validation queries for row counts and checksums. Open a PR.
```

## Optional Extension B — Ab Initio to Databricks Migration

- **Repository:** [ts-python-abinitio-etl-framework](https://github.com/Cognition-Partner-Workshops-mirror/ts-python-abinitio-etl-framework)
- **Best for:** Ab Initio and enterprise ETL teams

### Paste into Devin

```text
Analyze ts-python-abinitio-etl-framework and create a Databricks migration starter kit.

Deliverables:
1. Sample Delta Lake schema translations from the DML files
2. A PySpark notebook or script pattern that mirrors one graph-based ETL flow
3. Workflow orchestration notes mapping PSET and shell-driven execution to Databricks jobs
4. `docs/ABINITIO_MIGRATION_RUNBOOK.md` documenting risks, assumptions, and validation strategy

Open a PR.
```

## Optional Extension C — Workflow Automation / Appian-Adjacent Exercise

- **Repository:** [uc-document-review-automation](https://github.com/Cognition-Partner-Workshops-mirror/uc-document-review-automation)
- **Module:** [Document Review Automation](../../modules/technical-documentation/document-review-automation.md)
- **Best for:** Workflow, case-management, and low-code integration teams

### Paste into Devin

```text
Review uc-document-review-automation and improve it for a workflow-oriented enterprise team.

Add one new comparison or approval strategy, write tests, and create `docs/WORKFLOW_INTEGRATION_NOTES.md` explaining how this system would integrate with a human approval platform or low-code orchestration layer. Open a PR.
```

## Prerequisites

### Repos Required

**Core labs:**
- [ ] ts-java-spring-boot-internet-banking-microservices
- [ ] ts-java-spring-petclinic-rest-api
- [ ] uc-framework-upgrade-monolith-to-microservices
- [ ] uc-data-source-migration-legacy-to-modern

**Optional extensions:**
- [ ] ts-sas-legacy-codebase
- [ ] uc-data-migration-sas-to-snowflake
- [ ] ts-python-abinitio-etl-framework
- [ ] uc-document-review-automation

### Participant Requirements

- [ ] Devin account access
- [ ] GitHub access to the `Cognition-Partner-Workshops-mirror` org
- [ ] Browser (Chrome recommended)

## Notes for Facilitators

- Keep everyone on the **shared Labs 1 and 2** before splitting into specialization lanes.
- For mixed rooms, recommend **Lab 3A** to Java / microservices teams and **Lab 3B** to ETL / data teams.
- If Appian or workflow-tool participants are present, steer them to **Lab 2** plus **Extension C**.
- Prefer evidence-heavy review: PRs should include docs, tests, or migration notes rather than only code changes.
