package com.workshop.usermanagement.repository;

import com.workshop.usermanagement.model.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for State entity.
 * Provides CRUD operations and custom query for states by country.
 */
@Repository
public interface StateRepository extends JpaRepository<State, Long> {

    /** Find all states belonging to a specific country */
    List<State> findByCountryId(Long countryId);
}
