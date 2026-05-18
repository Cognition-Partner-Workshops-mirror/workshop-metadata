import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserChartsComponent } from './components/user-charts/user-charts.component';
import { User } from './models/user.model';

/**
 * Root application component.
 * Manages the main layout with navigation between form, report, and charts views.
 * Coordinates user editing flow between the list and form components.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    UserFormComponent,
    UserListComponent,
    UserChartsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Currently active tab/view */
  activeTab: 'form' | 'report' | 'charts' = 'form';

  /** User being edited (null for new user creation) */
  editUser: User | null = null;

  /** Reference to the user list component for refreshing data */
  @ViewChild(UserListComponent) userListComponent!: UserListComponent;

  /** Reference to the charts component for refreshing data */
  @ViewChild(UserChartsComponent) userChartsComponent!: UserChartsComponent;

  /** Switch to a specific tab */
  setActiveTab(tab: 'form' | 'report' | 'charts'): void {
    this.activeTab = tab;
    // Reset edit mode when switching to form tab
    if (tab === 'form') {
      this.editUser = null;
    }
  }

  /** Handle edit request from the user list - switches to form with user data */
  onEditUser(user: User): void {
    this.editUser = user;
    this.activeTab = 'form';
  }

  /** Handle successful save - refresh list and charts data */
  onUserSaved(): void {
    if (this.userListComponent) {
      this.userListComponent.loadUsers();
    }
    if (this.userChartsComponent) {
      this.userChartsComponent.loadChartData();
    }
    this.editUser = null;
  }
}
