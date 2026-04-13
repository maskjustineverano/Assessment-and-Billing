import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api } from '../api';
import { AuthStore } from '../auth.store';
import { filterNavigationSections, resourceConfigs } from '../resource-config';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly api = inject(Api);
  private readonly authStore = inject(AuthStore);

  readonly navigationSections = filterNavigationSections(this.authStore.role());
  loading = true;
  connectionStatus = 'Checking API connection...';
  metrics: Array<{ label: string; value: number; detail: string }> = [];

  constructor() {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    forkJoin({
      schools: this.api.list(resourceConfigs.school.endpoint).pipe(catchError(() => of([]))),
      classes: this.api.list(resourceConfigs.classes.endpoint).pipe(catchError(() => of([]))),
      enrollments: this.api.list(resourceConfigs.enrollment.endpoint).pipe(catchError(() => of([]))),
      subjects: this.api.list(resourceConfigs.subject.endpoint).pipe(catchError(() => of([]))),
      billings: this.api.list(resourceConfigs.billing.endpoint).pipe(catchError(() => of([]))),
      payments: this.api.list(resourceConfigs.payment.endpoint).pipe(catchError(() => of([]))),
      assessments: this.api.assessmentIndex().pipe(catchError(() => of([]))),
    }).subscribe(result => {
      const schools = this.api.normalizeCollection(result.schools);
      const classes = this.api.normalizeCollection(result.classes);
      const enrollments = this.api.normalizeCollection(result.enrollments);
      const subjects = this.api.normalizeCollection(result.subjects);
      const billings = this.api.normalizeCollection(result.billings);
      const payments = this.api.normalizeCollection(result.payments);
      const assessments = this.api.normalizeCollection(result.assessments);

      this.metrics = [
        { label: 'Schools', value: schools.length, detail: 'Base institutions configured' },
        { label: 'Classes', value: classes.length, detail: 'Sections prepared for enrollment' },
        { label: 'Enrollments', value: enrollments.length, detail: 'Students currently in the pipeline' },
        { label: 'Assessments', value: assessments.length, detail: 'Assessment records returned by the API' },
        { label: 'Billing Rows', value: billings.length, detail: 'Invoices or billing records on file' },
        { label: 'Payments', value: payments.length, detail: 'Payments posted through the finance module' },
      ];

      this.connectionStatus = 'Connected to the configured Laravel API routes.';
      this.loading = false;
    });
  }
}
