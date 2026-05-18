package com.workshop.usermanagement.service;

import com.workshop.usermanagement.model.City;
import com.workshop.usermanagement.model.Country;
import com.workshop.usermanagement.model.State;
import com.workshop.usermanagement.repository.CityRepository;
import com.workshop.usermanagement.repository.CountryRepository;
import com.workshop.usermanagement.repository.StateRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service layer for location-related operations.
 * Handles retrieval of countries, states (by country), and cities (by state)
 * to support the cascading dropdown functionality on the frontend.
 */
@Service
public class LocationService {

    private final CountryRepository countryRepository;
    private final StateRepository stateRepository;
    private final CityRepository cityRepository;

    public LocationService(CountryRepository countryRepository,
                           StateRepository stateRepository,
                           CityRepository cityRepository) {
        this.countryRepository = countryRepository;
        this.stateRepository = stateRepository;
        this.cityRepository = cityRepository;
    }

    /** Retrieve all countries sorted by name */
    public List<Country> getAllCountries() {
        return countryRepository.findAll();
    }

    /** Retrieve states filtered by country ID for cascading dropdown */
    public List<State> getStatesByCountryId(Long countryId) {
        return stateRepository.findByCountryId(countryId);
    }

    /** Retrieve cities filtered by state ID for cascading dropdown */
    public List<City> getCitiesByStateId(Long stateId) {
        return cityRepository.findByStateId(stateId);
    }
}
