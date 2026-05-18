package com.workshop.usermanagement.repository;

import com.workshop.usermanagement.model.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Country entity.
 * Provides CRUD operations for countries.
 */
@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {
}
