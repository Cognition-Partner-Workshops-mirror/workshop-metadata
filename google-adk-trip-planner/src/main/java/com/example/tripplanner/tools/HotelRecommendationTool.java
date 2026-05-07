package com.example.tripplanner.tools;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;

import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Tool that provides hotel recommendations for major US cities.
 * In production, this would integrate with hotel booking APIs (Booking.com, Expedia, etc.).
 * Currently returns curated data for demonstration purposes.
 */
public final class HotelRecommendationTool {

    private static final Random RANDOM = new Random();

    private static final Map<String, List<Map<String, Object>>> CITY_HOTELS = Map.ofEntries(
            Map.entry("Las Vegas", List.of(
                    Map.<String, Object>of(
                            "name", "Bellagio Hotel & Casino",
                            "rating", 4.7,
                            "pricePerNight", "$250-$500",
                            "neighborhood", "The Strip",
                            "highlights", "Iconic fountains, luxury spa, fine dining, central Strip location"
                    ),
                    Map.<String, Object>of(
                            "name", "The Venetian Resort",
                            "rating", 4.6,
                            "pricePerNight", "$200-$450",
                            "neighborhood", "The Strip",
                            "highlights", "Suite-style rooms, Grand Canal Shoppes, multiple pools"
                    ),
                    Map.<String, Object>of(
                            "name", "Wynn Las Vegas",
                            "rating", 4.8,
                            "pricePerNight", "$300-$600",
                            "neighborhood", "The Strip",
                            "highlights", "Award-winning resort, golf course, upscale dining"
                    ),
                    Map.<String, Object>of(
                            "name", "Caesars Palace",
                            "rating", 4.5,
                            "pricePerNight", "$180-$400",
                            "neighborhood", "The Strip",
                            "highlights", "Roman-themed, Garden of the Gods pool, The Forum Shops"
                    ),
                    Map.<String, Object>of(
                            "name", "Circa Resort & Casino",
                            "rating", 4.6,
                            "pricePerNight", "$150-$350",
                            "neighborhood", "Downtown/Fremont Street",
                            "highlights", "Adults-only, Stadium Swim pool, vintage Vegas vibe"
                    )
            )),
            Map.entry("New York", List.of(
                    Map.<String, Object>of(
                            "name", "The Plaza Hotel",
                            "rating", 4.7,
                            "pricePerNight", "$400-$800",
                            "neighborhood", "Midtown Manhattan",
                            "highlights", "Historic landmark, Central Park views, luxury amenities"
                    ),
                    Map.<String, Object>of(
                            "name", "Park Hyatt New York",
                            "rating", 4.8,
                            "pricePerNight", "$500-$900",
                            "neighborhood", "Midtown West",
                            "highlights", "Carnegie Hall views, spa, contemporary art collection"
                    ),
                    Map.<String, Object>of(
                            "name", "The Standard High Line",
                            "rating", 4.4,
                            "pricePerNight", "$250-$500",
                            "neighborhood", "Meatpacking District",
                            "highlights", "Trendy, rooftop bar, High Line park access"
                    )
            )),
            Map.entry("Los Angeles", List.of(
                    Map.<String, Object>of(
                            "name", "The Beverly Hills Hotel",
                            "rating", 4.7,
                            "pricePerNight", "$500-$1000",
                            "neighborhood", "Beverly Hills",
                            "highlights", "Pink Palace, celebrity history, lush gardens"
                    ),
                    Map.<String, Object>of(
                            "name", "Santa Monica Proper Hotel",
                            "rating", 4.5,
                            "pricePerNight", "$300-$600",
                            "neighborhood", "Santa Monica",
                            "highlights", "Beach proximity, rooftop pool, design-forward"
                    ),
                    Map.<String, Object>of(
                            "name", "The LINE LA",
                            "rating", 4.3,
                            "pricePerNight", "$200-$400",
                            "neighborhood", "Koreatown",
                            "highlights", "Hip vibe, great restaurants, cultural hub"
                    )
            )),
            Map.entry("Chicago", List.of(
                    Map.<String, Object>of(
                            "name", "The Langham Chicago",
                            "rating", 4.8,
                            "pricePerNight", "$350-$700",
                            "neighborhood", "River North",
                            "highlights", "River views, indoor pool, Chuan Spa"
                    ),
                    Map.<String, Object>of(
                            "name", "The Hoxton Chicago",
                            "rating", 4.5,
                            "pricePerNight", "$200-$400",
                            "neighborhood", "Fulton Market",
                            "highlights", "Trendy, rooftop bar, restaurant scene"
                    )
            )),
            Map.entry("Miami", List.of(
                    Map.<String, Object>of(
                            "name", "Faena Miami Beach",
                            "rating", 4.7,
                            "pricePerNight", "$400-$800",
                            "neighborhood", "Mid-Beach",
                            "highlights", "Art-filled, beachfront, world-class dining"
                    ),
                    Map.<String, Object>of(
                            "name", "The Setai Miami Beach",
                            "rating", 4.8,
                            "pricePerNight", "$500-$1000",
                            "neighborhood", "South Beach",
                            "highlights", "Asian-inspired luxury, three infinity pools"
                    )
            )),
            Map.entry("San Francisco", List.of(
                    Map.<String, Object>of(
                            "name", "The Ritz-Carlton San Francisco",
                            "rating", 4.6,
                            "pricePerNight", "$350-$700",
                            "neighborhood", "Nob Hill",
                            "highlights", "Historic elegance, city views, central location"
                    ),
                    Map.<String, Object>of(
                            "name", "Hotel Vitale",
                            "rating", 4.4,
                            "pricePerNight", "$250-$500",
                            "neighborhood", "Embarcadero",
                            "highlights", "Waterfront, rooftop spa, ferry building proximity"
                    )
            )),
            Map.entry("Seattle", List.of(
                    Map.<String, Object>of(
                            "name", "Four Seasons Hotel Seattle",
                            "rating", 4.7,
                            "pricePerNight", "$350-$700",
                            "neighborhood", "Downtown",
                            "highlights", "Waterfront views, infinity pool, Pike Place proximity"
                    )
            )),
            Map.entry("Denver", List.of(
                    Map.<String, Object>of(
                            "name", "The Crawford Hotel",
                            "rating", 4.6,
                            "pricePerNight", "$250-$500",
                            "neighborhood", "Union Station",
                            "highlights", "Historic train station, unique rooms, central location"
                    )
            )),
            Map.entry("Nashville", List.of(
                    Map.<String, Object>of(
                            "name", "The Hermitage Hotel",
                            "rating", 4.7,
                            "pricePerNight", "$300-$600",
                            "neighborhood", "Downtown",
                            "highlights", "Historic landmark, award-winning restaurant, luxury spa"
                    ),
                    Map.<String, Object>of(
                            "name", "Graduate Nashville",
                            "rating", 4.4,
                            "pricePerNight", "$200-$400",
                            "neighborhood", "Midtown",
                            "highlights", "Music-themed, rooftop bar, Vanderbilt area"
                    )
            )),
            Map.entry("New Orleans", List.of(
                    Map.<String, Object>of(
                            "name", "The Roosevelt New Orleans",
                            "rating", 4.7,
                            "pricePerNight", "$250-$500",
                            "neighborhood", "French Quarter",
                            "highlights", "Historic, rooftop pool, Sazerac Bar"
                    ),
                    Map.<String, Object>of(
                            "name", "Hotel Monteleone",
                            "rating", 4.5,
                            "pricePerNight", "$200-$400",
                            "neighborhood", "French Quarter",
                            "highlights", "Historic, Carousel Bar, Royal Street location"
                    )
            ))
    );

    private HotelRecommendationTool() {}

    /**
     * Searches for hotel recommendations in a given city.
     *
     * @param city the destination city
     * @param checkInDate check-in date (YYYY-MM-DD)
     * @param checkOutDate check-out date (YYYY-MM-DD)
     * @param guests number of guests
     * @param budgetLevel budget preference: "budget", "mid-range", or "luxury"
     * @return a map containing hotel recommendations
     */
    public static ImmutableMap<String, Object> searchHotels(
            String city,
            String checkInDate,
            String checkOutDate,
            int guests,
            String budgetLevel) {

        List<Map<String, Object>> hotels = CITY_HOTELS.get(city);

        if (hotels == null) {
            return ImmutableMap.of(
                    "status", "error",
                    "message", "No hotel data available for " + city + ". Supported cities: "
                            + String.join(", ", CITY_HOTELS.keySet())
            );
        }

        ImmutableList.Builder<Map<String, Object>> recommendations = ImmutableList.builder();
        for (Map<String, Object> hotel : hotels) {
            ImmutableMap.Builder<String, Object> rec = ImmutableMap.<String, Object>builder()
                    .putAll(hotel)
                    .put("checkIn", checkInDate)
                    .put("checkOut", checkOutDate)
                    .put("guests", guests);

            boolean available = RANDOM.nextInt(10) > 2;
            rec.put("available", available);
            rec.put("availabilityNote", available ? "Rooms available" : "Limited availability - book soon!");

            recommendations.add(rec.build());
        }

        return ImmutableMap.of(
                "status", "success",
                "city", city,
                "checkIn", checkInDate,
                "checkOut", checkOutDate,
                "guests", guests,
                "budgetLevel", budgetLevel,
                "recommendations", recommendations.build(),
                "tip", "Prices vary by season. Book early for best rates!"
        );
    }

    /**
     * Gets detailed information about a specific hotel.
     *
     * @param hotelName the name of the hotel
     * @param city the city where the hotel is located
     * @return a map with detailed hotel information
     */
    public static ImmutableMap<String, Object> getHotelDetails(String hotelName, String city) {
        List<Map<String, Object>> hotels = CITY_HOTELS.get(city);
        if (hotels != null) {
            for (Map<String, Object> hotel : hotels) {
                if (hotel.get("name").toString().toLowerCase().contains(hotelName.toLowerCase())) {
                    return ImmutableMap.<String, Object>builder()
                            .putAll(hotel)
                            .put("city", city)
                            .put("amenities", List.of("WiFi", "Pool", "Fitness Center", "Restaurant",
                                    "Room Service", "Concierge", "Valet Parking"))
                            .put("cancellationPolicy", "Free cancellation up to 48 hours before check-in")
                            .put("status", "found")
                            .build();
                }
            }
        }
        return ImmutableMap.of(
                "status", "not_found",
                "message", "Hotel '" + hotelName + "' not found in " + city
        );
    }
}
