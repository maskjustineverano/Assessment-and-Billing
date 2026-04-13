import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api, ApiRecord } from '../api';
import { WorkflowService } from '../workflow.service';

interface WorkflowEnrollmentView {
  name: string;
  firstName: string;
  lastName: string;
  studentId: string;
  course: string;
  program: string;
  totalFees: number;
  status: string;
}

interface EnrollmentFeeSetup {
  tuitionFee: number;
}

@Component({
  selector: 'app-enrollment',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './enrollment.html',
  styleUrl: './enrollment.scss',
})
export class Enrollment {
  enrollmentForm: FormGroup;
  enrollments: WorkflowEnrollmentView[] = [];
  loading = false;
  feeSetupMessage = 'Loading admin tuition fee setup...';
  feeSetup: EnrollmentFeeSetup = {
    tuitionFee: 0,
  };

  readonly programs = [
    { value: 'computer-science', label: 'Computer Science' },
    { value: 'business-admin', label: 'Business Administration' },
    { value: 'education', label: 'Education' },
  ];

  readonly classOptions = [
    { value: 'mathematics', label: 'Mathematics', fee: 250 },
    { value: 'science-lab', label: 'Science Lab', fee: 340 },
    { value: 'english-comms', label: 'English Communication', fee: 180 },
    { value: 'ict-workshop', label: 'ICT Workshop', fee: 420 },
  ];

  feePreview = {
    tuition: 0,
    fees: 0,
    discount: 0,
    total: 0,
  };

  constructor(
    private fb: FormBuilder,
    private api: Api,
    public workflow: WorkflowService,
  ) {
    this.enrollmentForm = this.fb.group({
      studentId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      program: ['', Validators.required],
      academicLevel: ['Freshman', Validators.required],
      classes: [[], Validators.required],
      discountPercent: [0],
    });

    this.enrollmentForm.valueChanges.subscribe(() => this.updateFeePreview());
    this.updateFeePreview();
    this.loadEnrollments();
    this.loadFeeSetup();
  }

  loadEnrollments() {
    this.api.getEnrollments().subscribe(data => {
      this.enrollments = data.map(item => this.mapEnrollment(item));
      this.workflow.refreshEnrollments();
    });
  }

  loadFeeSetup() {
    this.api.getFees().subscribe({
      next: data => {
        this.feeSetup = this.extractFeeSetup(data);
        this.feeSetupMessage = this.feeSetup.tuitionFee > 0
          ? 'Tuition is coming from the admin fee setup.'
          : 'No admin tuition fee has been set yet.';
        this.updateFeePreview();
      },
      error: () => {
        this.feeSetup = { tuitionFee: 0 };
        this.feeSetupMessage = 'Unable to load the admin tuition fee setup.';
        this.updateFeePreview();
      },
    });
  }

  toggleClassSelection(courseValue: string, checked: boolean) {
    const current = [...(this.enrollmentForm.value.classes ?? [])];
    const updated = checked ? [...new Set([...current, courseValue])] : current.filter(value => value !== courseValue);
    this.enrollmentForm.patchValue({ classes: updated });
  }

  updateFeePreview() {
    const selectedClasses = (this.enrollmentForm.value.classes ?? []) as string[];
    const classFees = this.classOptions
      .filter(option => selectedClasses.includes(option.value))
      .reduce((sum, option) => sum + option.fee, 0);

    const tuition = this.feeSetup.tuitionFee;
    const discountPercent = Number(this.enrollmentForm.value.discountPercent || 0);
    const discount = ((tuition + classFees) * discountPercent) / 100;
    const total = tuition + classFees - discount;

    this.feePreview = {
      tuition,
      fees: classFees,
      discount,
      total,
    };
  }

  isClassSelected(courseValue: string): boolean {
    return (this.enrollmentForm.value.classes ?? []).includes(courseValue);
  }

  onSubmit() {
    if (this.enrollmentForm.invalid) {
      this.enrollmentForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const value = this.enrollmentForm.value;
    const payload = {
      studentId: value.studentId,
      firstName: value.firstName,
      lastName: value.lastName,
      name: `${value.firstName} ${value.lastName}`,
      email: value.email,
      program: value.program,
      course: this.programs.find(program => program.value === value.program)?.label ?? value.program,
      academicLevel: value.academicLevel,
      classes: value.classes,
      tuition: this.feePreview.tuition,
      fees: this.feePreview.fees,
      discount: this.feePreview.discount,
      totalFees: this.feePreview.total,
      status: 'Pending Assessment',
    };

    this.api.postEnrollment(payload).subscribe({
      next: () => {
        this.loadEnrollments();
        this.enrollmentForm.reset({
          academicLevel: 'Freshman',
          classes: [],
          discountPercent: 0,
        });
        this.updateFeePreview();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private mapEnrollment(item: ApiRecord): WorkflowEnrollmentView {
    return {
      name: this.readText(item, 'name'),
      firstName: this.readText(item, 'firstName', 'first_name'),
      lastName: this.readText(item, 'lastName', 'last_name'),
      studentId: this.readText(item, 'studentId', 'student_id'),
      course: this.readText(item, 'course'),
      program: this.readText(item, 'program'),
      totalFees: this.readNumber(item, 'totalFees', 'total_fees'),
      status: this.readText(item, 'status'),
    };
  }

  private extractFeeSetup(records: ApiRecord[]): EnrollmentFeeSetup {
    for (const record of records) {
      const amount = this.readNumber(record, 'amount', 'fee_amount', 'value');
      if (amount <= 0) {
        continue;
      }

      const lookupText = [
        this.readText(record, 'name'),
        this.readText(record, 'category'),
        this.readText(record, 'description'),
      ]
        .join(' ')
        .toLowerCase();

      if (lookupText.includes('tuition')) {
        return { tuitionFee: amount };
      }
    }

    return { tuitionFee: 0 };
  }

  private readText(record: ApiRecord, ...keys: string[]): string {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }

      if (typeof value === 'number') {
        return String(value);
      }
    }

    return '';
  }

  private readNumber(record: ApiRecord, ...keys: string[]): number {
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
}
