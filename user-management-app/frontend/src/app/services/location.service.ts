import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Country, State, City } from '../models/location.model';

/**
 * Service for location data (countries, states, cities).
 * Supports the cascading dropdown functionality where:
 * - Countries are loaded on init
 * - States are loaded when a country is selected
 * - Cities are loaded when a state is selected
 */
@Injectable({
  providedIn: 'root',
})
export class LocationService {
  // Base URL for the location API endpoints (relative path, proxied to backend in dev)
  private readonly apiUrl = '/api/locations';

  constructor(private http: HttpClient) {}

  /** Fetch all countries for the country dropdown */
  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiUrl}/countries`);
  }

  /** Fetch states by country ID for the cascading state dropdown */
  getStatesByCountry(countryId: number): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiUrl}/states/${countryId}`);
  }

  /** Fetch cities by state ID for the cascading city dropdown */
  getCitiesByState(stateId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiUrl}/cities/${stateId}`);
  }
}
