import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api } from './api';

export interface EnrollmentRecord {
  id?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  email?: string;
  program?: string;
  course?: string;
  classes?: string[];
  tuition?: number;
  fees?: number;
  discount?: number;
  totalFees?: number;
  status?: string;
}

export interface AssessmentRecord {
  id?: number;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  course?: string;
  subject?: string;
  grade?: string;
  remarks?: string;
  approvalStatus?: string;
}

export interface BillingRecord {
  id?: number;
  studentId?: string;
  invoiceNumber?: string;
  description?: string;
  amount?: number;
  amountPaid?: number;
  totalFees?: number;
  balanceDue?: number;
  paymentMethod?: string;
  paymentPlan?: string;
  statementMonth?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private readonly enrollmentsSubject = new BehaviorSubject<EnrollmentRecord[]>([]);
  private readonly assessmentsSubject = new BehaviorSubject<AssessmentRecord[]>([]);
  private readonly billingsSubject = new BehaviorSubject<BillingRecord[]>([]);

  readonly enrollments$ = this.enrollmentsSubject.asObservable();
  readonly assessments$ = this.assessmentsSubject.asObservable();
  readonly billings$ = this.billingsSubject.asObservable();

  constructor(private api: Api) {}

  loadAll() {
    forkJoin({
      enrollments: this.api.getEnrollments().pipe(catchError(() => of([]))),
      assessments: this.api.getAssessments().pipe(catchError(() => of([]))),
      billings: this.api.getBillings().pipe(catchError(() => of([]))),
    }).subscribe(({ enrollments, assessments, billings }) => {
      this.enrollmentsSubject.next(enrollments);
      this.assessmentsSubject.next(assessments);
      this.billingsSubject.next(billings);
    });
  }

  refreshEnrollments() {
    this.api
      .getEnrollments()
      .pipe(catchError(() => of([])))
      .subscribe(data => this.enrollmentsSubject.next(data));
  }

  refreshAssessments() {
    this.api
      .getAssessments()
      .pipe(catchError(() => of([])))
      .subscribe(data => this.assessmentsSubject.next(data));
  }

  refreshBillings() {
    this.api
      .getBillings()
      .pipe(catchError(() => of([])))
      .subscribe(data => this.billingsSubject.next(data));
  }

  get enrollments(): EnrollmentRecord[] {
    return this.enrollmentsSubject.value;
  }

  get assessments(): AssessmentRecord[] {
    return this.assessmentsSubject.value;
  }

  get billings(): BillingRecord[] {
    return this.billingsSubject.value;
  }

  get totalFees(): number {
    return this.enrollments.reduce((sum, item) => sum + Number(item.totalFees || 0), 0);
  }

  get paymentsReceived(): number {
    return this.billings.reduce((sum, item) => sum + Number(item.amountPaid ?? item.amount ?? 0), 0);
  }

  get balanceDue(): number {
    return Math.max(this.totalFees - this.paymentsReceived, 0);
  }
}
