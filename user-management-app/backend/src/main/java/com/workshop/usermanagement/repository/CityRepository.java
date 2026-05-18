package com.workshop.usermanagement.repository;

import com.workshop.usermanagement.model.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for City entity.
 * Provides CRUD operations and custom query for cities by state.
 */
@Repository
public interface CityRepository extends JpaRepository<City, Long> {

    /** Find all cities belonging to a specific state */
    List<City> findByStateId(Long stateId);
}
