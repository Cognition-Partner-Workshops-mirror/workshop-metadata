package com.workshop.usermanagement.repository;

import com.workshop.usermanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for User entity.
 * Provides CRUD operations and aggregation queries for reports and charts.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** Count users grouped by country for chart generation */
    @Query("SELECT u.country, COUNT(u) FROM User u GROUP BY u.country")
    List<Object[]> countByCountry();

    /** Count users grouped by state for chart generation */
    @Query("SELECT u.state, COUNT(u) FROM User u GROUP BY u.state")
    List<Object[]> countByState();

    /** Count users grouped by city for chart generation */
    @Query("SELECT u.city, COUNT(u) FROM User u GROUP BY u.city")
    List<Object[]> countByCity();

    /** Check if email already exists (for validation) */
    boolean existsByEmail(String email);

    /** Check if email exists excluding a specific user (for update validation) */
    boolean existsByEmailAndIdNot(String email, Long id);
}
