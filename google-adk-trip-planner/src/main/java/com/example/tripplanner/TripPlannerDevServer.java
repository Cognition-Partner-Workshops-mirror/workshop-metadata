package com.example.tripplanner;

import com.example.tripplanner.agents.TripPlannerAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.web.AdkWebServer;

/**
 * Launches the Google ADK Dev UI web server for the Trip Planner Agent.
 *
 * <p>The Dev UI provides a browser-based interface for testing and debugging
 * the agent, similar to the Python ADK's dev UI experience.
 *
 * <p>Usage:
 * <pre>
 *   export GOOGLE_API_KEY=your-api-key-here
 *   mvn exec:java -Dexec.mainClass="com.example.tripplanner.TripPlannerDevServer"
 * </pre>
 *
 * <p>Then open http://localhost:8080 in your browser.
 */
public class TripPlannerDevServer {

    public static void main(String[] args) {
        String apiKey = System.getenv("GOOGLE_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("ERROR: GOOGLE_API_KEY environment variable is not set.");
            System.err.println("  export GOOGLE_API_KEY=your-api-key-here");
            System.err.println("Get an API key at: https://aistudio.google.com/apikey");
            System.exit(1);
        }

        LlmAgent rootAgent = TripPlannerAgent.createRootAgent();

        System.out.println("Starting Trip Planner Dev UI...");
        System.out.println("Open http://localhost:8080 in your browser");

        AdkWebServer.start(rootAgent);
    }
}
