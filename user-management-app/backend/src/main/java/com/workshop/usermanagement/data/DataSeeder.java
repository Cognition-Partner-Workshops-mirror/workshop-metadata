package com.workshop.usermanagement.data;

import com.workshop.usermanagement.model.City;
import com.workshop.usermanagement.model.Country;
import com.workshop.usermanagement.model.State;
import com.workshop.usermanagement.repository.CityRepository;
import com.workshop.usermanagement.repository.CountryRepository;
import com.workshop.usermanagement.repository.StateRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with initial country, state, and city data on application startup.
 * This ensures the cascading dropdowns have data available immediately.
 * Only runs if no countries exist yet (idempotent).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final CountryRepository countryRepository;
    private final StateRepository stateRepository;
    private final CityRepository cityRepository;

    public DataSeeder(CountryRepository countryRepository,
                      StateRepository stateRepository,
                      CityRepository cityRepository) {
        this.countryRepository = countryRepository;
        this.stateRepository = stateRepository;
        this.cityRepository = cityRepository;
    }

    @Override
    public void run(String... args) {
        // Only seed if database is empty (idempotent)
        if (countryRepository.count() > 0) {
            return;
        }

        // --- United States ---
        Country usa = countryRepository.save(new Country("United States", "US"));

        State california = stateRepository.save(new State("California", usa));
        cityRepository.save(new City("Los Angeles", california));
        cityRepository.save(new City("San Francisco", california));
        cityRepository.save(new City("San Diego", california));
        cityRepository.save(new City("San Jose", california));

        State texas = stateRepository.save(new State("Texas", usa));
        cityRepository.save(new City("Houston", texas));
        cityRepository.save(new City("Dallas", texas));
        cityRepository.save(new City("Austin", texas));
        cityRepository.save(new City("San Antonio", texas));

        State newYork = stateRepository.save(new State("New York", usa));
        cityRepository.save(new City("New York City", newYork));
        cityRepository.save(new City("Buffalo", newYork));
        cityRepository.save(new City("Albany", newYork));
        cityRepository.save(new City("Rochester", newYork));

        State florida = stateRepository.save(new State("Florida", usa));
        cityRepository.save(new City("Miami", florida));
        cityRepository.save(new City("Orlando", florida));
        cityRepository.save(new City("Tampa", florida));
        cityRepository.save(new City("Jacksonville", florida));

        // --- India ---
        Country india = countryRepository.save(new Country("India", "IN"));

        State maharashtra = stateRepository.save(new State("Maharashtra", india));
        cityRepository.save(new City("Mumbai", maharashtra));
        cityRepository.save(new City("Pune", maharashtra));
        cityRepository.save(new City("Nagpur", maharashtra));
        cityRepository.save(new City("Nashik", maharashtra));

        State karnataka = stateRepository.save(new State("Karnataka", india));
        cityRepository.save(new City("Bangalore", karnataka));
        cityRepository.save(new City("Mysore", karnataka));
        cityRepository.save(new City("Hubli", karnataka));
        cityRepository.save(new City("Mangalore", karnataka));

        State delhi = stateRepository.save(new State("Delhi", india));
        cityRepository.save(new City("New Delhi", delhi));
        cityRepository.save(new City("Dwarka", delhi));
        cityRepository.save(new City("Rohini", delhi));

        State tamilNadu = stateRepository.save(new State("Tamil Nadu", india));
        cityRepository.save(new City("Chennai", tamilNadu));
        cityRepository.save(new City("Coimbatore", tamilNadu));
        cityRepository.save(new City("Madurai", tamilNadu));
        cityRepository.save(new City("Salem", tamilNadu));

        // --- United Kingdom ---
        Country uk = countryRepository.save(new Country("United Kingdom", "GB"));

        State england = stateRepository.save(new State("England", uk));
        cityRepository.save(new City("London", england));
        cityRepository.save(new City("Manchester", england));
        cityRepository.save(new City("Birmingham", england));
        cityRepository.save(new City("Liverpool", england));

        State scotland = stateRepository.save(new State("Scotland", uk));
        cityRepository.save(new City("Edinburgh", scotland));
        cityRepository.save(new City("Glasgow", scotland));
        cityRepository.save(new City("Aberdeen", scotland));

        // --- Canada ---
        Country canada = countryRepository.save(new Country("Canada", "CA"));

        State ontario = stateRepository.save(new State("Ontario", canada));
        cityRepository.save(new City("Toronto", ontario));
        cityRepository.save(new City("Ottawa", ontario));
        cityRepository.save(new City("Hamilton", ontario));

        State quebec = stateRepository.save(new State("Quebec", canada));
        cityRepository.save(new City("Montreal", quebec));
        cityRepository.save(new City("Quebec City", quebec));
        cityRepository.save(new City("Laval", quebec));

        State britishColumbia = stateRepository.save(new State("British Columbia", canada));
        cityRepository.save(new City("Vancouver", britishColumbia));
        cityRepository.save(new City("Victoria", britishColumbia));
        cityRepository.save(new City("Surrey", britishColumbia));

        // --- Australia ---
        Country australia = countryRepository.save(new Country("Australia", "AU"));

        State nsw = stateRepository.save(new State("New South Wales", australia));
        cityRepository.save(new City("Sydney", nsw));
        cityRepository.save(new City("Newcastle", nsw));
        cityRepository.save(new City("Wollongong", nsw));

        State victoria = stateRepository.save(new State("Victoria", australia));
        cityRepository.save(new City("Melbourne", victoria));
        cityRepository.save(new City("Geelong", victoria));
        cityRepository.save(new City("Ballarat", victoria));

        State queensland = stateRepository.save(new State("Queensland", australia));
        cityRepository.save(new City("Brisbane", queensland));
        cityRepository.save(new City("Gold Coast", queensland));
        cityRepository.save(new City("Cairns", queensland));
    }
}
