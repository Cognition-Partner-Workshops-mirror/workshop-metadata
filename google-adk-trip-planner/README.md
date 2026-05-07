# Google ADK Trip Planner Agent

A comprehensive trip planning AI agent built with [Google Agent Development Kit (ADK)](https://github.com/google/adk-java) for Java 21. This agent helps users plan trips to major US cities by providing flight information, hotel recommendations, and local suggestions for places to visit.

## Overview

The Trip Planner Agent reduces the effort of searching for each component needed to plan a trip. Instead of visiting multiple websites for flights, hotels, and activities, this agent provides everything in one conversational interface.

### Features

- **Flight Search**: Find flights between 20+ major US cities with pricing, duration, and stop information
- **Hotel Recommendations**: Get curated hotel suggestions with ratings, pricing, and neighborhood details
- **Local Suggestions**: Discover attractions, restaurants, and practical travel tips for each city
- **Multi-Agent Architecture**: Specialized sub-agents handle each domain for focused, accurate responses
- **Interactive Console**: Chat with the agent in your terminal
- **Dev UI**: Browser-based testing interface powered by Google ADK

### Supported Cities

Las Vegas, New York, Los Angeles, Chicago, Miami, San Francisco, Seattle, Denver, Nashville, New Orleans, Tampa, Atlanta, Dallas, Boston, Washington DC, Orlando, Austin, San Diego, Phoenix, Honolulu

## Prerequisites

- **Java 21** (required)
- **Maven 3.8+**
- **Google API Key** with Gemini API access

## Setup

### 1. Get a Google API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create or select a project
3. Generate an API key
4. Enable the Gemini API if not already enabled

### 2. Set Environment Variable

```bash
export GOOGLE_API_KEY=your-api-key-here
```

### 3. Build the Project

```bash
cd google-adk-trip-planner
mvn clean compile
```

## Running the Agent

### Interactive Console Mode

Chat with the agent in your terminal:

```bash
mvn exec:java
```

Example queries:
- "Plan a trip from Tampa to Las Vegas for 3 days"
- "Find flights from Tampa to Las Vegas on 2025-03-15"
- "Recommend hotels in Las Vegas for a luxury stay"
- "What are the best things to do in Las Vegas?"

### Demo Mode

Run a pre-configured demo showing a complete trip plan from Tampa to Las Vegas:

```bash
mvn exec:java -Dexec.args="--demo"
```

### Dev UI Mode

Launch the browser-based ADK Dev UI for testing and debugging:

```bash
mvn exec:java -Dexec.mainClass="com.example.tripplanner.TripPlannerDevServer"
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ROOT AGENT (trip_planner)                 │
│                                                             │
│  Orchestrates trip planning by delegating to sub-agents     │
│  Model: gemini-2.0-flash                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  flight_agent   │  │ hotel_agent  │  │ local_guide   │  │
│  │                 │  │              │  │    _agent      │  │
│  │ • searchFlights │  │ • searchHotels│ │ • getLocal    │  │
│  │ • getAirportCode│  │ • getHotel   │  │   Suggestions │  │
│  │                 │  │   Details    │  │ • getCategory │  │
│  │                 │  │              │  │   Suggestions │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
google-adk-trip-planner/
├── pom.xml                                    # Maven configuration (Java 21, ADK 1.2.0)
├── README.md                                  # This file
└── src/main/java/com/example/tripplanner/
    ├── TripPlannerApp.java                    # Main app with interactive & demo modes
    ├── TripPlannerDevServer.java              # ADK Dev UI web server
    ├── agents/
    │   └── TripPlannerAgent.java             # Agent definitions & orchestration
    └── tools/
        ├── FlightSearchTool.java             # Flight search capabilities
        ├── HotelRecommendationTool.java      # Hotel recommendations
        └── LocalSuggestionsTool.java         # Attractions, restaurants, tips
```

## Example: Tampa to Las Vegas Trip

```
You> Plan a trip from Tampa, Florida to Las Vegas for 4 days next month.
     We're a couple with a mid-range budget who love entertainment and food.

Agent> Here's your complete trip plan:

✈️ FLIGHTS (Tampa TPA → Las Vegas LAS)
  • Delta DL2847 - Nonstop, 4h 30m - $289/person
  • United UA1523 - 1 stop, 6h 15m - $219/person
  ...

🏨 HOTELS (4 nights)
  • The Venetian Resort ⭐4.6 - $200-$450/night (The Strip)
  • Caesars Palace ⭐4.5 - $180-$400/night (The Strip)
  ...

🎯 THINGS TO DO
  Day 1: Walk the Strip, Bellagio Fountains, evening Cirque du Soleil
  Day 2: Pool morning, Fremont Street Experience evening
  Day 3: Red Rock Canyon day trip, fine dining
  Day 4: Shopping at Forum Shops, High Roller at sunset
  ...

🍽️ RESTAURANTS
  • Hell's Kitchen (Gordon Ramsay) - $$$
  • Mon Ami Gabi (fountain views) - $$$
  • Bacchanal Buffet (500+ items) - $$
  ...

💡 TIPS
  • Use the Monorail for Strip transportation
  • Book show tickets at Tix4Tonight for discounts
  • Best weather: March-May (your trip timing is perfect!)
```

## Extending the Agent

### Adding a New City

Add city data to the relevant tool classes:

1. **FlightSearchTool.java**: Add airport code to `AIRPORT_CODES` map
2. **HotelRecommendationTool.java**: Add hotels to `CITY_HOTELS` map
3. **LocalSuggestionsTool.java**: Add suggestions to `CITY_SUGGESTIONS` map

### Integrating Real APIs

The tool classes are designed to be swapped with real API integrations:

- **Flights**: [Amadeus API](https://developers.amadeus.com/), [Google Flights](https://developers.google.com/travel)
- **Hotels**: [Booking.com API](https://developers.booking.com/), [Hotels.com](https://developer.expediagroup.com/)
- **Local**: [Google Places API](https://developers.google.com/maps/documentation/places), [Yelp Fusion](https://docs.developer.yelp.com/)

### Adding New Tools

Create a new tool class in `com.example.tripplanner.tools`, then register it with the appropriate agent in `TripPlannerAgent.java`.

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | Java 21 |
| AI Framework | Google ADK 1.2.0 |
| LLM | Gemini 2.0 Flash |
| Build Tool | Maven |
| Reactive | RxJava 3 |
| Logging | Logback + SLF4J |

## License

This project is part of the Cognition Partner Workshops collection.
