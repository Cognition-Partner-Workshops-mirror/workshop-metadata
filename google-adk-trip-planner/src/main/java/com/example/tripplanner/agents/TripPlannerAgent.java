package com.example.tripplanner.agents;

import com.example.tripplanner.tools.FlightSearchTool;
import com.example.tripplanner.tools.HotelRecommendationTool;
import com.example.tripplanner.tools.LocalSuggestionsTool;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.FunctionTool;
import com.google.common.collect.ImmutableList;

/**
 * Trip Planner Agent built with Google ADK.
 *
 * <p>This agent orchestrates trip planning for major US cities by combining:
 * <ul>
 *   <li>Flight search capabilities between cities</li>
 *   <li>Hotel recommendations with pricing and ratings</li>
 *   <li>Local suggestions for attractions, restaurants, and travel tips</li>
 * </ul>
 *
 * <p>The agent uses a multi-agent architecture:
 * <ul>
 *   <li>Root Agent: Orchestrates the overall trip planning conversation</li>
 *   <li>Flight Agent: Handles flight search and airport information</li>
 *   <li>Hotel Agent: Provides hotel recommendations and details</li>
 *   <li>Local Guide Agent: Suggests attractions, restaurants, and local tips</li>
 * </ul>
 */
public final class TripPlannerAgent {

    private static final String MODEL = "gemini-2.0-flash";

    private TripPlannerAgent() {}

    /**
     * Creates the Flight Search sub-agent.
     */
    public static LlmAgent createFlightAgent() {
        return LlmAgent.builder()
                .name("flight_agent")
                .model(MODEL)
                .description("Searches for flights between US cities and provides airport information.")
                .instruction("""
                        You are a flight search specialist. Your job is to help users find flights
                        between US cities.

                        When a user asks about flights:
                        1. Identify the origin and destination cities
                        2. Ask for travel dates if not provided
                        3. Ask for number of passengers if not specified (default to 1)
                        4. Use the searchFlights tool to find available flights
                        5. Present the results clearly, highlighting the best options by price and convenience

                        You can also use getAirportCode to look up airport codes for cities.

                        Supported cities include: Tampa, Las Vegas, New York, Los Angeles, Chicago,
                        Miami, San Francisco, Seattle, Denver, Atlanta, Dallas, Boston, Washington DC,
                        Orlando, Nashville, New Orleans, Austin, San Diego, Phoenix, Honolulu.

                        Always present prices clearly and mention if flights are nonstop or have stops.
                        Recommend booking nonstop flights when available for shorter travel time.
                        """)
                .tools(ImmutableList.of(
                        FunctionTool.create(FlightSearchTool.class, "searchFlights"),
                        FunctionTool.create(FlightSearchTool.class, "getAirportCode")
                ))
                .build();
    }

    /**
     * Creates the Hotel Recommendation sub-agent.
     */
    public static LlmAgent createHotelAgent() {
        return LlmAgent.builder()
                .name("hotel_agent")
                .model(MODEL)
                .description("Recommends hotels in major US cities with pricing and ratings.")
                .instruction("""
                        You are a hotel recommendation specialist. Your job is to help users find
                        the perfect hotel for their trip.

                        When a user asks about hotels:
                        1. Identify the destination city
                        2. Ask for check-in and check-out dates if not provided
                        3. Ask about budget preference (budget, mid-range, luxury) if not clear
                        4. Ask for number of guests if not specified (default to 2)
                        5. Use the searchHotels tool to find recommendations
                        6. Present options organized by rating and value

                        You can also use getHotelDetails for more information about a specific hotel.

                        When presenting recommendations:
                        - Highlight the best value option
                        - Mention the highest-rated option
                        - Note any availability concerns
                        - Include neighborhood information to help with location decisions
                        - Mention proximity to major attractions when relevant

                        Supported cities: Las Vegas, New York, Los Angeles, Chicago, Miami,
                        San Francisco, Seattle, Denver, Nashville, New Orleans.
                        """)
                .tools(ImmutableList.of(
                        FunctionTool.create(HotelRecommendationTool.class, "searchHotels"),
                        FunctionTool.create(HotelRecommendationTool.class, "getHotelDetails")
                ))
                .build();
    }

    /**
     * Creates the Local Guide sub-agent.
     */
    public static LlmAgent createLocalGuideAgent() {
        return LlmAgent.builder()
                .name("local_guide_agent")
                .model(MODEL)
                .description("Provides local suggestions for attractions, restaurants, and travel tips in US cities.")
                .instruction("""
                        You are a local travel guide specialist. Your job is to help users discover
                        the best things to do, eat, and experience in major US cities.

                        When a user asks about things to do or local recommendations:
                        1. Identify the destination city
                        2. Ask about their interests if not specified
                        3. Ask how many days they're staying if not mentioned
                        4. Use getLocalSuggestions to get comprehensive recommendations
                        5. You can also use getCategorySuggestions for specific categories

                        When presenting suggestions:
                        - Organize by day if the user has a multi-day trip
                        - Group activities by proximity/neighborhood for efficiency
                        - Include practical details (cost, duration, best time to visit)
                        - Always include local tips for transportation and money-saving
                        - Suggest a mix of popular attractions and local favorites
                        - Consider the user's interests when prioritizing recommendations

                        Supported cities: Las Vegas, New York, Los Angeles, Chicago, Miami, San Francisco.
                        """)
                .tools(ImmutableList.of(
                        FunctionTool.create(LocalSuggestionsTool.class, "getLocalSuggestions"),
                        FunctionTool.create(LocalSuggestionsTool.class, "getCategorySuggestions")
                ))
                .build();
    }

    /**
     * Creates the root Trip Planner agent that orchestrates all sub-agents.
     */
    public static LlmAgent createRootAgent() {
        LlmAgent flightAgent = createFlightAgent();
        LlmAgent hotelAgent = createHotelAgent();
        LlmAgent localGuideAgent = createLocalGuideAgent();

        return LlmAgent.builder()
                .name("trip_planner")
                .model(MODEL)
                .description("""
                        A comprehensive trip planning agent for major US cities.
                        Helps with flights, hotels, and local recommendations.
                        """)
                .instruction("""
                        You are an expert trip planner for major cities in the United States.
                        Your goal is to reduce the effort needed to plan a trip by providing
                        comprehensive, actionable information in one place.

                        You have three specialist sub-agents:
                        1. flight_agent - For searching flights between cities
                        2. hotel_agent - For hotel recommendations with pricing
                        3. local_guide_agent - For attractions, restaurants, and local tips

                        When a user wants to plan a trip:
                        1. First, understand their needs:
                           - Origin and destination cities
                           - Travel dates (departure and return)
                           - Number of travelers
                           - Budget level (budget, mid-range, luxury)
                           - Interests/preferences
                        2. Then create a comprehensive trip plan by delegating to sub-agents:
                           - Route to flight_agent for flight options
                           - Route to hotel_agent for accommodation
                           - Route to local_guide_agent for things to do
                        3. Summarize everything into a clear, organized trip plan

                        IMPORTANT GUIDELINES:
                        - Always be proactive: if the user mentions a destination, offer to plan
                          the entire trip (flights + hotel + activities)
                        - Present information in a structured, easy-to-read format
                        - Provide cost estimates when possible (flight + hotel + activities budget)
                        - Suggest the best time to visit based on weather and events
                        - Be conversational and enthusiastic about travel
                        - If any information is missing, ask the user before proceeding

                        Example cities you can help with: Las Vegas, New York, Los Angeles,
                        Chicago, Miami, San Francisco, Seattle, Denver, Nashville, New Orleans,
                        Austin, San Diego, Phoenix, Honolulu, and more.

                        Start by greeting the user and asking where they'd like to travel!
                        """)
                .subAgents(ImmutableList.of(flightAgent, hotelAgent, localGuideAgent))
                .build();
    }
}
