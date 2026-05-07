package com.example.frauddetection.tools;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;

import java.util.List;
import java.util.Map;

/**
 * Tool that provides user identification and location capabilities with alias support.
 * Tracks user profiles, known aliases, geolocation history, device information,
 * and login patterns to support fraud transaction detection.
 *
 * In production, this would integrate with identity verification services,
 * device fingerprinting, IP geolocation APIs, and KYC systems.
 */
public final class UserIdentificationTool {

    private static final Map<String, Map<String, Object>> USER_PROFILES = Map.of(
            "USR-10042", Map.<String, Object>of(
                    "name", "John Martinez",
                    "aliases", List.of("J. Martinez", "Johnny Martinez", "Juan Martinez", "John M."),
                    "email", "john.martinez@email.com",
                    "phone", "+1-813-555-0142",
                    "registeredAddress", "4521 Bay Shore Blvd, Tampa, FL 33611",
                    "accountCreated", "2019-03-15",
                    "riskScore", 12,
                    "kycVerified", true
            ),
            "USR-20087", Map.<String, Object>of(
                    "name", "Sarah Chen",
                    "aliases", List.of("S. Chen", "Sara Chen", "Sarah C.", "Xiao Chen"),
                    "email", "sarah.chen@email.com",
                    "phone", "+1-415-555-0298",
                    "registeredAddress", "782 Market St, San Francisco, CA 94103",
                    "accountCreated", "2020-07-22",
                    "riskScore", 5,
                    "kycVerified", true
            ),
            "USR-30156", Map.<String, Object>of(
                    "name", "Michael Thompson",
                    "aliases", List.of("Mike Thompson", "M. Thompson", "Michael T.", "Mike T."),
                    "email", "m.thompson@email.com",
                    "phone", "+1-212-555-0367",
                    "registeredAddress", "155 E 72nd St, New York, NY 10021",
                    "accountCreated", "2021-11-03",
                    "riskScore", 45,
                    "kycVerified", true
            ),
            "USR-40201", Map.<String, Object>of(
                    "name", "Emily Rodriguez",
                    "aliases", List.of("E. Rodriguez", "Em Rodriguez", "Emily R.", "Emilia Rodriguez"),
                    "email", "e.rodriguez@email.com",
                    "phone", "+1-305-555-0489",
                    "registeredAddress", "920 Ocean Dr, Miami Beach, FL 33139",
                    "accountCreated", "2022-01-18",
                    "riskScore", 78,
                    "kycVerified", false
            )
    );

    private static final Map<String, List<String>> USER_USUAL_LOCATIONS = Map.of(
            "USR-10042", List.of("Tampa, FL", "Orlando, FL", "Atlanta, GA"),
            "USR-20087", List.of("San Francisco, CA", "San Jose, CA", "Seattle, WA"),
            "USR-30156", List.of("New York, NY", "Newark, NJ"),
            "USR-40201", List.of("Miami, FL", "Fort Lauderdale, FL")
    );

    private static final Map<String, List<Map<String, Object>>> USER_LOCATION_HISTORY = Map.of(
            "USR-10042", List.of(
                    Map.<String, Object>of("timestamp", "2025-03-10 08:15:00", "location", "Tampa, FL", "ip", "72.43.115.22", "device", "iPhone 15 Pro"),
                    Map.<String, Object>of("timestamp", "2025-03-10 12:30:00", "location", "Tampa, FL", "ip", "72.43.115.22", "device", "MacBook Pro"),
                    Map.<String, Object>of("timestamp", "2025-03-11 09:00:00", "location", "Tampa, FL", "ip", "72.43.115.22", "device", "iPhone 15 Pro"),
                    Map.<String, Object>of("timestamp", "2025-03-11 22:45:00", "location", "Lagos, Nigeria", "ip", "197.210.55.101", "device", "Unknown Android"),
                    Map.<String, Object>of("timestamp", "2025-03-12 01:30:00", "location", "Moscow, Russia", "ip", "95.173.128.44", "device", "Windows PC")
            ),
            "USR-20087", List.of(
                    Map.<String, Object>of("timestamp", "2025-03-10 09:00:00", "location", "San Francisco, CA", "ip", "104.28.55.12", "device", "Pixel 8"),
                    Map.<String, Object>of("timestamp", "2025-03-10 17:30:00", "location", "San Francisco, CA", "ip", "104.28.55.12", "device", "ThinkPad X1"),
                    Map.<String, Object>of("timestamp", "2025-03-11 08:45:00", "location", "San Jose, CA", "ip", "104.28.60.88", "device", "Pixel 8")
            ),
            "USR-30156", List.of(
                    Map.<String, Object>of("timestamp", "2025-03-10 07:00:00", "location", "New York, NY", "ip", "68.205.14.33", "device", "iPhone 14"),
                    Map.<String, Object>of("timestamp", "2025-03-10 14:00:00", "location", "New York, NY", "ip", "68.205.14.33", "device", "iPhone 14"),
                    Map.<String, Object>of("timestamp", "2025-03-10 23:15:00", "location", "Dubai, UAE", "ip", "185.56.232.10", "device", "Samsung Galaxy S24"),
                    Map.<String, Object>of("timestamp", "2025-03-11 02:00:00", "location", "Hong Kong", "ip", "203.198.14.77", "device", "Unknown Device"),
                    Map.<String, Object>of("timestamp", "2025-03-11 03:45:00", "location", "New York, NY", "ip", "68.205.14.33", "device", "iPhone 14")
            ),
            "USR-40201", List.of(
                    Map.<String, Object>of("timestamp", "2025-03-09 10:00:00", "location", "Miami, FL", "ip", "156.33.241.8", "device", "iPhone 13"),
                    Map.<String, Object>of("timestamp", "2025-03-09 16:00:00", "location", "Miami, FL", "ip", "156.33.241.8", "device", "iPhone 13"),
                    Map.<String, Object>of("timestamp", "2025-03-10 11:30:00", "location", "Bucharest, Romania", "ip", "89.136.21.55", "device", "Linux PC"),
                    Map.<String, Object>of("timestamp", "2025-03-10 11:35:00", "location", "Miami, FL", "ip", "156.33.241.8", "device", "iPhone 13"),
                    Map.<String, Object>of("timestamp", "2025-03-10 23:00:00", "location", "Lagos, Nigeria", "ip", "197.210.77.200", "device", "Unknown Android")
            )
    );

    private UserIdentificationTool() {}

    /**
     * Looks up a user by their ID and returns profile details including known aliases.
     *
     * @param userId the unique user identifier (e.g., USR-10042)
     * @return a map containing user profile information, aliases, and risk score
     */
    public static ImmutableMap<String, Object> lookupUser(String userId) {
        Map<String, Object> profile = USER_PROFILES.get(userId);
        if (profile == null) {
            return ImmutableMap.of(
                    "status", "not_found",
                    "message", "User " + userId + " not found. Available users: " + String.join(", ", USER_PROFILES.keySet())
            );
        }

        List<String> usualLocations = USER_USUAL_LOCATIONS.getOrDefault(userId, List.of());

        return ImmutableMap.<String, Object>builder()
                .put("status", "found")
                .put("userId", userId)
                .putAll(profile)
                .put("usualLocations", usualLocations)
                .build();
    }

    /**
     * Searches for a user by name or alias. Performs fuzzy matching against
     * registered names and all known aliases to identify the person even when
     * they use variant names on transactions.
     *
     * @param nameQuery the name or alias to search for
     * @return a map containing matched users with confidence scores
     */
    public static ImmutableMap<String, Object> searchByNameOrAlias(String nameQuery) {
        String queryLower = nameQuery.toLowerCase().trim();
        ImmutableList.Builder<Map<String, Object>> matches = ImmutableList.builder();

        for (Map.Entry<String, Map<String, Object>> entry : USER_PROFILES.entrySet()) {
            String userId = entry.getKey();
            Map<String, Object> profile = entry.getValue();
            String primaryName = ((String) profile.get("name")).toLowerCase();
            List<String> aliases = (List<String>) profile.get("aliases");

            String matchType = null;
            String matchedName = null;
            int confidence = 0;

            if (primaryName.equals(queryLower)) {
                matchType = "EXACT_PRIMARY_NAME";
                matchedName = (String) profile.get("name");
                confidence = 100;
            } else if (primaryName.contains(queryLower) || queryLower.contains(primaryName)) {
                matchType = "PARTIAL_PRIMARY_NAME";
                matchedName = (String) profile.get("name");
                confidence = 80;
            } else {
                for (String alias : aliases) {
                    String aliasLower = alias.toLowerCase();
                    if (aliasLower.equals(queryLower)) {
                        matchType = "EXACT_ALIAS";
                        matchedName = alias;
                        confidence = 95;
                        break;
                    } else if (aliasLower.contains(queryLower) || queryLower.contains(aliasLower)) {
                        matchType = "PARTIAL_ALIAS";
                        matchedName = alias;
                        confidence = 70;
                    }
                }
            }

            if (matchType != null) {
                matches.add(ImmutableMap.<String, Object>builder()
                        .put("userId", userId)
                        .put("primaryName", profile.get("name"))
                        .put("matchedAs", matchedName)
                        .put("matchType", matchType)
                        .put("confidence", confidence)
                        .put("allAliases", aliases)
                        .put("riskScore", profile.get("riskScore"))
                        .build());
            }
        }

        ImmutableList<Map<String, Object>> results = matches.build();
        return ImmutableMap.of(
                "status", results.isEmpty() ? "no_match" : "found",
                "query", nameQuery,
                "matchCount", results.size(),
                "matches", results,
                "note", results.isEmpty()
                        ? "No user matched the name '" + nameQuery + "'. The name may be a previously unknown alias."
                        : "Found " + results.size() + " user(s) matching the query."
        );
    }

    /**
     * Retrieves the location history for a user, annotating unusual locations
     * that deviate from their known patterns.
     *
     * @param userId the unique user identifier
     * @param lastNDays number of days of history to retrieve
     * @return a map containing the user's location history with anomaly flags
     */
    public static ImmutableMap<String, Object> getUserLocationHistory(String userId, int lastNDays) {
        List<Map<String, Object>> history = USER_LOCATION_HISTORY.get(userId);
        if (history == null) {
            return ImmutableMap.of(
                    "status", "error",
                    "message", "No location history found for user " + userId
            );
        }

        List<String> usualLocations = USER_USUAL_LOCATIONS.getOrDefault(userId, List.of());

        ImmutableList.Builder<Map<String, Object>> annotatedHistory = ImmutableList.builder();
        for (Map<String, Object> entry : history) {
            String location = (String) entry.get("location");
            boolean isUnusual = usualLocations.stream().noneMatch(location::contains);

            annotatedHistory.add(ImmutableMap.<String, Object>builder()
                    .putAll(entry)
                    .put("isUnusualLocation", isUnusual)
                    .put("flagReason", isUnusual ? "Location not in user's usual pattern" : "Normal location")
                    .build());
        }

        ImmutableList<Map<String, Object>> annotated = annotatedHistory.build();
        long suspiciousCount = annotated.stream()
                .filter(e -> (boolean) e.get("isUnusualLocation"))
                .count();

        return ImmutableMap.<String, Object>builder()
                .put("status", "success")
                .put("userId", userId)
                .put("usualLocations", usualLocations)
                .put("locationHistory", annotated)
                .put("suspiciousEntries", suspiciousCount)
                .put("riskAssessment", suspiciousCount > 2 ? "HIGH" : suspiciousCount > 0 ? "MEDIUM" : "LOW")
                .build();
    }

    /**
     * Verifies if a user's current session location is consistent with their known patterns.
     *
     * @param userId the unique user identifier
     * @param currentLocation the user's current reported location
     * @param currentIp the user's current IP address
     * @return a map with location verification results and anomaly flags
     */
    public static ImmutableMap<String, Object> verifyUserLocation(String userId, String currentLocation, String currentIp) {
        Map<String, Object> profile = USER_PROFILES.get(userId);
        if (profile == null) {
            return ImmutableMap.of("status", "error", "message", "User not found: " + userId);
        }

        List<String> usualLocations = USER_USUAL_LOCATIONS.getOrDefault(userId, List.of());
        boolean locationMatch = usualLocations.stream().anyMatch(currentLocation::contains);

        List<Map<String, Object>> history = USER_LOCATION_HISTORY.getOrDefault(userId, List.of());
        boolean ipKnown = history.stream().anyMatch(e -> e.get("ip").equals(currentIp));

        String riskLevel;
        String recommendation;
        if (locationMatch && ipKnown) {
            riskLevel = "LOW";
            recommendation = "Allow transaction to proceed";
        } else if (locationMatch || ipKnown) {
            riskLevel = "MEDIUM";
            recommendation = "Request step-up authentication (OTP/biometric)";
        } else {
            riskLevel = "HIGH";
            recommendation = "BLOCK transaction and require additional verification";
        }

        return ImmutableMap.<String, Object>builder()
                .put("status", "success")
                .put("userId", userId)
                .put("currentLocation", currentLocation)
                .put("currentIp", currentIp)
                .put("locationMatchesPattern", locationMatch)
                .put("ipPreviouslySeen", ipKnown)
                .put("riskLevel", riskLevel)
                .put("registeredAddress", profile.get("registeredAddress"))
                .put("recommendation", recommendation)
                .build();
    }
}
