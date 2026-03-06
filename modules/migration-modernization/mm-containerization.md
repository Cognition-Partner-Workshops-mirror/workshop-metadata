# C3 — Containerization

## Challenge

Extract a self-contained microservice from a monolith and containerize it. You choose which bounded context to extract, how to structure the communication, and how far to take the containerization.

## Repository

- **Primary:** [uc-framework-upgrade-monolith-to-microservices](https://github.com/Cognition-Partner-Workshops/uc-framework-upgrade-monolith-to-microservices)
- **Reference:** [app_petclinic-microservices](https://github.com/Cognition-Partner-Workshops/app_petclinic-microservices) (example of what "done" looks like)

## Get Familiar First

Before starting, explore the repo using **DeepWiki** to understand the monolith's architecture:
- Open the repo's DeepWiki page to see the module structure, domain model, and dependency graph
- Identify which bounded contexts exist and how tightly coupled they are
- Look at the test coverage — which domains have the best tests to serve as a safety net?

## Task

Pick **any** approach that interests you — here are some ideas, but you are not limited to these:

1. **Extract a microservice** — Pull out one bounded context (Articles, Users, or Comments) into a standalone Spring Boot service with its own database and Dockerfile
2. **Containerize the monolith first** — Add Docker support to the existing monolith before attempting extraction (a common real-world first step)
3. **Extract a different boundary** — Instead of the obvious domain boundaries, extract a cross-cutting concern (e.g., authentication as a separate service, or the GraphQL API layer)
4. **Design the target architecture** — Have Devin analyze the monolith and produce an architecture decision record (ADR) for how it should be decomposed, without writing code
5. **Full Docker Compose stack** — Extract multiple services and wire them together with Docker Compose, including a reverse proxy

The RealWorld app has three clear bounded contexts:
- **Articles** — CRUD, feed, favorites, tags
- **Users/Profiles** — registration, authentication, following
- **Comments** — CRUD linked to articles

## Quick-Start Prompt (copy-paste ready)

If you want to get started immediately with minimal friction, paste this into Devin:

> Analyze the domain boundaries in uc-framework-upgrade-monolith-to-microservices. Extract the Comments domain into a standalone Spring Boot microservice with its own database, Dockerfile, and REST API. The monolith should communicate with the comments microservice via HTTP. Create a docker-compose.yml that runs both services. Open a PR.

## Level Up: Use AskDevin First

After your first attempt, try a different approach — go to **AskDevin** before starting a new session:

1. Ask: *"What are the domain boundaries in uc-framework-upgrade-monolith-to-microservices? Which bounded context would be easiest to extract and which would be hardest?"*
2. Ask: *"If I extract the Articles domain from this monolith, what shared code and database tables will need to be handled? What communication pattern should I use?"*
3. Use the refined analysis as your Devin session prompt — compare the result to your first attempt

## Review the PR and Give Feedback

Once Devin opens a PR, practice the feedback loop:
- **Review the diff** — does the extraction look clean? Are there leftover dependencies on the monolith?
- **Leave a comment on the PR** asking Devin to improve something (e.g., *"The Dockerfile should use a multi-stage build"* or *"Add health check endpoints to both services"*)
- **Watch Devin respond** to your PR comment and push a fix — this is how real teams iterate with Devin
- Try leaving an inline comment on a specific line of the Dockerfile or docker-compose.yml

## Keep Exploring

After completing your first extraction, try other things:
- Extract a **second bounded context** in a parallel session and compare how Devin handles a different domain
- Ask Devin to **add Kubernetes manifests** on top of the Docker setup
- Have Devin **add an API gateway** or reverse proxy in front of the services
- Ask Devin to **write integration tests** that verify the monolith and microservice communicate correctly
- Compare your result to the [PetClinic Microservices](https://github.com/Cognition-Partner-Workshops/app_petclinic-microservices) reference architecture

## What Participants Will Learn

- How Devin analyzes domain boundaries and dependency graphs
- How Devin handles the complexity of extracting shared code
- Containerization best practices (multi-stage builds, health checks, env config)
- Service communication patterns (REST, shared contracts)
- How to use PR review comments to iterate on Devin's architectural decisions

## Devin Features Exercised

- Architectural analysis
- Code extraction and refactoring
- Docker/docker-compose authoring
- Multi-module project setup
- PR creation and PR comment responses
- DeepWiki for codebase exploration
- AskDevin for pre-session planning
- Parallel sessions (if extracting multiple services)
- GitHub PR feedback loop

## Difficulty

Intermediate to Advanced — depends on which bounded context you extract and how far you take it.

## Estimated Time

60 minutes

## Notes

- The Comments domain is the simplest extraction; Users/Profiles is the hardest because authentication is cross-cutting
- If you already completed the framework upgrade (C2), you can chain this challenge on top of the upgraded code
- There is no single right answer — different extraction strategies and containerization approaches are all valid
- After Devin opens the PR, spend time reviewing and commenting — the feedback loop is a key part of the learning
