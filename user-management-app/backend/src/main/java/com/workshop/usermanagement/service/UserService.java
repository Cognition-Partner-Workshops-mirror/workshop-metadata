package com.workshop.usermanagement.service;

import com.workshop.usermanagement.model.User;
import com.workshop.usermanagement.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service layer for user-related operations.
 * Handles CRUD operations for users and provides
 * aggregation data for chart/graph generation.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Retrieve all users for the report listing */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /** Find a specific user by ID */
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /** Create a new user record */
    public User createUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Update an existing user record.
     * Copies all editable fields from the updated data to the existing entity.
     */
    public User updateUser(Long id, User updatedUser) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setDateOfBirth(updatedUser.getDateOfBirth());
        existingUser.setCountry(updatedUser.getCountry());
        existingUser.setState(updatedUser.getState());
        existingUser.setCity(updatedUser.getCity());
        existingUser.setAddress(updatedUser.getAddress());

        return userRepository.save(existingUser);
    }

    /** Delete a user by ID */
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    /** Check if email already exists (for new user validation) */
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    /** Check if email exists for another user (for update validation) */
    public boolean emailExistsForOtherUser(String email, Long userId) {
        return userRepository.existsByEmailAndIdNot(email, userId);
    }

    /**
     * Get user count grouped by country for chart generation.
     * Returns a map of country name -> user count.
     */
    public Map<String, Long> getUserCountByCountry() {
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : userRepository.countByCountry()) {
            result.put((String) row[0], (Long) row[1]);
        }
        return result;
    }

    /**
     * Get user count grouped by state for chart generation.
     * Returns a map of state name -> user count.
     */
    public Map<String, Long> getUserCountByState() {
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : userRepository.countByState()) {
            result.put((String) row[0], (Long) row[1]);
        }
        return result;
    }

    /**
     * Get user count grouped by city for chart generation.
     * Returns a map of city name -> user count.
     */
    public Map<String, Long> getUserCountByCity() {
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : userRepository.countByCity()) {
            result.put((String) row[0], (Long) row[1]);
        }
        return result;
    }
}
