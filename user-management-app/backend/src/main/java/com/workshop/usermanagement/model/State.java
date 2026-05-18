package com.workshop.usermanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

/**
 * Entity representing a state/province within a country.
 * Each state belongs to one country and has multiple cities.
 */
@Entity
@Table(name = "states")
public class State {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Name of the state */
    @Column(nullable = false)
    private String name;

    /** Parent country this state belongs to - ignored in JSON to prevent circular reference */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    /** List of cities within this state - ignored in JSON to prevent circular reference */
    @JsonIgnore
    @OneToMany(mappedBy = "state", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<City> cities;

    public State() {
    }

    public State(String name, Country country) {
        this.name = name;
        this.country = country;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Country getCountry() {
        return country;
    }

    public void setCountry(Country country) {
        this.country = country;
    }

    public List<City> getCities() {
        return cities;
    }

    public void setCities(List<City> cities) {
        this.cities = cities;
    }
}
