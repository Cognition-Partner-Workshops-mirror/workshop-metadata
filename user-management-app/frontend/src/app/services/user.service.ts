import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

/**
 * Service for user CRUD operations and statistics.
 * Communicates with the Spring Boot backend REST API.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  // Base URL for the user API endpoints (relative path, proxied to backend in dev)
  private readonly apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  /** Fetch all users for the report listing */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /** Fetch a single user by ID for editing */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /** Create a new user */
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  /** Update an existing user */
  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  /** Delete a user by ID */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Get user count grouped by country for chart generation */
  getUserCountByCountry(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/stats/country`);
  }

  /** Get user count grouped by state for chart generation */
  getUserCountByState(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/stats/state`);
  }

  /** Get user count grouped by city for chart generation */
  getUserCountByCity(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/stats/city`);
  }
}
