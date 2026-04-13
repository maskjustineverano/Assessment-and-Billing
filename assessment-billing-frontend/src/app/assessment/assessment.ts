import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, ApiRecord } from '../api';

@Component({
  selector: 'app-assessment',
  imports: [CommonModule, FormsModule],
  templateUrl: './assessment.html',
  styleUrl: './assessment.scss',
})
export class Assessment {
  private readonly api = inject(Api);

  loading = false;
  message = '';
  errorMessage = '';
  students: ApiRecord[] = [];
  assessments: ApiRecord[] = [];
  feeSetupMessage = '';
  selectedStudentId = '';
  selectedStudent: ApiRecord | null = null;
  selectedAssessment: ApiRecord | null = null;
  breakdown: ApiRecord | null = null;
  feeSetup: AssessmentFeeSetup = {
    tuitionFee: 0,
    miscellaneousFee: 0,
    laboratoryFee: 0,
  };

  readonly assessmentForm: Record<string, string> = {
    school_year: '',
    semester: '',
    tuition_fee: '',
    miscellaneous_fee: '',
    laboratory_fee: '',
    discount_percent: '',
    notes: '',
  };

  readonly scholarshipForm: Record<string, string> = {
    scholarship_name: '',
    amount: '',
    percentage: '',
    remarks: '',
  };

  constructor() {
    this.loadStudents();
    this.loadAssessments();
    this.loadFeeSetup();
  }

  loadStudents(): void {
    this.api.list('/enrollment').subscribe({
      next: response => {
        this.students = this.api.normalizeCollection(response);
      },
      error: () => {
        this.students = [];
      },
    });
  }

  loadAssessments(): void {
    this.loading = true;
    this.api.assessmentIndex().subscribe({
      next: response => {
        this.assessments = this.api.normalizeCollection(response);
        this.loading = false;
      },
      error: () => {
        this.assessments = [];
        this.loading = false;
      },
    });
  }

  loadFeeSetup(): void {
    this.api.getFees().subscribe({
      next: response => {
        this.feeSetup = this.extractFeeSetup(response);
        this.feeSetupMessage = this.hasConfiguredFees()
          ? 'Fee amounts are coming from the admin fee setup.'
          : 'No admin fee setup was found yet. Student totals will be used when available.';
        this.applyFeeSetupToForm();
      },
      error: () => {
        this.feeSetup = {
          tuitionFee: 0,
          miscellaneousFee: 0,
          laboratoryFee: 0,
        };
        this.feeSetupMessage = 'Unable to load the admin fee setup right now.';
        this.applyFeeSetupToForm();
      },
    });
  }

  onStudentChange(studentId: string): void {
    this.selectedStudentId = studentId;
    this.selectedStudent = this.students.find(student => this.readStudentId(student) === studentId) ?? null;
    this.selectedAssessment = null;
    this.breakdown = null;
    this.applyFeeSetupToForm();
  }

  createAssessment(): void {
    if (!this.selectedStudentId) {
      this.errorMessage = 'Select a student before creating an assessment.';
      return;
    }

    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api.assessmentStore(this.selectedStudentId, this.buildPayload(this.assessmentForm)).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Assessment saved successfully.';
        this.loadAssessments();
        this.loadAssessmentDetails();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to save assessment data for the selected student.';
      },
    });
  }

  applyScholarship(): void {
    if (!this.selectedStudentId) {
      this.errorMessage = 'Select a student before applying scholarship data.';
      return;
    }

    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api.assessmentApplyScholarship(this.selectedStudentId, this.buildPayload(this.scholarshipForm)).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Scholarship applied successfully.';
        this.loadAssessmentDetails();
        this.loadBreakdown();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to apply scholarship for the selected student.';
      },
    });
  }

  loadAssessmentDetails(): void {
    if (!this.selectedStudentId) {
      return;
    }

    this.api.assessmentShow(this.selectedStudentId).subscribe({
      next: response => {
        this.selectedAssessment = this.api.normalizeRecord(response);
      },
      error: () => {
        this.selectedAssessment = null;
      },
    });
  }

  loadBreakdown(): void {
    if (!this.selectedStudentId) {
      return;
    }

    this.api.assessmentBreakdown(this.selectedStudentId).subscribe({
      next: response => {
        this.breakdown = this.api.normalizeRecord(response);
      },
      error: () => {
        this.breakdown = null;
      },
    });
  }

  entries(record: ApiRecord | null): Array<{ key: string; value: string }> {
    if (!record) {
      return [];
    }

    return Object.entries(record).map(([key, value]) => ({
      key,
      value: this.displayValue(value),
    }));
  }

  displayValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  private readStudentId(student: ApiRecord): string {
    const studentId = student['student_id'] ?? student['studentId'];
    return typeof studentId === 'string' || typeof studentId === 'number' ? String(studentId) : '';
  }

  private applyFeeSetupToForm(): void {
    const fallbackTuition = this.numericValue(this.selectedStudent?.['tuition'] ?? this.selectedStudent?.['total_fees'] ?? this.selectedStudent?.['totalFees']);

    this.assessmentForm['tuition_fee'] = this.resolveFeeValue(this.feeSetup.tuitionFee, fallbackTuition);
    this.assessmentForm['miscellaneous_fee'] = this.resolveFeeValue(this.feeSetup.miscellaneousFee, 0);
    this.assessmentForm['laboratory_fee'] = this.resolveFeeValue(this.feeSetup.laboratoryFee, 0);
  }

  private resolveFeeValue(primaryValue: number, fallbackValue: number): string {
    const resolvedValue = primaryValue > 0 ? primaryValue : fallbackValue;
    return resolvedValue > 0 ? String(resolvedValue) : '';
  }

  private extractFeeSetup(records: ApiRecord[]): AssessmentFeeSetup {
    const feeSetup: AssessmentFeeSetup = {
      tuitionFee: 0,
      miscellaneousFee: 0,
      laboratoryFee: 0,
    };

    for (const record of records) {
      const amount = this.readNumericValue(record, 'amount', 'fee_amount', 'value');
      if (amount <= 0) {
        continue;
      }

      const lookupText = [
        this.readTextValue(record, 'name'),
        this.readTextValue(record, 'category'),
        this.readTextValue(record, 'description'),
      ]
        .join(' ')
        .toLowerCase();

      if (!feeSetup.tuitionFee && lookupText.includes('tuition')) {
        feeSetup.tuitionFee = amount;
        continue;
      }

      if (!feeSetup.miscellaneousFee && lookupText.includes('misc')) {
        feeSetup.miscellaneousFee = amount;
        continue;
      }

      if (!feeSetup.laboratoryFee && (lookupText.includes('laboratory') || lookupText.includes('lab'))) {
        feeSetup.laboratoryFee = amount;
      }
    }

    return feeSetup;
  }

  hasConfiguredFees(): boolean {
    return this.feeSetup.tuitionFee > 0 || this.feeSetup.miscellaneousFee > 0 || this.feeSetup.laboratoryFee > 0;
  }

  private readTextValue(record: ApiRecord, ...keys: string[]): string {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private readNumericValue(record: ApiRecord, ...keys: string[]): number {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number') {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const numericValue = Number(value);
        if (!Number.isNaN(numericValue)) {
          return numericValue;
        }
      }
    }

    return 0;
  }

  private buildPayload(source: Record<string, string>): ApiRecord {
    const payload: ApiRecord = {};

    for (const [key, value] of Object.entries(source)) {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        continue;
      }

      payload[key] = this.isNumericField(key) ? Number(trimmedValue) : trimmedValue;
    }

    return payload;
  }

  private isNumericField(key: string): boolean {
    return key.includes('fee') || key.includes('amount') || key.includes('percent') || key.includes('percentage');
  }

  private numericValue(value: unknown): number {
    return typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;
  }
}

interface AssessmentFeeSetup {
  tuitionFee: number;
  miscellaneousFee: number;
  laboratoryFee: number;
}
