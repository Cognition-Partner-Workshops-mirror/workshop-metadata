/**
 * Interface representing a Country in the location hierarchy.
 * Used for the country dropdown in the user form.
 */
export interface Country {
  id: number;
  name: string;
  code: string;
}

/**
 * Interface representing a State/Province.
 * Loaded dynamically based on selected country.
 */
export interface State {
  id: number;
  name: string;
}

/**
 * Interface representing a City.
 * Loaded dynamically based on selected state.
 */
export interface City {
  id: number;
  name: string;
}
