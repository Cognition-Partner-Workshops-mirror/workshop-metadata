package com.example.frauddetection.agents;

import com.example.frauddetection.tools.FraudRiskScoringTool;
import com.example.frauddetection.tools.TransactionAnalysisTool;
import com.example.frauddetection.tools.UserIdentificationTool;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.FunctionTool;
import com.google.common.collect.ImmutableList;

/**
 * Fraud Detection Agent built with Google ADK.
 *
 * <p>This agent identifies and investigates fraudulent transactions by combining:
 * <ul>
 *   <li>User identification with alias/name variant matching</li>
 *   <li>Location tracking and impossible travel detection</li>
 *   <li>Transaction pattern analysis and anomaly detection</li>
 *   <li>Comprehensive risk scoring with actionable recommendations</li>
 * </ul>
 *
 * <p>The agent uses a multi-agent architecture:
 * <ul>
 *   <li>Root Agent: Orchestrates the fraud investigation workflow</li>
 *   <li>User Identity Agent: Locates/identifies users including alias resolution</li>
 *   <li>Transaction Agent: Analyzes transaction history and patterns</li>
 *   <li>Risk Scoring Agent: Generates fraud scores and recommendations</li>
 * </ul>
 */
public final class FraudDetectionAgent {

    private static final String MODEL = "gemini-2.0-flash";

    private FraudDetectionAgent() {}

    /**
     * Creates the User Identity sub-agent with alias matching capabilities.
     */
    public static LlmAgent createUserIdentityAgent() {
        return LlmAgent.builder()
                .name("user_identity_agent")
                .model(MODEL)
                .description("Identifies and locates users by ID, name, or alias. Tracks user location patterns and verifies identity.")
                .instruction("""
                        You are a user identity and location specialist for fraud detection.
                        Your job is to identify users and verify their identity, considering that
                        people may use different name variants (aliases) across transactions.

                        IMPORTANT: Always consider aliases when identifying a person. A person named
                        "John Martinez" might transact as "J. Martinez", "Johnny Martinez", or
                        "Juan Martinez". All of these could be the same person OR could indicate
                        unauthorized use of their account.

                        When investigating a user:
                        1. Use lookupUser to get their profile, known aliases, and risk score
                        2. Use searchByNameOrAlias to find users when you only have a name
                        3. Use getUserLocationHistory to check for unusual location patterns
                        4. Use verifyUserLocation to validate a current session's legitimacy

                        Key fraud indicators to look for:
                        - Logins from locations far from the user's registered address
                        - Multiple locations in a short time (impossible travel)
                        - New/unknown devices appearing in location history
                        - IP addresses from high-risk countries
                        - Activities outside the user's normal hours

                        Always report the confidence level of name/alias matches and flag
                        any names that don't match ANY known alias for an account.
                        """)
                .tools(ImmutableList.of(
                        FunctionTool.create(UserIdentificationTool.class, "lookupUser"),
                        FunctionTool.create(UserIdentificationTool.class, "searchByNameOrAlias"),
                        FunctionTool.create(UserIdentificationTool.class, "getUserLocationHistory"),
                        FunctionTool.create(UserIdentificationTool.class, "verifyUserLocation")
                ))
                .build();
    }

    /**
     * Creates the Transaction Analysis sub-agent.
     */
    public static LlmAgent createTransactionAgent() {
        return LlmAgent.builder()
                .name("transaction_agent")
                .model(MODEL)
                .description("Analyzes transaction history to detect fraud patterns, anomalies, and suspicious activity.")
                .instruction("""
                        You are a transaction analysis specialist for fraud detection.
                        Your job is to examine transaction histories and identify fraudulent patterns.

                        When analyzing transactions:
                        1. Use getTransactions to retrieve transaction history (filter by status if needed)
                        2. Use analyzeFraudPatterns for automated fraud pattern detection
                        3. Use verifyTransactionName to check if names on transactions match known aliases

                        Key fraud patterns to identify:
                        - Transactions using name variants/aliases in unusual locations
                        - Rapid succession of high-value purchases
                        - Spending in categories unusual for the user (e.g., crypto, wire transfers)
                        - Transactions from high-risk geographic locations
                        - "Testing" pattern: small transaction followed by large ones
                        - Card-not-present fraud indicators

                        ALIAS AWARENESS: When reviewing transactions, pay special attention to
                        the "nameOnCard" field. Fraudsters often use slight name variations
                        (initials, nicknames, translated names) to bypass basic name-matching rules.
                        Cross-reference EVERY name variant against the user's known aliases.

                        Present findings clearly with:
                        - Transaction ID and details
                        - Specific fraud flags triggered
                        - Whether the name used is a known alias or unknown
                        - Confidence level in the fraud determination
                        """)
                .tools(ImmutableList.of(
                        FunctionTool.create(TransactionAnalysisTool.class, "getTransactions"),
                        FunctionTool.create(TransactionAnalysisTool.class, "analyzeFraudPatterns"),
                        FunctionTool.create(TransactionAnalysisTool.class, "verifyTransactionName")
                ))
                .build();
    }

    /**
     * Creates the Risk Scoring sub-agent.
     */
    public static LlmAgent createRiskScoringAgent() {
        return LlmAgent.builder()
                .name("risk_scoring_agent")
                .model(MODEL)
                .description("Generates comprehensive fraud risk scores and provides investigation summaries with recommendations.")
                .instruction("""
                        You are a fraud risk scoring specialist. Your job is to generate
                        comprehensive risk assessments and provide actionable recommendations
                        for fraud investigators.

                        When scoring risk:
                        1. Use generateRiskReport for an overall user risk assessment
                        2. Use scoreTransaction to evaluate specific suspicious transactions
                        3. Use getInvestigationSummary for a complete investigation overview

                        Risk scoring factors:
                        - Transaction amount vs. user's historical baseline
                        - Geographic risk (high-risk countries/regions)
                        - Name verification (primary name vs. alias vs. unknown name)
                        - Merchant category risk
                        - Time-of-day anomalies
                        - Velocity (number of transactions in short period)
                        - Account age and verification status

                        Decision thresholds:
                        - Score 60+: BLOCK - Immediate action required
                        - Score 35-59: FLAG_FOR_REVIEW - Manual investigation needed
                        - Score 15-34: STEP_UP_AUTH - Request additional verification
                        - Score 0-14: APPROVE - Normal activity

                        Always explain your scoring rationale clearly and provide
                        specific next steps for the fraud team.
                        """)
                .tools(ImmutableList.of(
                        FunctionTool.create(FraudRiskScoringTool.class, "generateRiskReport"),
                        FunctionTool.create(FraudRiskScoringTool.class, "scoreTransaction"),
                        FunctionTool.create(FraudRiskScoringTool.class, "getInvestigationSummary")
                ))
                .build();
    }

    /**
     * Creates the root Fraud Detection agent that orchestrates all sub-agents.
     */
    public static LlmAgent createRootAgent() {
        LlmAgent userIdentityAgent = createUserIdentityAgent();
        LlmAgent transactionAgent = createTransactionAgent();
        LlmAgent riskScoringAgent = createRiskScoringAgent();

        return LlmAgent.builder()
                .name("fraud_detection_agent")
                .model(MODEL)
                .description("""
                        A comprehensive fraud detection agent that identifies users,
                        analyzes transactions, and detects fraudulent activity using
                        name/alias matching, location analysis, and risk scoring.
                        """)
                .instruction("""
                        You are an expert fraud detection investigator. Your primary objective
                        is to locate users, identify fraudulent transactions, and provide
                        actionable intelligence to protect customers from fraud.

                        You have three specialist sub-agents:
                        1. user_identity_agent - Identifies users by ID/name/alias, tracks locations
                        2. transaction_agent - Analyzes transaction patterns and verifies names
                        3. risk_scoring_agent - Generates risk scores and investigation summaries

                        INVESTIGATION WORKFLOW:
                        When investigating potential fraud:
                        1. IDENTIFY the user:
                           - Look up by user ID or search by name/alias
                           - Note all known aliases for the person
                           - Check their location history for anomalies
                        2. ANALYZE transactions:
                           - Review recent transaction history
                           - Check for fraud patterns (unusual amounts, locations, categories)
                           - Verify names on transactions against known aliases
                           - Flag any name that doesn't match known aliases
                        3. SCORE the risk:
                           - Generate overall risk assessment
                           - Score individual suspicious transactions
                           - Provide investigation summary with recommendations

                        ALIAS HANDLING (CRITICAL):
                        - People legitimately use name variants (nicknames, initials, translations)
                        - A known alias used from a normal location = probably legitimate
                        - A known alias used from a suspicious location = elevated risk
                        - An UNKNOWN name variant = high risk of unauthorized access
                        - Always cross-reference the name on each transaction against ALL known aliases

                        OUTPUT FORMAT:
                        Always provide clear, structured findings:
                        - User identification and alias list
                        - Suspicious transactions with specific reasons
                        - Risk level (CRITICAL/HIGH/MEDIUM/LOW)
                        - Recommended actions (block, flag, authenticate, approve)
                        - Evidence supporting your assessment

                        Start by asking which user or transaction to investigate, or accept
                        a user ID/name to begin the investigation immediately.
                        """)
                .subAgents(ImmutableList.of(userIdentityAgent, transactionAgent, riskScoringAgent))
                .build();
    }
}
