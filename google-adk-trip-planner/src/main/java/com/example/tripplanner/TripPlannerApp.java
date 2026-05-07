package com.example.tripplanner;

import com.example.tripplanner.agents.TripPlannerAgent;
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
 * Main application entry point for the Trip Planner Agent.
 *
 * <p>This application demonstrates a Google ADK-based trip planning agent that helps
 * users plan trips to major US cities. It provides an interactive console interface
 * where users can ask about flights, hotels, and local suggestions.
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
 *   You> Plan a trip from Tampa to Las Vegas for next weekend
 *   Agent> [Provides flights, hotels, and activity recommendations]
 * </pre>
 */
public class TripPlannerApp {

    private static final Logger LOG = LoggerFactory.getLogger(TripPlannerApp.class);
    private static final String APP_NAME = "TripPlannerApp";

    private final Runner runner;
    private final String userId;
    private final String sessionId;

    public TripPlannerApp() {
        this.userId = "user_" + UUID.randomUUID().toString().substring(0, 8);
        this.sessionId = UUID.randomUUID().toString();

        LlmAgent rootAgent = TripPlannerAgent.createRootAgent();

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

        LOG.info("Trip Planner Agent initialized. Session: {}", sessionId);
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

    /**
     * Extracts and formats the agent's text response from events.
     */
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
        System.out.println("  TRIP PLANNER AGENT - Powered by Google ADK");
        System.out.println("  Plan trips to major US cities with AI assistance");
        System.out.println("=".repeat(70));
        System.out.println();
        System.out.println("  I can help you with:");
        System.out.println("  - Flight searches between US cities");
        System.out.println("  - Hotel recommendations with pricing");
        System.out.println("  - Local attractions, restaurants, and tips");
        System.out.println();
        System.out.println("  Type 'quit' or 'exit' to end the session.");
        System.out.println("  Type 'example' to see a sample query.");
        System.out.println("=".repeat(70));
        System.out.println();

        try (Scanner scanner = new Scanner(System.in)) {
            while (true) {
                System.out.print("You> ");
                if (!scanner.hasNextLine()) {
                    break;
                }
                String input = scanner.nextLine().trim();

                if (input.isEmpty()) {
                    continue;
                }

                if (input.equalsIgnoreCase("quit") || input.equalsIgnoreCase("exit")) {
                    System.out.println("\nThank you for using Trip Planner! Have a great trip!");
                    break;
                }

                if (input.equalsIgnoreCase("example")) {
                    System.out.println("\nExample queries you can try:");
                    System.out.println("  - \"Plan a trip from Tampa to Las Vegas for 3 days\"");
                    System.out.println("  - \"Find flights from Tampa to Las Vegas on 2025-03-15\"");
                    System.out.println("  - \"Recommend hotels in Las Vegas for a luxury stay\"");
                    System.out.println("  - \"What are the best things to do in Las Vegas?\"");
                    System.out.println("  - \"I want to visit New York next month, help me plan\"");
                    System.out.println();
                    continue;
                }

                try {
                    System.out.println("\nAgent> Thinking...\n");
                    List<Event> events = chat(input);
                    String response = extractResponse(events);
                    if (!response.isEmpty()) {
                        System.out.println("Agent> " + response);
                    } else {
                        System.out.println("Agent> I'm processing your request. Could you provide more details?");
                    }
                    System.out.println();
                } catch (Exception e) {
                    LOG.error("Error processing request", e);
                    System.out.println("Agent> Sorry, I encountered an error: " + e.getMessage());
                    System.out.println("       Please make sure GOOGLE_API_KEY is set correctly.");
                    System.out.println();
                }
            }
        }
    }

    /**
     * Runs a demo scenario: Planning a trip from Tampa to Las Vegas.
     */
    public void runDemo() {
        System.out.println("=".repeat(70));
        System.out.println("  DEMO: Planning a trip from Tampa, FL to Las Vegas, NV");
        System.out.println("=".repeat(70));
        System.out.println();

        List<String> demoQueries = List.of(
                "I want to plan a 4-day trip from Tampa, Florida to Las Vegas. "
                        + "I'll be traveling with my partner, departing on March 15, 2025 "
                        + "and returning on March 19, 2025. We have a mid-range budget "
                        + "and enjoy entertainment, good food, and nature.",

                "Can you find us flights from Tampa to Las Vegas for those dates?",

                "What hotels do you recommend on the Las Vegas Strip for 4 nights?",

                "What are the must-see attractions and best restaurants in Las Vegas? "
                        + "We'll be there for 4 days."
        );

        for (int i = 0; i < demoQueries.size(); i++) {
            String query = demoQueries.get(i);
            System.out.println("-".repeat(70));
            System.out.printf("[Query %d/%d]%n", i + 1, demoQueries.size());
            System.out.println("You> " + query);
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
        System.out.println("  Demo complete! Run in interactive mode to plan your own trip.");
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

        TripPlannerApp app = new TripPlannerApp();

        if (args.length > 0 && args[0].equals("--demo")) {
            app.runDemo();
        } else {
            app.runInteractive();
        }
    }
}
