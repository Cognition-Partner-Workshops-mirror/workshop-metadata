package com.example.frauddetection;

import com.example.frauddetection.agents.FraudDetectionAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.agents.RunConfig;
import com.google.adk.artifacts.InMemoryArtifactService;
import com.google.adk.events.Event;
import com.google.adk.runner.Runner;
import com.google.adk.sessions.InMemorySessionService;
import com.google.common.collect.ImmutableList;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import io.reactivex.rxjava3.core.Flowable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Scanner;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Main application entry point for the Fraud Detection Agent.
 *
 * <p>This application demonstrates a Google ADK-based fraud detection agent that
 * identifies users (including by alias), analyzes their transactions, and detects
 * fraudulent activity through location analysis and risk scoring.
 *
 * <p>Usage:
 * <pre>
 *   # Set your Google API key
 *   export GOOGLE_API_KEY=your-api-key-here
 *
 *   # Run the application
 *   mvn exec:java
 * </pre>
 *
 * <p>Example interaction:
 * <pre>
 *   You> Investigate user USR-10042 for fraud
 *   Agent> [Identifies user, checks aliases, analyzes transactions, scores risk]
 * </pre>
 */
public class FraudDetectionApp {

    private static final Logger LOG = LoggerFactory.getLogger(FraudDetectionApp.class);
    private static final String APP_NAME = "FraudDetectionApp";

    private final Runner runner;
    private final String userId;
    private final String sessionId;

    public FraudDetectionApp() {
        this.userId = "analyst_" + UUID.randomUUID().toString().substring(0, 8);
        this.sessionId = UUID.randomUUID().toString();

        LlmAgent rootAgent = FraudDetectionAgent.createRootAgent();

        InMemoryArtifactService artifactService = new InMemoryArtifactService();
        InMemorySessionService sessionService = new InMemorySessionService();

        this.runner = new Runner(
                rootAgent,
                APP_NAME,
                artifactService,
                sessionService,
                /* memoryService= */ null
        );

        var unused = sessionService.createSession(
                APP_NAME,
                userId,
                new ConcurrentHashMap<>(),
                sessionId
        ).blockingGet();

        LOG.info("Fraud Detection Agent initialized. Session: {}", sessionId);
    }

    /**
     * Sends a user message to the agent and returns the response events.
     */
    public List<Event> chat(String userMessage) {
        Content userContent = Content.builder()
                .role("user")
                .parts(ImmutableList.of(Part.builder().text(userMessage).build()))
                .build();

        RunConfig runConfig = RunConfig.builder().build();

        Flowable<Event> eventStream = this.runner.runAsync(
                this.userId,
                this.sessionId,
                userContent,
                runConfig
        );

        return eventStream.toList().timeout(120, TimeUnit.SECONDS).blockingGet();
    }

    private static String extractResponse(List<Event> events) {
        StringBuilder response = new StringBuilder();
        for (Event event : events) {
            if (event.content().isPresent() && event.content().get().parts().isPresent()) {
                for (Part part : event.content().get().parts().get()) {
                    if (part.text().isPresent()) {
                        String text = part.text().get().stripTrailing();
                        if (!text.isEmpty()) {
                            if (!response.isEmpty()) {
                                response.append("\n");
                            }
                            response.append(text);
                        }
                    }
                }
            }
        }
        return response.toString();
    }

    /**
     * Runs the interactive console mode.
     */
    public void runInteractive() {
        System.out.println("=".repeat(70));
        System.out.println("  FRAUD DETECTION AGENT - Powered by Google ADK");
        System.out.println("  Identify users, detect fraud, and investigate transactions");
        System.out.println("=".repeat(70));
        System.out.println();
        System.out.println("  I can help you with:");
        System.out.println("  - Identifying users by ID, name, or alias");
        System.out.println("  - Analyzing transaction patterns for fraud");
        System.out.println("  - Detecting impossible travel and location anomalies");
        System.out.println("  - Scoring transactions for fraud risk");
        System.out.println("  - Cross-referencing names/aliases on transactions");
        System.out.println();
        System.out.println("  Type 'quit' or 'exit' to end the session.");
        System.out.println("  Type 'example' to see sample queries.");
        System.out.println("  Type 'users' to see available test users.");
        System.out.println("=".repeat(70));
        System.out.println();

        try (Scanner scanner = new Scanner(System.in)) {
            while (true) {
                System.out.print("Analyst> ");
                if (!scanner.hasNextLine()) {
                    break;
                }
                String input = scanner.nextLine().trim();

                if (input.isEmpty()) {
                    continue;
                }

                if (input.equalsIgnoreCase("quit") || input.equalsIgnoreCase("exit")) {
                    System.out.println("\nFraud Detection session ended.");
                    break;
                }

                if (input.equalsIgnoreCase("users")) {
                    System.out.println("\nAvailable test users:");
                    System.out.println("  USR-10042 - John Martinez (Tampa, FL) - Low risk baseline");
                    System.out.println("  USR-20087 - Sarah Chen (San Francisco, CA) - Clean history");
                    System.out.println("  USR-30156 - Michael Thompson (New York, NY) - Suspicious activity");
                    System.out.println("  USR-40201 - Emily Rodriguez (Miami, FL) - High risk");
                    System.out.println();
                    continue;
                }

                if (input.equalsIgnoreCase("example")) {
                    System.out.println("\nExample queries:");
                    System.out.println("  - \"Investigate user USR-10042 for fraud\"");
                    System.out.println("  - \"Search for user named Johnny Martinez\"");
                    System.out.println("  - \"Check if 'Juan Martinez' is a known alias\"");
                    System.out.println("  - \"Show all flagged transactions for USR-40201\"");
                    System.out.println("  - \"Score a $5000 crypto transaction from Lagos for USR-10042\"");
                    System.out.println("  - \"Is Mike Thompson the same as Michael Thompson?\"");
                    System.out.println("  - \"Show location history for USR-30156\"");
                    System.out.println();
                    continue;
                }

                try {
                    System.out.println("\nAgent> Investigating...\n");
                    List<Event> events = chat(input);
                    String response = extractResponse(events);
                    if (!response.isEmpty()) {
                        System.out.println("Agent> " + response);
                    } else {
                        System.out.println("Agent> Processing your request. Could you provide more details?");
                    }
                    System.out.println();
                } catch (Exception e) {
                    LOG.error("Error processing request", e);
                    System.out.println("Agent> Error: " + e.getMessage());
                    System.out.println("       Please make sure GOOGLE_API_KEY is set correctly.");
                    System.out.println();
                }
            }
        }
    }

    /**
     * Runs a demo scenario investigating fraud for user USR-10042 (John Martinez).
     */
    public void runDemo() {
        System.out.println("=".repeat(70));
        System.out.println("  DEMO: Investigating Fraud for USR-10042 (John Martinez)");
        System.out.println("  Aliases: J. Martinez, Johnny Martinez, Juan Martinez, John M.");
        System.out.println("=".repeat(70));
        System.out.println();

        List<String> demoQueries = List.of(
                "Look up user USR-10042 and show me their profile including all known aliases.",

                "Check the location history for USR-10042. Are there any unusual locations?",

                "Show all transactions for USR-10042 and analyze them for fraud patterns. "
                        + "Pay special attention to which name/alias was used on each transaction.",

                "Generate a full risk score and investigation summary for USR-10042. "
                        + "Should we block this account?"
        );

        for (int i = 0; i < demoQueries.size(); i++) {
            String query = demoQueries.get(i);
            System.out.println("-".repeat(70));
            System.out.printf("[Step %d/%d]%n", i + 1, demoQueries.size());
            System.out.println("Analyst> " + query);
            System.out.println();

            try {
                List<Event> events = chat(query);
                String response = extractResponse(events);
                System.out.println("Agent> " + response);
            } catch (Exception e) {
                System.out.println("Agent> Error: " + e.getMessage());
                System.out.println("       Ensure GOOGLE_API_KEY environment variable is set.");
            }
            System.out.println();
        }

        System.out.println("=".repeat(70));
        System.out.println("  Demo complete! Run in interactive mode to investigate other users.");
        System.out.println("=".repeat(70));
    }

    public static void main(String[] args) {
        String apiKey = System.getenv("GOOGLE_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("ERROR: GOOGLE_API_KEY environment variable is not set.");
            System.err.println();
            System.err.println("To use this application, set your Google API key:");
            System.err.println("  export GOOGLE_API_KEY=your-api-key-here");
            System.err.println();
            System.err.println("Get an API key at: https://aistudio.google.com/apikey");
            System.exit(1);
        }

        FraudDetectionApp app = new FraudDetectionApp();

        if (args.length > 0 && args[0].equals("--demo")) {
            app.runDemo();
        } else {
            app.runInteractive();
        }
    }
}
