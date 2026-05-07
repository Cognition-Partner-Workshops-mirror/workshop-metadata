package com.example.frauddetection.tools;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Tool that analyzes transactions to detect fraud patterns.
 * Examines transaction history, amounts, frequency, merchant categories,
 * and cross-references with user behavior patterns to flag suspicious activity.
 *
 * In production, this would integrate with payment processors, banking APIs,
 * and ML-based fraud scoring systems.
 */
public final class TransactionAnalysisTool {

    private static final Map<String, List<Map<String, Object>>> USER_TRANSACTIONS = Map.of(
            "USR-10042", List.of(
                    Map.<String, Object>of("txnId", "TXN-001", "date", "2025-03-10 09:15:00", "amount", 45.99, "merchant", "Publix Supermarket", "category", "Groceries", "location", "Tampa, FL", "nameOnCard", "John Martinez", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-002", "date", "2025-03-10 12:30:00", "amount", 12.50, "merchant", "Starbucks", "category", "Food & Drink", "location", "Tampa, FL", "nameOnCard", "John Martinez", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-003", "date", "2025-03-11 10:00:00", "amount", 89.99, "merchant", "Target", "category", "Retail", "location", "Tampa, FL", "nameOnCard", "John M.", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-004", "date", "2025-03-11 22:50:00", "amount", 2499.99, "merchant", "Electronics Hub Online", "category", "Electronics", "location", "Lagos, Nigeria", "nameOnCard", "Johnny Martinez", "status", "flagged"),
                    Map.<String, Object>of("txnId", "TXN-005", "date", "2025-03-11 23:10:00", "amount", 1899.00, "merchant", "LuxuryWatches.net", "category", "Luxury Goods", "location", "Lagos, Nigeria", "nameOnCard", "J. Martinez", "status", "flagged"),
                    Map.<String, Object>of("txnId", "TXN-006", "date", "2025-03-12 01:35:00", "amount", 5000.00, "merchant", "CryptoExchange Pro", "category", "Cryptocurrency", "location", "Moscow, Russia", "nameOnCard", "Juan Martinez", "status", "blocked")
            ),
            "USR-20087", List.of(
                    Map.<String, Object>of("txnId", "TXN-101", "date", "2025-03-10 08:00:00", "amount", 5.75, "merchant", "Blue Bottle Coffee", "category", "Food & Drink", "location", "San Francisco, CA", "nameOnCard", "Sarah Chen", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-102", "date", "2025-03-10 12:15:00", "amount", 32.00, "merchant", "Whole Foods Market", "category", "Groceries", "location", "San Francisco, CA", "nameOnCard", "Sarah Chen", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-103", "date", "2025-03-11 09:30:00", "amount", 150.00, "merchant", "Adobe Systems", "category", "Software", "location", "San Jose, CA", "nameOnCard", "S. Chen", "status", "completed")
            ),
            "USR-30156", List.of(
                    Map.<String, Object>of("txnId", "TXN-201", "date", "2025-03-10 08:00:00", "amount", 15.00, "merchant", "NYC Taxi", "category", "Transportation", "location", "New York, NY", "nameOnCard", "Michael Thompson", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-202", "date", "2025-03-10 13:00:00", "amount", 78.50, "merchant", "Ruth's Chris Steak House", "category", "Dining", "location", "New York, NY", "nameOnCard", "Michael Thompson", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-203", "date", "2025-03-10 23:20:00", "amount", 3200.00, "merchant", "Gold Souk Trading", "category", "Jewelry", "location", "Dubai, UAE", "nameOnCard", "Mike Thompson", "status", "flagged"),
                    Map.<String, Object>of("txnId", "TXN-204", "date", "2025-03-11 02:10:00", "amount", 8750.00, "merchant", "HK Electronics Wholesale", "category", "Electronics", "location", "Hong Kong", "nameOnCard", "M. Thompson", "status", "flagged"),
                    Map.<String, Object>of("txnId", "TXN-205", "date", "2025-03-11 04:00:00", "amount", 22.00, "merchant", "NYC Subway", "category", "Transportation", "location", "New York, NY", "nameOnCard", "Michael Thompson", "status", "completed")
            ),
            "USR-40201", List.of(
                    Map.<String, Object>of("txnId", "TXN-301", "date", "2025-03-09 11:00:00", "amount", 225.00, "merchant", "Sephora", "category", "Beauty", "location", "Miami, FL", "nameOnCard", "Emily Rodriguez", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-302", "date", "2025-03-09 15:30:00", "amount", 67.00, "merchant", "Uber", "category", "Transportation", "location", "Miami, FL", "nameOnCard", "Emily Rodriguez", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-303", "date", "2025-03-10 11:30:00", "amount", 4500.00, "merchant", "WireTransfer Express", "category", "Money Transfer", "location", "Bucharest, Romania", "nameOnCard", "Emilia Rodriguez", "status", "flagged"),
                    Map.<String, Object>of("txnId", "TXN-304", "date", "2025-03-10 11:32:00", "amount", 3800.00, "merchant", "WireTransfer Express", "category", "Money Transfer", "location", "Bucharest, Romania", "nameOnCard", "E. Rodriguez", "status", "blocked"),
                    Map.<String, Object>of("txnId", "TXN-305", "date", "2025-03-10 11:40:00", "amount", 95.00, "merchant", "Whole Foods", "category", "Groceries", "location", "Miami, FL", "nameOnCard", "Emily Rodriguez", "status", "completed"),
                    Map.<String, Object>of("txnId", "TXN-306", "date", "2025-03-10 23:05:00", "amount", 6200.00, "merchant", "AfriTech Gadgets", "category", "Electronics", "location", "Lagos, Nigeria", "nameOnCard", "Em Rodriguez", "status", "blocked")
            )
    );

    private TransactionAnalysisTool() {}

    /**
     * Retrieves all transactions for a given user, optionally filtered by status.
     *
     * @param userId the unique user identifier
     * @param statusFilter filter by status: "all", "completed", "flagged", or "blocked"
     * @return a map containing the user's transactions
     */
    public static ImmutableMap<String, Object> getTransactions(String userId, String statusFilter) {
        List<Map<String, Object>> transactions = USER_TRANSACTIONS.get(userId);
        if (transactions == null) {
            return ImmutableMap.of(
                    "status", "error",
                    "message", "No transactions found for user " + userId + ". Available users: " + String.join(", ", USER_TRANSACTIONS.keySet())
            );
        }

        List<Map<String, Object>> filtered;
        if (statusFilter == null || statusFilter.equals("all")) {
            filtered = transactions;
        } else {
            filtered = transactions.stream()
                    .filter(t -> t.get("status").equals(statusFilter))
                    .toList();
        }

        double totalAmount = filtered.stream()
                .mapToDouble(t -> (double) t.get("amount"))
                .sum();

        return ImmutableMap.of(
                "status", "success",
                "userId", userId,
                "filter", statusFilter != null ? statusFilter : "all",
                "transactionCount", filtered.size(),
                "totalAmount", String.format("$%.2f", totalAmount),
                "transactions", filtered
        );
    }

    /**
     * Analyzes transactions for fraud patterns including: name/alias mismatches,
     * unusual locations, rapid succession transactions, high-value anomalies,
     * and suspicious merchant categories.
     *
     * @param userId the unique user identifier
     * @return a map containing fraud analysis results with risk scoring
     */
    public static ImmutableMap<String, Object> analyzeFraudPatterns(String userId) {
        List<Map<String, Object>> transactions = USER_TRANSACTIONS.get(userId);
        if (transactions == null) {
            return ImmutableMap.of("status", "error", "message", "No transactions for user " + userId);
        }

        List<Map<String, Object>> flaggedTransactions = new ArrayList<>();
        List<String> fraudIndicators = new ArrayList<>();
        int riskScore = 0;

        List<String> highRiskCategories = List.of("Cryptocurrency", "Money Transfer", "Luxury Goods", "Electronics");
        List<String> highRiskLocations = List.of("Lagos, Nigeria", "Moscow, Russia", "Bucharest, Romania", "Dubai, UAE", "Hong Kong");

        String previousLocation = null;
        String previousTimestamp = null;

        for (Map<String, Object> txn : transactions) {
            List<String> txnFlags = new ArrayList<>();
            String location = (String) txn.get("location");
            double amount = (double) txn.get("amount");
            String category = (String) txn.get("category");
            String timestamp = (String) txn.get("date");

            if (highRiskLocations.contains(location)) {
                txnFlags.add("HIGH_RISK_LOCATION: " + location);
                riskScore += 25;
            }

            if (amount > 2000) {
                txnFlags.add("HIGH_VALUE: $" + String.format("%.2f", amount));
                riskScore += 15;
            }

            if (highRiskCategories.contains(category)) {
                txnFlags.add("HIGH_RISK_CATEGORY: " + category);
                riskScore += 20;
            }

            if (previousLocation != null && !previousLocation.equals(location)) {
                if (previousTimestamp != null) {
                    String prevHour = previousTimestamp.substring(11, 13);
                    String currHour = timestamp.substring(11, 13);
                    int hourDiff = Math.abs(Integer.parseInt(currHour) - Integer.parseInt(prevHour));
                    if (hourDiff < 3 && highRiskLocations.contains(location)) {
                        txnFlags.add("IMPOSSIBLE_TRAVEL: From " + previousLocation + " to " + location + " in <3 hours");
                        riskScore += 35;
                    }
                }
            }

            if (!txnFlags.isEmpty()) {
                flaggedTransactions.add(ImmutableMap.<String, Object>builder()
                        .putAll(txn)
                        .put("fraudFlags", txnFlags)
                        .build());
                fraudIndicators.addAll(txnFlags);
            }

            previousLocation = location;
            previousTimestamp = timestamp;
        }

        String overallRisk;
        if (riskScore >= 80) {
            overallRisk = "CRITICAL";
        } else if (riskScore >= 50) {
            overallRisk = "HIGH";
        } else if (riskScore >= 25) {
            overallRisk = "MEDIUM";
        } else {
            overallRisk = "LOW";
        }

        return ImmutableMap.<String, Object>builder()
                .put("status", "success")
                .put("userId", userId)
                .put("totalTransactions", transactions.size())
                .put("flaggedTransactions", flaggedTransactions)
                .put("flaggedCount", flaggedTransactions.size())
                .put("fraudIndicators", fraudIndicators)
                .put("riskScore", riskScore)
                .put("overallRisk", overallRisk)
                .put("recommendation", switch (overallRisk) {
                    case "CRITICAL" -> "IMMEDIATE ACTION: Freeze account, notify fraud team, contact customer";
                    case "HIGH" -> "Block pending transactions, require identity verification before proceeding";
                    case "MEDIUM" -> "Monitor closely, request step-up authentication for next transaction";
                    default -> "No immediate action required, continue monitoring";
                })
                .build();
    }

    /**
     * Checks if a transaction name matches any known alias for the user,
     * helping identify whether a transaction made under a variant name
     * belongs to the account holder or is potentially fraudulent.
     *
     * @param userId the unique user identifier
     * @param transactionName the name used on the transaction
     * @return a map indicating whether the name matches the user or their aliases
     */
    public static ImmutableMap<String, Object> verifyTransactionName(String userId, String transactionName) {
        Map<String, Object> userProfile = null;
        for (Map.Entry<String, Map<String, Object>> entry : Map.of(
                "USR-10042", Map.<String, Object>of("name", "John Martinez", "aliases", List.of("J. Martinez", "Johnny Martinez", "Juan Martinez", "John M.")),
                "USR-20087", Map.<String, Object>of("name", "Sarah Chen", "aliases", List.of("S. Chen", "Sara Chen", "Sarah C.", "Xiao Chen")),
                "USR-30156", Map.<String, Object>of("name", "Michael Thompson", "aliases", List.of("Mike Thompson", "M. Thompson", "Michael T.", "Mike T.")),
                "USR-40201", Map.<String, Object>of("name", "Emily Rodriguez", "aliases", List.of("E. Rodriguez", "Em Rodriguez", "Emily R.", "Emilia Rodriguez"))
        ).entrySet()) {
            if (entry.getKey().equals(userId)) {
                userProfile = entry.getValue();
                break;
            }
        }

        if (userProfile == null) {
            return ImmutableMap.of("status", "error", "message", "User not found: " + userId);
        }

        String primaryName = (String) userProfile.get("name");
        List<String> aliases = (List<String>) userProfile.get("aliases");
        String queryLower = transactionName.toLowerCase().trim();

        if (primaryName.toLowerCase().equals(queryLower)) {
            return ImmutableMap.of(
                    "status", "verified",
                    "userId", userId,
                    "transactionName", transactionName,
                    "matchType", "PRIMARY_NAME",
                    "confidence", 100,
                    "riskNote", "Name exactly matches registered account holder"
            );
        }

        for (String alias : aliases) {
            if (alias.toLowerCase().equals(queryLower)) {
                return ImmutableMap.of(
                        "status", "verified",
                        "userId", userId,
                        "transactionName", transactionName,
                        "matchType", "KNOWN_ALIAS",
                        "matchedAlias", alias,
                        "confidence", 90,
                        "riskNote", "Name matches a known alias - legitimate but monitor for unusual patterns"
                );
            }
        }

        return ImmutableMap.of(
                "status", "unverified",
                "userId", userId,
                "transactionName", transactionName,
                "matchType", "NO_MATCH",
                "confidence", 0,
                "primaryName", primaryName,
                "knownAliases", aliases,
                "riskNote", "ALERT: Name does not match any known identity for this account. Possible unauthorized use."
        );
    }
}
