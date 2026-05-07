package com.example.frauddetection.tools;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Tool that provides comprehensive fraud risk scoring by combining signals
 * from user identification, location analysis, and transaction patterns.
 * Generates an overall fraud risk assessment with actionable recommendations.
 *
 * In production, this would use ML models trained on historical fraud data,
 * integrate with third-party fraud scoring services (Featurespace, Feedzai, etc.),
 * and incorporate real-time behavioral biometrics.
 */
public final class FraudRiskScoringTool {

    private static final Map<String, Map<String, Object>> ACCOUNT_BEHAVIOR_BASELINES = Map.of(
            "USR-10042", Map.<String, Object>of(
                    "avgDailyTransactions", 3,
                    "avgTransactionAmount", 55.00,
                    "maxHistoricalAmount", 450.00,
                    "typicalCategories", List.of("Groceries", "Food & Drink", "Retail", "Gas"),
                    "typicalHoursActive", "06:00-22:00 EST",
                    "accountAgeMonths", 72
            ),
            "USR-20087", Map.<String, Object>of(
                    "avgDailyTransactions", 2,
                    "avgTransactionAmount", 42.00,
                    "maxHistoricalAmount", 350.00,
                    "typicalCategories", List.of("Food & Drink", "Groceries", "Software", "Transportation"),
                    "typicalHoursActive", "07:00-21:00 PST",
                    "accountAgeMonths", 56
            ),
            "USR-30156", Map.<String, Object>of(
                    "avgDailyTransactions", 4,
                    "avgTransactionAmount", 120.00,
                    "maxHistoricalAmount", 800.00,
                    "typicalCategories", List.of("Transportation", "Dining", "Entertainment", "Retail"),
                    "typicalHoursActive", "06:00-23:00 EST",
                    "accountAgeMonths", 40
            ),
            "USR-40201", Map.<String, Object>of(
                    "avgDailyTransactions", 3,
                    "avgTransactionAmount", 85.00,
                    "maxHistoricalAmount", 500.00,
                    "typicalCategories", List.of("Beauty", "Transportation", "Shopping", "Dining"),
                    "typicalHoursActive", "08:00-22:00 EST",
                    "accountAgeMonths", 38
            )
    );

    private FraudRiskScoringTool() {}

    /**
     * Generates a comprehensive fraud risk report for a user by analyzing their
     * account behavior baselines against recent activity.
     *
     * @param userId the unique user identifier
     * @return a map containing the full risk assessment with scoring breakdown
     */
    public static ImmutableMap<String, Object> generateRiskReport(String userId) {
        Map<String, Object> baseline = ACCOUNT_BEHAVIOR_BASELINES.get(userId);
        if (baseline == null) {
            return ImmutableMap.of("status", "error", "message", "No behavior baseline for user " + userId);
        }

        List<String> riskFactors = new ArrayList<>();
        List<String> mitigatingFactors = new ArrayList<>();
        int riskScore = 0;

        int accountAge = (int) baseline.get("accountAgeMonths");
        if (accountAge < 6) {
            riskFactors.add("New account (less than 6 months old)");
            riskScore += 15;
        } else if (accountAge > 24) {
            mitigatingFactors.add("Established account (" + accountAge + " months old)");
        }

        return ImmutableMap.<String, Object>builder()
                .put("status", "success")
                .put("userId", userId)
                .put("behaviorBaseline", baseline)
                .put("riskFactors", riskFactors)
                .put("mitigatingFactors", mitigatingFactors)
                .put("baselineRiskScore", riskScore)
                .build();
    }

    /**
     * Evaluates a specific transaction against the user's behavior baseline
     * and known aliases to determine fraud probability.
     *
     * @param userId the unique user identifier
     * @param transactionAmount the transaction amount in dollars
     * @param merchantCategory the merchant category
     * @param transactionLocation the location where the transaction occurred
     * @param nameUsed the name used on the transaction
     * @return a map with detailed fraud scoring for this specific transaction
     */
    public static ImmutableMap<String, Object> scoreTransaction(
            String userId,
            double transactionAmount,
            String merchantCategory,
            String transactionLocation,
            String nameUsed) {

        Map<String, Object> baseline = ACCOUNT_BEHAVIOR_BASELINES.get(userId);
        if (baseline == null) {
            return ImmutableMap.of("status", "error", "message", "No baseline data for " + userId);
        }

        List<String> flags = new ArrayList<>();
        int score = 0;

        double maxHistorical = (double) baseline.get("maxHistoricalAmount");
        double avgAmount = (double) baseline.get("avgTransactionAmount");

        if (transactionAmount > maxHistorical * 3) {
            flags.add("AMOUNT_ANOMALY: Transaction is " + String.format("%.0fx", transactionAmount / avgAmount) + " the user's average");
            score += 30;
        } else if (transactionAmount > maxHistorical) {
            flags.add("ABOVE_MAX: Exceeds historical maximum of $" + String.format("%.2f", maxHistorical));
            score += 15;
        }

        List<String> typicalCategories = (List<String>) baseline.get("typicalCategories");
        if (!typicalCategories.contains(merchantCategory)) {
            flags.add("UNUSUAL_CATEGORY: '" + merchantCategory + "' not in typical spending pattern");
            score += 10;
        }

        List<String> highRiskLocations = List.of("Lagos, Nigeria", "Moscow, Russia", "Bucharest, Romania", "Dubai, UAE", "Hong Kong", "Unknown");
        if (highRiskLocations.stream().anyMatch(transactionLocation::contains)) {
            flags.add("HIGH_RISK_GEOGRAPHY: Transaction from " + transactionLocation);
            score += 30;
        }

        Map<String, List<String>> knownAliases = Map.of(
                "USR-10042", List.of("John Martinez", "J. Martinez", "Johnny Martinez", "Juan Martinez", "John M."),
                "USR-20087", List.of("Sarah Chen", "S. Chen", "Sara Chen", "Sarah C.", "Xiao Chen"),
                "USR-30156", List.of("Michael Thompson", "Mike Thompson", "M. Thompson", "Michael T.", "Mike T."),
                "USR-40201", List.of("Emily Rodriguez", "E. Rodriguez", "Em Rodriguez", "Emily R.", "Emilia Rodriguez")
        );

        List<String> userNames = knownAliases.getOrDefault(userId, List.of());
        boolean nameMatch = userNames.stream()
                .anyMatch(n -> n.toLowerCase().equals(nameUsed.toLowerCase()));

        if (!nameMatch) {
            flags.add("NAME_MISMATCH: '" + nameUsed + "' does not match any known name/alias for this account");
            score += 25;
        } else if (!nameUsed.equals(userNames.get(0))) {
            flags.add("ALIAS_USED: Transaction under alias '" + nameUsed + "' instead of primary name");
            score += 5;
        }

        String decision;
        if (score >= 60) {
            decision = "BLOCK";
        } else if (score >= 35) {
            decision = "FLAG_FOR_REVIEW";
        } else if (score >= 15) {
            decision = "STEP_UP_AUTH";
        } else {
            decision = "APPROVE";
        }

        return ImmutableMap.<String, Object>builder()
                .put("status", "success")
                .put("userId", userId)
                .put("transactionAmount", transactionAmount)
                .put("merchantCategory", merchantCategory)
                .put("transactionLocation", transactionLocation)
                .put("nameUsed", nameUsed)
                .put("nameVerified", nameMatch)
                .put("fraudScore", score)
                .put("maxScore", 100)
                .put("flags", flags)
                .put("decision", decision)
                .put("explanation", switch (decision) {
                    case "BLOCK" -> "Multiple high-risk signals detected. Transaction should be blocked immediately.";
                    case "FLAG_FOR_REVIEW" -> "Suspicious activity detected. Flag for manual review by fraud team.";
                    case "STEP_UP_AUTH" -> "Minor anomalies detected. Request additional authentication before approving.";
                    default -> "Transaction appears consistent with user behavior. Safe to approve.";
                })
                .build();
    }

    /**
     * Generates a summary of suspicious activity patterns across all transactions
     * for a user, highlighting the most concerning fraud indicators.
     *
     * @param userId the unique user identifier
     * @return a map with a fraud investigation summary
     */
    public static ImmutableMap<String, Object> getInvestigationSummary(String userId) {
        Map<String, Object> baseline = ACCOUNT_BEHAVIOR_BASELINES.get(userId);
        if (baseline == null) {
            return ImmutableMap.of("status", "error", "message", "User not found: " + userId);
        }

        Map<String, List<String>> investigationNotes = Map.of(
                "USR-10042", List.of(
                        "Account shows normal activity until 2025-03-11 22:45 when access from Lagos, Nigeria detected",
                        "Three high-value transactions attempted using name variants (Johnny Martinez, J. Martinez, Juan Martinez)",
                        "Impossible travel: Tampa FL to Lagos Nigeria within hours",
                        "All suspicious transactions target electronics and crypto - common fraud pattern",
                        "Recommendation: Account compromise likely. Freeze account, contact customer, issue new card"
                ),
                "USR-20087", List.of(
                        "No suspicious activity detected",
                        "All transactions consistent with behavior baseline",
                        "Locations match known patterns (SF Bay Area)",
                        "Recommendation: No action needed. Continue standard monitoring"
                ),
                "USR-30156", List.of(
                        "Suspicious transactions from Dubai and Hong Kong on same night as NYC activity",
                        "Impossible travel detected: NYC to Dubai in <1 hour",
                        "High-value purchases (jewelry $3,200, electronics $8,750) using name aliases",
                        "User resumed normal NYC activity next morning - suggests card cloning",
                        "Recommendation: Block flagged transactions, confirm with customer, check for card skimming incidents"
                ),
                "USR-40201", List.of(
                        "Multiple wire transfers from Bucharest, Romania attempted in rapid succession",
                        "Account not KYC verified - elevated baseline risk",
                        "Simultaneous activity from Miami AND Bucharest (11:30-11:35) - impossible",
                        "Additional activity from Lagos, Nigeria same evening using name alias 'Em Rodriguez'",
                        "Pattern suggests sophisticated fraud ring using multiple international locations",
                        "Recommendation: URGENT - Freeze account immediately, escalate to fraud investigation team"
                )
        );

        List<String> notes = investigationNotes.getOrDefault(userId, List.of("No investigation data available"));

        return ImmutableMap.of(
                "status", "success",
                "userId", userId,
                "behaviorBaseline", baseline,
                "investigationNotes", notes,
                "investigationStatus", notes.stream().anyMatch(n -> n.contains("URGENT")) ? "CRITICAL" : "STANDARD"
        );
    }
}
