package com.example.frauddetection;

import com.example.frauddetection.agents.FraudDetectionAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.web.AdkWebServer;

/**
 * Launches the Google ADK Dev UI web server for the Fraud Detection Agent.
 *
 * <p>The Dev UI provides a browser-based interface for testing and debugging
 * the agent, similar to the Python ADK's dev UI experience.
 *
 * <p>Usage:
 * <pre>
 *   export GOOGLE_API_KEY=your-api-key-here
 *   mvn exec:java -Dexec.mainClass="com.example.frauddetection.FraudDetectionDevServer"
 * </pre>
 *
 * <p>Then open http://localhost:8080 in your browser.
 */
public class FraudDetectionDevServer {

    public static void main(String[] args) {
        String apiKey = System.getenv("GOOGLE_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("ERROR: GOOGLE_API_KEY environment variable is not set.");
            System.err.println("  export GOOGLE_API_KEY=your-api-key-here");
            System.err.println("Get an API key at: https://aistudio.google.com/apikey");
            System.exit(1);
        }

        LlmAgent rootAgent = FraudDetectionAgent.createRootAgent();

        System.out.println("Starting Fraud Detection Agent Dev UI...");
        System.out.println("Open http://localhost:8080 in your browser");

        AdkWebServer.start(rootAgent);
    }
}
