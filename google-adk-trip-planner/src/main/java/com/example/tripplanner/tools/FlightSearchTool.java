package com.example.tripplanner.tools;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Tool that provides flight search capabilities between major US cities.
 * In production, this would integrate with flight APIs (Amadeus, Google Flights, etc.).
 * Currently returns simulated data for demonstration purposes.
 */
public final class FlightSearchTool {

    private static final Random RANDOM = new Random();
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final Map<String, String> AIRPORT_CODES = Map.ofEntries(
            Map.entry("Tampa", "TPA"),
            Map.entry("Las Vegas", "LAS"),
            Map.entry("New York", "JFK"),
            Map.entry("Los Angeles", "LAX"),
            Map.entry("Chicago", "ORD"),
            Map.entry("Miami", "MIA"),
            Map.entry("San Francisco", "SFO"),
            Map.entry("Seattle", "SEA"),
            Map.entry("Denver", "DEN"),
            Map.entry("Atlanta", "ATL"),
            Map.entry("Dallas", "DFW"),
            Map.entry("Boston", "BOS"),
            Map.entry("Washington DC", "DCA"),
            Map.entry("Orlando", "MCO"),
            Map.entry("Nashville", "BNA"),
            Map.entry("New Orleans", "MSY"),
            Map.entry("Austin", "AUS"),
            Map.entry("San Diego", "SAN"),
            Map.entry("Phoenix", "PHX"),
            Map.entry("Honolulu", "HNL")
    );

    private static final List<String> AIRLINES = List.of(
            "Delta Air Lines", "United Airlines", "American Airlines",
            "Southwest Airlines", "JetBlue Airways", "Spirit Airlines",
            "Frontier Airlines", "Alaska Airlines"
    );

    private FlightSearchTool() {}

    /**
     * Searches for available flights between two cities.
     *
     * @param originCity the departure city name
     * @param destinationCity the arrival city name
     * @param departureDate the desired departure date (YYYY-MM-DD format)
     * @param returnDate the desired return date (YYYY-MM-DD format), optional
     * @param passengers number of passengers
     * @return a map containing flight search results
     */
    public static ImmutableMap<String, Object> searchFlights(
            String originCity,
            String destinationCity,
            String departureDate,
            String returnDate,
            int passengers) {

        String originCode = AIRPORT_CODES.getOrDefault(originCity, "???");
        String destCode = AIRPORT_CODES.getOrDefault(destinationCity, "???");

        if (originCode.equals("???") || destCode.equals("???")) {
            return ImmutableMap.of(
                    "status", "error",
                    "message", "Could not find airport code for one of the cities. Supported cities: "
                            + String.join(", ", AIRPORT_CODES.keySet())
            );
        }

        ImmutableList.Builder<Map<String, Object>> outboundFlights = ImmutableList.builder();
        int numFlights = 3 + RANDOM.nextInt(3);

        for (int i = 0; i < numFlights; i++) {
            int hour = 6 + RANDOM.nextInt(14);
            int minute = RANDOM.nextInt(4) * 15;
            int durationHours = 2 + RANDOM.nextInt(4);
            int durationMinutes = RANDOM.nextInt(4) * 15;
            int basePrice = 150 + RANDOM.nextInt(400);
            String airline = AIRLINES.get(RANDOM.nextInt(AIRLINES.size()));
            int flightNum = 100 + RANDOM.nextInt(9000);

            boolean hasStop = RANDOM.nextBoolean();
            String stops = hasStop ? "1 stop" : "Nonstop";

            outboundFlights.add(ImmutableMap.<String, Object>builder()
                    .put("airline", airline)
                    .put("flightNumber", airline.substring(0, 2).toUpperCase() + flightNum)
                    .put("departure", String.format("%s (%s) at %02d:%02d", originCity, originCode, hour, minute))
                    .put("arrival", String.format("%s (%s) at %02d:%02d", destinationCity, destCode,
                            (hour + durationHours) % 24, (minute + durationMinutes) % 60))
                    .put("duration", String.format("%dh %dm", durationHours, durationMinutes))
                    .put("stops", stops)
                    .put("price", String.format("$%d per person", basePrice))
                    .put("totalPrice", String.format("$%d", basePrice * passengers))
                    .put("class", "Economy")
                    .build());
        }

        ImmutableMap.Builder<String, Object> result = ImmutableMap.<String, Object>builder()
                .put("status", "success")
                .put("origin", originCity + " (" + originCode + ")")
                .put("destination", destinationCity + " (" + destCode + ")")
                .put("departureDate", departureDate)
                .put("passengers", passengers)
                .put("outboundFlights", outboundFlights.build());

        if (returnDate != null && !returnDate.isBlank()) {
            ImmutableList.Builder<Map<String, Object>> returnFlights = ImmutableList.builder();
            int numReturnFlights = 3 + RANDOM.nextInt(3);

            for (int i = 0; i < numReturnFlights; i++) {
                int hour = 6 + RANDOM.nextInt(14);
                int minute = RANDOM.nextInt(4) * 15;
                int durationHours = 2 + RANDOM.nextInt(4);
                int durationMinutes = RANDOM.nextInt(4) * 15;
                int basePrice = 150 + RANDOM.nextInt(400);
                String airline = AIRLINES.get(RANDOM.nextInt(AIRLINES.size()));
                int flightNum = 100 + RANDOM.nextInt(9000);
                boolean hasStop = RANDOM.nextBoolean();
                String stops = hasStop ? "1 stop" : "Nonstop";

                returnFlights.add(ImmutableMap.<String, Object>builder()
                        .put("airline", airline)
                        .put("flightNumber", airline.substring(0, 2).toUpperCase() + flightNum)
                        .put("departure", String.format("%s (%s) at %02d:%02d", destinationCity, destCode, hour, minute))
                        .put("arrival", String.format("%s (%s) at %02d:%02d", originCity, originCode,
                                (hour + durationHours) % 24, (minute + durationMinutes) % 60))
                        .put("duration", String.format("%dh %dm", durationHours, durationMinutes))
                        .put("stops", stops)
                        .put("price", String.format("$%d per person", basePrice))
                        .put("totalPrice", String.format("$%d", basePrice * passengers))
                        .put("class", "Economy")
                        .build());
            }
            result.put("returnDate", returnDate);
            result.put("returnFlights", returnFlights.build());
        }

        return result.build();
    }

    /**
     * Gets the airport code for a given city.
     *
     * @param cityName the name of the city
     * @return a map with the airport code information
     */
    public static ImmutableMap<String, Object> getAirportCode(String cityName) {
        String code = AIRPORT_CODES.getOrDefault(cityName, null);
        if (code != null) {
            return ImmutableMap.of(
                    "city", cityName,
                    "airportCode", code,
                    "status", "found"
            );
        }
        return ImmutableMap.of(
                "city", cityName,
                "status", "not_found",
                "supportedCities", String.join(", ", AIRPORT_CODES.keySet())
        );
    }
}
