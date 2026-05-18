/**
 * Interface representing a User entity.
 * Maps to the User entity on the backend.
 */
export interface User {
  id?: number;
  name: string;
  email: string;
  dateOfBirth: string; // ISO date string format (YYYY-MM-DD)
  country: string;
  state: string;
  city: string;
  address: string;
}
