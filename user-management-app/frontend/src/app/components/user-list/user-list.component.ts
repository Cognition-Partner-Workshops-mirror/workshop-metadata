import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

/**
 * Component displaying the user report table.
 * Shows all registered users with options to edit or delete each record.
 * Emits an event when the edit button is clicked to switch to edit mode.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  /** Event emitted when user clicks edit on a record */
  @Output() editRequested = new EventEmitter<User>();

  users: User[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  /** Fetch all users from the backend for the report */
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load users. Please try again.';
        this.isLoading = false;
        console.error('Error loading users:', err);
      },
    });
  }

  /** Emit edit event with selected user data */
  onEdit(user: User): void {
    this.editRequested.emit(user);
  }

  /** Delete a user after confirmation and refresh the list */
  onDelete(user: User): void {
    if (
      confirm(`Are you sure you want to delete ${user.name}?`)
    ) {
      this.userService.deleteUser(user.id!).subscribe({
        next: () => this.loadUsers(),
        error: (err) => {
          this.errorMessage = 'Failed to delete user.';
          console.error('Error deleting user:', err);
        },
      });
    }
  }
}
