package com.workshop.usermanagement.controller;

import com.workshop.usermanagement.model.User;
import com.workshop.usermanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for user CRUD operations and report/chart data.
 * Provides endpoints for creating, reading, updating, and deleting users,
 * as well as aggregation endpoints for chart generation by country/state/city.
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** GET /api/users - Retrieve all users for the report listing */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /** GET /api/users/{id} - Retrieve a specific user by ID for editing */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/users - Create a new user with validated input */
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User createdUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    /** PUT /api/users/{id} - Update an existing user's data */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }

    /** DELETE /api/users/{id} - Delete a user record */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/users/stats/country - Get user count grouped by country for charts */
    @GetMapping("/stats/country")
    public ResponseEntity<Map<String, Long>> getUserCountByCountry() {
        return ResponseEntity.ok(userService.getUserCountByCountry());
    }

    /** GET /api/users/stats/state - Get user count grouped by state for charts */
    @GetMapping("/stats/state")
    public ResponseEntity<Map<String, Long>> getUserCountByState() {
        return ResponseEntity.ok(userService.getUserCountByState());
    }

    /** GET /api/users/stats/city - Get user count grouped by city for charts */
    @GetMapping("/stats/city")
    public ResponseEntity<Map<String, Long>> getUserCountByCity() {
        return ResponseEntity.ok(userService.getUserCountByCity());
    }
}
