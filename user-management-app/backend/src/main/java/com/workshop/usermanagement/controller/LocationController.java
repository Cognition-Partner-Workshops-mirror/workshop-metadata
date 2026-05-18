package com.workshop.usermanagement.controller;

import com.workshop.usermanagement.model.City;
import com.workshop.usermanagement.model.Country;
import com.workshop.usermanagement.model.State;
import com.workshop.usermanagement.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for location data (countries, states, cities).
 * Provides endpoints for the cascading dropdown functionality
 * where selecting a country loads its states, and selecting a state loads its cities.
 */
@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = "http://localhost:4200")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    /** GET /api/locations/countries - Retrieve all countries for the dropdown */
    @GetMapping("/countries")
    public ResponseEntity<List<Country>> getAllCountries() {
        return ResponseEntity.ok(locationService.getAllCountries());
    }

    /** GET /api/locations/states/{countryId} - Retrieve states by country for cascading dropdown */
    @GetMapping("/states/{countryId}")
    public ResponseEntity<List<State>> getStatesByCountry(@PathVariable Long countryId) {
        return ResponseEntity.ok(locationService.getStatesByCountryId(countryId));
    }

    /** GET /api/locations/cities/{stateId} - Retrieve cities by state for cascading dropdown */
    @GetMapping("/cities/{stateId}")
    public ResponseEntity<List<City>> getCitiesByState(@PathVariable Long stateId) {
        return ResponseEntity.ok(locationService.getCitiesByStateId(stateId));
    }
}
