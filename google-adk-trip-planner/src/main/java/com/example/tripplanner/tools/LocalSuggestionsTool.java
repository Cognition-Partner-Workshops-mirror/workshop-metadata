package com.example.tripplanner.tools;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;

import java.util.List;
import java.util.Map;

/**
 * Tool that provides local suggestions for places to visit, restaurants, and activities
 * in major US cities. In production, this would integrate with Google Places API,
 * Yelp, TripAdvisor, etc.
 */
public final class LocalSuggestionsTool {

    private static final Map<String, Map<String, List<Map<String, Object>>>> CITY_SUGGESTIONS = Map.ofEntries(
            Map.entry("Las Vegas", Map.of(
                    "attractions", List.of(
                            Map.<String, Object>of(
                                    "name", "The Strip (Las Vegas Boulevard)",
                                    "category", "Landmark",
                                    "description", "The iconic 4.2-mile stretch of world-famous casinos, hotels, and entertainment venues",
                                    "bestTime", "Evening for lights, morning for photos",
                                    "duration", "3-5 hours",
                                    "cost", "Free to walk"
                            ),
                            Map.<String, Object>of(
                                    "name", "Fremont Street Experience",
                                    "category", "Entertainment",
                                    "description", "Downtown's pedestrian mall with the world's largest video screen canopy and zip line",
                                    "bestTime", "After dark",
                                    "duration", "2-3 hours",
                                    "cost", "Free (zip line extra)"
                            ),
                            Map.<String, Object>of(
                                    "name", "Red Rock Canyon",
                                    "category", "Nature",
                                    "description", "Stunning desert landscape with a 13-mile scenic drive, hiking trails, and rock climbing",
                                    "bestTime", "Early morning",
                                    "duration", "Half day",
                                    "cost", "$15 per vehicle"
                            ),
                            Map.<String, Object>of(
                                    "name", "High Roller Observation Wheel",
                                    "category", "Attraction",
                                    "description", "The world's tallest observation wheel at 550 feet with panoramic city views",
                                    "bestTime", "Sunset or night",
                                    "duration", "30 minutes",
                                    "cost", "$25-$37"
                            ),
                            Map.<String, Object>of(
                                    "name", "Hoover Dam",
                                    "category", "Landmark/Day Trip",
                                    "description", "Engineering marvel and National Historic Landmark, 30 minutes from the Strip",
                                    "bestTime", "Morning",
                                    "duration", "Half day",
                                    "cost", "$30 for guided tour"
                            ),
                            Map.<String, Object>of(
                                    "name", "Cirque du Soleil Shows",
                                    "category", "Entertainment",
                                    "description", "Multiple world-class shows including 'O', 'KA', and 'Mystere'",
                                    "bestTime", "Evening",
                                    "duration", "90 minutes",
                                    "cost", "$70-$200"
                            )
                    ),
                    "restaurants", List.of(
                            Map.<String, Object>of(
                                    "name", "Joel Robuchon",
                                    "cuisine", "French Fine Dining",
                                    "priceRange", "$$$$",
                                    "location", "MGM Grand",
                                    "highlight", "Only 3-Michelin-star restaurant in Las Vegas"
                            ),
                            Map.<String, Object>of(
                                    "name", "Hell's Kitchen",
                                    "cuisine", "American/Contemporary",
                                    "priceRange", "$$$",
                                    "location", "Caesars Palace",
                                    "highlight", "Gordon Ramsay's signature restaurant with fiery ambiance"
                            ),
                            Map.<String, Object>of(
                                    "name", "Bacchanal Buffet",
                                    "cuisine", "International Buffet",
                                    "priceRange", "$$",
                                    "location", "Caesars Palace",
                                    "highlight", "500+ items, considered the best buffet in Vegas"
                            ),
                            Map.<String, Object>of(
                                    "name", "In-N-Out Burger",
                                    "cuisine", "Fast Food/Burgers",
                                    "priceRange", "$",
                                    "location", "Multiple locations on the Strip",
                                    "highlight", "West Coast classic, perfect late-night option"
                            ),
                            Map.<String, Object>of(
                                    "name", "Mon Ami Gabi",
                                    "cuisine", "French Bistro",
                                    "priceRange", "$$$",
                                    "location", "Paris Las Vegas",
                                    "highlight", "Outdoor patio with Bellagio fountain views"
                            )
                    ),
                    "tips", List.of(
                            Map.<String, Object>of(
                                    "category", "Transportation",
                                    "tip", "Use the Las Vegas Monorail or the Deuce bus for Strip transportation. Rideshares are convenient but surge pricing is common at night."
                            ),
                            Map.<String, Object>of(
                                    "category", "Weather",
                                    "tip", "Vegas is in the desert - summers are extremely hot (110°F+). Best months to visit are March-May and September-November."
                            ),
                            Map.<String, Object>of(
                                    "category", "Savings",
                                    "tip", "Look for show tickets at Tix4Tonight booths for same-day discounts up to 50% off."
                            ),
                            Map.<String, Object>of(
                                    "category", "Dining",
                                    "tip", "Many high-end restaurants offer prix fixe lunch menus at a fraction of dinner prices."
                            )
                    )
            )),
            Map.entry("New York", Map.of(
                    "attractions", List.of(
                            Map.<String, Object>of(
                                    "name", "Central Park",
                                    "category", "Park/Nature",
                                    "description", "843-acre urban park with lakes, gardens, and iconic bridges",
                                    "bestTime", "Morning or late afternoon",
                                    "duration", "2-4 hours",
                                    "cost", "Free"
                            ),
                            Map.<String, Object>of(
                                    "name", "Statue of Liberty & Ellis Island",
                                    "category", "Landmark",
                                    "description", "America's most iconic monument with immigration museum",
                                    "bestTime", "Morning (book in advance)",
                                    "duration", "Half day",
                                    "cost", "$24 ferry + pedestal access"
                            ),
                            Map.<String, Object>of(
                                    "name", "Times Square & Broadway",
                                    "category", "Entertainment",
                                    "description", "The crossroads of the world plus world-class theater",
                                    "bestTime", "Evening",
                                    "duration", "3-4 hours",
                                    "cost", "Broadway shows $80-$300"
                            ),
                            Map.<String, Object>of(
                                    "name", "The Metropolitan Museum of Art",
                                    "category", "Museum",
                                    "description", "One of the world's largest art museums with 2 million works",
                                    "bestTime", "Weekday morning",
                                    "duration", "3-5 hours",
                                    "cost", "$30 suggested donation"
                            )
                    ),
                    "restaurants", List.of(
                            Map.<String, Object>of(
                                    "name", "Peter Luger Steak House",
                                    "cuisine", "Steakhouse",
                                    "priceRange", "$$$$",
                                    "location", "Brooklyn",
                                    "highlight", "Legendary since 1887, cash only"
                            ),
                            Map.<String, Object>of(
                                    "name", "Joe's Pizza",
                                    "cuisine", "Pizza",
                                    "priceRange", "$",
                                    "location", "Greenwich Village",
                                    "highlight", "NYC's most iconic pizza slice"
                            )
                    ),
                    "tips", List.of(
                            Map.<String, Object>of(
                                    "category", "Transportation",
                                    "tip", "Get a MetroCard for unlimited subway rides. Walking is best in Manhattan."
                            ),
                            Map.<String, Object>of(
                                    "category", "Savings",
                                    "tip", "NYC CityPASS saves 40% on top attractions. TKTS booth for same-day Broadway discounts."
                            )
                    )
            )),
            Map.entry("Los Angeles", Map.of(
                    "attractions", List.of(
                            Map.<String, Object>of(
                                    "name", "Hollywood Sign & Walk of Fame",
                                    "category", "Landmark",
                                    "description", "Iconic sign hike and star-studded sidewalks",
                                    "bestTime", "Morning for hiking",
                                    "duration", "2-3 hours",
                                    "cost", "Free"
                            ),
                            Map.<String, Object>of(
                                    "name", "Santa Monica Pier & Beach",
                                    "category", "Beach/Entertainment",
                                    "description", "Historic pier with amusement park and ocean views",
                                    "bestTime", "Afternoon/Sunset",
                                    "duration", "2-4 hours",
                                    "cost", "Free (rides extra)"
                            ),
                            Map.<String, Object>of(
                                    "name", "The Getty Center",
                                    "category", "Museum",
                                    "description", "World-class art museum with stunning architecture and gardens",
                                    "bestTime", "Morning",
                                    "duration", "3-4 hours",
                                    "cost", "Free (parking $20)"
                            )
                    ),
                    "restaurants", List.of(
                            Map.<String, Object>of(
                                    "name", "Bestia",
                                    "cuisine", "Italian",
                                    "priceRange", "$$$",
                                    "location", "Arts District",
                                    "highlight", "Award-winning Italian in a converted warehouse"
                            )
                    ),
                    "tips", List.of(
                            Map.<String, Object>of(
                                    "category", "Transportation",
                                    "tip", "A car is almost essential in LA. Expect traffic. Plan activities by neighborhood to minimize driving."
                            )
                    )
            )),
            Map.entry("Chicago", Map.of(
                    "attractions", List.of(
                            Map.<String, Object>of(
                                    "name", "Millennium Park & Cloud Gate",
                                    "category", "Park/Art",
                                    "description", "Iconic 'Bean' sculpture and beautiful park in the city center",
                                    "bestTime", "Morning",
                                    "duration", "1-2 hours",
                                    "cost", "Free"
                            ),
                            Map.<String, Object>of(
                                    "name", "Art Institute of Chicago",
                                    "category", "Museum",
                                    "description", "World-renowned art museum with impressionist masterpieces",
                                    "bestTime", "Weekday",
                                    "duration", "3-4 hours",
                                    "cost", "$32"
                            )
                    ),
                    "restaurants", List.of(
                            Map.<String, Object>of(
                                    "name", "Lou Malnati's",
                                    "cuisine", "Deep Dish Pizza",
                                    "priceRange", "$$",
                                    "location", "Multiple locations",
                                    "highlight", "Chicago's famous deep dish pizza since 1971"
                            )
                    ),
                    "tips", List.of(
                            Map.<String, Object>of(
                                    "category", "Transportation",
                                    "tip", "The 'L' train is efficient and cheap. Water taxis are scenic in summer."
                            )
                    )
            )),
            Map.entry("Miami", Map.of(
                    "attractions", List.of(
                            Map.<String, Object>of(
                                    "name", "South Beach",
                                    "category", "Beach",
                                    "description", "Iconic Art Deco district with turquoise waters and vibrant nightlife",
                                    "bestTime", "Morning for beach, evening for nightlife",
                                    "duration", "Half to full day",
                                    "cost", "Free"
                            ),
                            Map.<String, Object>of(
                                    "name", "Wynwood Walls",
                                    "category", "Art",
                                    "description", "World-famous outdoor street art museum",
                                    "bestTime", "Afternoon",
                                    "duration", "2-3 hours",
                                    "cost", "$12"
                            )
                    ),
                    "restaurants", List.of(
                            Map.<String, Object>of(
                                    "name", "Joe's Stone Crab",
                                    "cuisine", "Seafood",
                                    "priceRange", "$$$$",
                                    "location", "South Beach",
                                    "highlight", "Miami institution since 1913, famous stone crab claws"
                            )
                    ),
                    "tips", List.of(
                            Map.<String, Object>of(
                                    "category", "Weather",
                                    "tip", "Hurricane season is June-November. Best weather is December-April."
                            )
                    )
            )),
            Map.entry("San Francisco", Map.of(
                    "attractions", List.of(
                            Map.<String, Object>of(
                                    "name", "Golden Gate Bridge",
                                    "category", "Landmark",
                                    "description", "Iconic suspension bridge with walking/biking paths",
                                    "bestTime", "Morning (less fog)",
                                    "duration", "1-2 hours",
                                    "cost", "Free to walk/bike"
                            ),
                            Map.<String, Object>of(
                                    "name", "Alcatraz Island",
                                    "category", "Historic Site",
                                    "description", "Former federal prison with audio-guided tours",
                                    "bestTime", "Book 2+ weeks in advance",
                                    "duration", "3-4 hours",
                                    "cost", "$41"
                            )
                    ),
                    "restaurants", List.of(
                            Map.<String, Object>of(
                                    "name", "Tartine Bakery",
                                    "cuisine", "Bakery/Cafe",
                                    "priceRange", "$$",
                                    "location", "Mission District",
                                    "highlight", "Award-winning bread and pastries, expect a line"
                            )
                    ),
                    "tips", List.of(
                            Map.<String, Object>of(
                                    "category", "Weather",
                                    "tip", "Bring layers! Fog rolls in unexpectedly. Mark Twain's quote: 'The coldest winter I ever spent was a summer in San Francisco.'"
                            )
                    )
            ))
    );

    private LocalSuggestionsTool() {}

    /**
     * Gets local suggestions for a city including attractions, restaurants, and tips.
     *
     * @param city the destination city
     * @param interests comma-separated list of interests (e.g., "food, nature, nightlife, culture, shopping")
     * @param daysStaying number of days staying in the city
     * @return a map containing local suggestions
     */
    public static ImmutableMap<String, Object> getLocalSuggestions(
            String city,
            String interests,
            int daysStaying) {

        Map<String, List<Map<String, Object>>> suggestions = CITY_SUGGESTIONS.get(city);

        if (suggestions == null) {
            return ImmutableMap.of(
                    "status", "error",
                    "message", "No suggestions data available for " + city + ". Supported cities: "
                            + String.join(", ", CITY_SUGGESTIONS.keySet())
            );
        }

        ImmutableMap.Builder<String, Object> result = ImmutableMap.<String, Object>builder()
                .put("status", "success")
                .put("city", city)
                .put("daysStaying", daysStaying)
                .put("interests", interests)
                .put("attractions", suggestions.getOrDefault("attractions", List.of()))
                .put("restaurants", suggestions.getOrDefault("restaurants", List.of()))
                .put("localTips", suggestions.getOrDefault("tips", List.of()));

        String itinerarySuggestion = generateItinerarySuggestion(city, daysStaying);
        result.put("suggestedItinerary", itinerarySuggestion);

        return result.build();
    }

    /**
     * Gets specific category suggestions for a city.
     *
     * @param city the destination city
     * @param category one of: "attractions", "restaurants", "tips"
     * @return a map containing category-specific suggestions
     */
    public static ImmutableMap<String, Object> getCategorySuggestions(String city, String category) {
        Map<String, List<Map<String, Object>>> suggestions = CITY_SUGGESTIONS.get(city);

        if (suggestions == null) {
            return ImmutableMap.of(
                    "status", "error",
                    "message", "No data for " + city
            );
        }

        List<Map<String, Object>> categoryData = suggestions.get(category);
        if (categoryData == null) {
            return ImmutableMap.of(
                    "status", "error",
                    "message", "Unknown category: " + category + ". Use: attractions, restaurants, tips"
            );
        }

        return ImmutableMap.of(
                "status", "success",
                "city", city,
                "category", category,
                "results", categoryData
        );
    }

    private static String generateItinerarySuggestion(String city, int days) {
        return switch (city) {
            case "Las Vegas" -> switch (days) {
                case 1 -> "Day 1: Walk the Strip, see Bellagio Fountains, catch an evening show";
                case 2 -> "Day 1: The Strip (south to north), evening show. Day 2: Fremont Street, pool day, fine dining";
                default -> "Day 1: The Strip exploration + show. Day 2: Pool morning, Fremont Street evening. Day 3+: Red Rock Canyon, Hoover Dam day trip, shopping at Forum Shops";
            };
            case "New York" -> switch (days) {
                case 1 -> "Day 1: Central Park, Times Square, Broadway show";
                case 2 -> "Day 1: Midtown (Central Park, MET, Times Square). Day 2: Downtown (Statue of Liberty, Wall Street, Brooklyn Bridge)";
                default -> "Day 1: Midtown Manhattan. Day 2: Downtown + Brooklyn. Day 3+: Museums, neighborhoods (Greenwich Village, SoHo), day trips";
            };
            default -> String.format("Spend %d days exploring %s's top attractions, trying local cuisine, and experiencing the city's unique culture", days, city);
        };
    }
}
