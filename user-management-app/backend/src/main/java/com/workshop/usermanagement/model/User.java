package com.workshop.usermanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Entity representing a user record.
 * Stores personal information including name, email, DOB,
 * and location details (country, state, city, address).
 */
@Entity
@Table(name = "app_users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Full name of the user */
    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    /** Email address of the user - must be unique and valid */
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(nullable = false, unique = true)
    private String email;

    /** Date of birth of the user */
    @NotNull(message = "Date of birth is required")
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    /** Country the user resides in */
    @NotBlank(message = "Country is required")
    @Column(nullable = false)
    private String country;

    /** State/province the user resides in */
    @NotBlank(message = "State is required")
    @Column(nullable = false)
    private String state;

    /** City the user resides in */
    @NotBlank(message = "City is required")
    @Column(nullable = false)
    private String city;

    /** Street address of the user */
    @NotBlank(message = "Address is required")
    @Column(nullable = false, length = 500)
    private String address;

    public User() {
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
