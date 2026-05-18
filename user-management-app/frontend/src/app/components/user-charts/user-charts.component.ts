import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { UserService } from '../../services/user.service';

// Register Chart.js components needed for bar, pie, and doughnut charts
Chart.register(
  BarController,
  BarElement,
  PieController,
  ArcElement,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

/**
 * Component for displaying user distribution charts.
 * Shows three charts:
 * 1. Bar chart - Users by Country
 * 2. Pie chart - Users by State
 * 3. Doughnut chart - Users by City
 */
@Component({
  selector: 'app-user-charts',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './user-charts.component.html',
  styleUrl: './user-charts.component.scss',
})
export class UserChartsComponent implements OnInit {
  // Color palette for chart segments
  private readonly chartColors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#f5576c',
    '#4facfe',
    '#00f2fe',
    '#43e97b',
    '#fa709a',
    '#fee140',
    '#30cfd0',
    '#a8edea',
    '#fed6e3',
  ];

  isLoading = true;
  hasData = false;

  // --- Country Bar Chart Configuration ---
  countryChartType = 'bar' as const;
  countryChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  countryChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Users by Country', font: { size: 16 } },
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  // --- State Pie Chart Configuration ---
  stateChartType = 'pie' as const;
  stateChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  stateChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Users by State', font: { size: 16 } },
      legend: { position: 'right' },
    },
  };

  // --- City Doughnut Chart Configuration ---
  cityChartType = 'doughnut' as const;
  cityChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  cityChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Users by City', font: { size: 16 } },
      legend: { position: 'right' },
    },
  };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  /** Load all chart data from the backend statistics endpoints */
  loadChartData(): void {
    this.isLoading = true;
    let completedRequests = 0;
    const totalRequests = 3;

    // Helper to check if all requests completed
    const checkDone = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        this.isLoading = false;
      }
    };

    // Load country statistics for bar chart
    this.userService.getUserCountByCountry().subscribe({
      next: (data) => {
        const labels = Object.keys(data);
        const values = Object.values(data);
        this.hasData = this.hasData || labels.length > 0;
        this.countryChartData = {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: this.chartColors.slice(0, labels.length),
              borderWidth: 1,
            },
          ],
        };
        checkDone();
      },
      error: () => checkDone(),
    });

    // Load state statistics for pie chart
    this.userService.getUserCountByState().subscribe({
      next: (data) => {
        const labels = Object.keys(data);
        const values = Object.values(data);
        this.hasData = this.hasData || labels.length > 0;
        this.stateChartData = {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: this.chartColors.slice(0, labels.length),
            },
          ],
        };
        checkDone();
      },
      error: () => checkDone(),
    });

    // Load city statistics for doughnut chart
    this.userService.getUserCountByCity().subscribe({
      next: (data) => {
        const labels = Object.keys(data);
        const values = Object.values(data);
        this.hasData = this.hasData || labels.length > 0;
        this.cityChartData = {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: this.chartColors.slice(0, labels.length),
            },
          ],
        };
        checkDone();
      },
      error: () => checkDone(),
    });
  }
}
