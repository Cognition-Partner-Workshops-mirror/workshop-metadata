# C2 — Framework Upgrade

## Challenge

Upgrade a project's framework, language version, or design library to a current version. You choose which upgrade path to take and how far to push it.

## Get Familiar First

Before starting, explore the repo using **DeepWiki** to understand the codebase:
- Open the repo's DeepWiki page to see the architecture, module dependencies, and code explanations
- Identify which parts of the codebase will be most affected by the upgrade
- Understand the existing test coverage — this is your safety net during the upgrade

## Options

### Option 1: Java/Spring Boot Upgrade
- **Repository:** [uc-framework-upgrade-monolith-to-microservices](https://github.com/Cognition-Partner-Workshops/uc-framework-upgrade-monolith-to-microservices)
- **Task:** Upgrade Java from 11 to 17+ and Spring Boot from 2.6.3 to 3.x. Handle breaking changes (javax → jakarta namespace, removed deprecated APIs, Gradle plugin updates).

### Option 2: Design Library Migration
- **Repository:** [coreui-free-react-admin-template](https://github.com/Cognition-Partner-Workshops/coreui-free-react-admin-template)
- **Task:** Change the design library from Bootstrap to Material UI.

### Option 3: Angular Upgrade
- **Repository:** [ts-angular-realworld-example-app](https://github.com/Cognition-Partner-Workshops/ts-angular-realworld-example-app) or [app_petclinic-angular](https://github.com/Cognition-Partner-Workshops/app_petclinic-angular)
- **Task:** Upgrade Angular to the latest major version.

### Option 4: Your Own Upgrade
- **Repository:** Any repo from the [catalog](../../catalog/repos.md) with outdated dependencies
- **Task:** Pick a dependency, framework, or language version that needs upgrading and have Devin handle it

## Quick-Start Prompt (copy-paste ready)

If you want to get started immediately with minimal friction, paste this into Devin:

> Upgrade uc-framework-upgrade-monolith-to-microservices from Java 11 + Spring Boot 2.6.3 to Java 17 + Spring Boot 3.2. Handle the javax to jakarta namespace migration, update Gradle build configuration, fix any deprecations, and ensure all tests pass. Open a PR with the changes.

## Level Up: Use AskDevin First

After your first attempt, try a different approach — go to **AskDevin** before starting a new session:

1. Ask: *"What are the biggest risks when upgrading uc-framework-upgrade-monolith-to-microservices from Spring Boot 2 to 3? Which files will need the most changes?"*
2. Ask: *"What's the best order to tackle the javax to jakarta migration, the Gradle plugin updates, and the deprecated API removals?"*
3. Use the refined plan as your Devin session prompt — compare the result to your first attempt

This shows how pre-planning with AskDevin leads to better session outcomes.

## Review the PR and Give Feedback

Once Devin opens a PR, practice the feedback loop:
- **Review the diff** — does the upgrade look complete? Are there any files Devin missed?
- **Leave a comment on the PR** asking Devin to fix something (e.g., *"This still uses javax.servlet — please update to jakarta.servlet"* or *"Can you also add a Docker multi-stage build?"*)
- **Watch Devin respond** to your PR comment and push a fix — this is how real teams work with Devin
- Try leaving both general comments and inline code comments to see how Devin handles each

## Keep Exploring

After completing your first upgrade, try other things:
- Run a **second upgrade in parallel** (e.g., Angular upgrade alongside Spring Boot) to see Devin handle two repos simultaneously
- Ask Devin to **generate an upgrade report** documenting all breaking changes encountered and how they were resolved
- Try the **same upgrade with a different prompting strategy** — one prescriptive, one open-ended — and compare the PRs
- Have Devin **add a CI pipeline** that would catch these issues in the future

## Target Outcomes (any of these count)

- Application builds and all tests pass after the upgrade
- Framework upgraded to target version (Spring Boot 3.x, Angular latest, etc.)
- PR with clear description of what changed and why
- Upgrade documentation or migration notes in the PR description

## What Participants Will Learn

- How Devin handles complex, cross-cutting framework upgrades
- How Devin identifies and resolves breaking changes (namespace migrations, API changes)
- Devin's ability to iteratively fix build/test failures after an upgrade
- The importance of having tests before upgrading (safety net)
- How to use PR comments to steer Devin's work after the initial session

## Devin Features Exercised

- Large-scale refactoring across many files
- Build system modification (Gradle/npm)
- Iterative error resolution
- PR creation and PR comment responses
- DeepWiki for codebase exploration
- AskDevin for pre-session planning
- Parallel sessions (if trying multiple upgrades)
- GitHub PR feedback loop

## Difficulty

Intermediate — depends on which upgrade path you choose.

## Estimated Time

60 minutes

## Notes

- For Option 1, the Spring Boot 2 → 3 migration is well-documented. Key changes: javax.* → jakarta.*, Spring Security config changes, deprecated API removal.
- For Option 2, this is a full UI library swap — expect Devin to touch many component files.
- There is no single right answer — different upgrade strategies are valid and comparing approaches is valuable.
- After Devin opens the PR, spend time reviewing and commenting — the feedback loop is a key part of the learning.
