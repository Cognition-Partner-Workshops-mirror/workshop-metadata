import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LocationService } from '../../services/location.service';
import { UserService } from '../../services/user.service';
import { Country, State, City } from '../../models/location.model';
import { User } from '../../models/user.model';

/**
 * Component for the user registration/edit form.
 * Features cascading dropdowns for Country -> State -> City selection.
 * Emits events when a user is saved (created or updated).
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  /** User data passed in for editing (null for new user) */
  @Input() editUser: User | null = null;

  /** Event emitted after a user is successfully saved */
  @Output() userSaved = new EventEmitter<void>();

  userForm!: FormGroup;

  // Location dropdown data
  countries: Country[] = [];
  states: State[] = [];
  cities: City[] = [];

  // UI state flags
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  // Track selected IDs for cascading dropdown logic
  selectedCountryId: number | null = null;
  selectedStateId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCountries();
  }

  /** Initialize the reactive form with validation rules */
  private initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', Validators.required],
      countryId: ['', Validators.required],
      country: ['', Validators.required],
      stateId: ['', Validators.required],
      state: ['', Validators.required],
      cityId: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  /** Load all countries for the country dropdown on component init */
  private loadCountries(): void {
    this.locationService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        // If editing a user, pre-populate the form after countries load
        if (this.editUser) {
          this.populateFormForEdit();
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to load countries. Please try again.';
        console.error('Error loading countries:', err);
      },
    });
  }

  /** Pre-populate form fields when editing an existing user */
  private populateFormForEdit(): void {
    if (!this.editUser) return;

    this.userForm.patchValue({
      name: this.editUser.name,
      email: this.editUser.email,
      dateOfBirth: this.editUser.dateOfBirth,
      country: this.editUser.country,
      state: this.editUser.state,
      city: this.editUser.city,
      address: this.editUser.address,
    });

    // Find and select the matching country to trigger state loading
    const matchingCountry = this.countries.find(
      (c) => c.name === this.editUser!.country
    );
    if (matchingCountry) {
      this.userForm.patchValue({ countryId: matchingCountry.id });
      this.selectedCountryId = matchingCountry.id;

      // Load states for the selected country
      this.locationService
        .getStatesByCountry(matchingCountry.id)
        .subscribe((states) => {
          this.states = states;
          const matchingState = states.find(
            (s) => s.name === this.editUser!.state
          );
          if (matchingState) {
            this.userForm.patchValue({ stateId: matchingState.id });
            this.selectedStateId = matchingState.id;

            // Load cities for the selected state
            this.locationService
              .getCitiesByState(matchingState.id)
              .subscribe((cities) => {
                this.cities = cities;
                const matchingCity = cities.find(
                  (c) => c.name === this.editUser!.city
                );
                if (matchingCity) {
                  this.userForm.patchValue({ cityId: matchingCity.id });
                }
              });
          }
        });
    }
  }

  /**
   * Handler for country dropdown change.
   * Loads states for the selected country and resets state/city selections.
   */
  onCountryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const countryId = Number(selectElement.value);
    this.selectedCountryId = countryId;

    // Reset dependent dropdowns when country changes
    this.states = [];
    this.cities = [];
    this.userForm.patchValue({
      stateId: '',
      state: '',
      cityId: '',
      city: '',
    });

    // Set the country name based on selected ID
    const selectedCountry = this.countries.find((c) => c.id === countryId);
    if (selectedCountry) {
      this.userForm.patchValue({ country: selectedCountry.name });
    }

    // Load states for the selected country
    if (countryId) {
      this.locationService.getStatesByCountry(countryId).subscribe({
        next: (states) => (this.states = states),
        error: (err) => console.error('Error loading states:', err),
      });
    }
  }

  /**
   * Handler for state dropdown change.
   * Loads cities for the selected state and resets city selection.
   */
  onStateChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const stateId = Number(selectElement.value);
    this.selectedStateId = stateId;

    // Reset city dropdown when state changes
    this.cities = [];
    this.userForm.patchValue({ cityId: '', city: '' });

    // Set the state name based on selected ID
    const selectedState = this.states.find((s) => s.id === stateId);
    if (selectedState) {
      this.userForm.patchValue({ state: selectedState.name });
    }

    // Load cities for the selected state
    if (stateId) {
      this.locationService.getCitiesByState(stateId).subscribe({
        next: (cities) => (this.cities = cities),
        error: (err) => console.error('Error loading cities:', err),
      });
    }
  }

  /**
   * Handler for city dropdown change.
   * Sets the city name in the form.
   */
  onCityChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const cityId = Number(selectElement.value);

    const selectedCity = this.cities.find((c) => c.id === cityId);
    if (selectedCity) {
      this.userForm.patchValue({ city: selectedCity.name });
    }
  }

  /** Submit the form to create or update a user */
  onSubmit(): void {
    if (this.userForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.userForm.controls).forEach((key) => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Build user payload from form values
    const userData: User = {
      name: this.userForm.value.name,
      email: this.userForm.value.email,
      dateOfBirth: this.userForm.value.dateOfBirth,
      country: this.userForm.value.country,
      state: this.userForm.value.state,
      city: this.userForm.value.city,
      address: this.userForm.value.address,
    };

    if (this.editUser?.id) {
      // Update existing user
      this.userService.updateUser(this.editUser.id, userData).subscribe({
        next: () => {
          this.successMessage = 'User updated successfully!';
          this.isSubmitting = false;
          this.userSaved.emit();
          this.resetForm();
        },
        error: (err) => {
          this.errorMessage =
            err.error?.email || 'Failed to update user. Please try again.';
          this.isSubmitting = false;
        },
      });
    } else {
      // Create new user
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.successMessage = 'User created successfully!';
          this.isSubmitting = false;
          this.userSaved.emit();
          this.resetForm();
        },
        error: (err) => {
          this.errorMessage =
            err.error?.email || 'Failed to create user. Please try again.';
          this.isSubmitting = false;
        },
      });
    }
  }

  /** Reset the form to its initial state */
  resetForm(): void {
    this.userForm.reset();
    this.states = [];
    this.cities = [];
    this.editUser = null;
    this.selectedCountryId = null;
    this.selectedStateId = null;
  }
}
