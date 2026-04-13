import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api, ApiRecord } from '../api';
import { WorkflowService } from '../workflow.service';

interface WorkflowEnrollmentView {
  studentId: string;
  name: string;
  firstName: string;
  lastName: string;
  program: string;
  course: string;
  totalFees: number;
}

interface WorkflowBillingView {
  studentId: string;
  invoiceNumber: string;
  paymentMethod: string;
  paymentChannel: string;
  paymentPlan: string;
  amountPaid: number;
  amount: number;
  balanceDue: number;
}

@Component({
  selector: 'app-billing',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './billing.html',
  styleUrl: './billing.scss',
})
export class Billing {
  billingForm: FormGroup;
  billings: WorkflowBillingView[] = [];
  loading = false;
  students: WorkflowEnrollmentView[] = [];
  readonly creditCardOptions = ['BDO', 'BPI', 'Union Bank'];
  readonly onlinePaymentOptions = ['GCash', 'Maya', 'PayPal'];
  readonly bankPaymentOptions = ['BDO', 'BPI', 'Union Bank', 'Landbank'];
  currentInvoiceNumber = this.generateInvoiceNumber();
  invoicePreview = {
    totalFees: 0,
    priorPayments: 0,
    amountPaid: 0,
    balanceDue: 0,
  };
  totalFeesMessage = 'Select a student to load the approved total fees.';

  constructor(
    private fb: FormBuilder,
    private api: Api,
    public workflow: WorkflowService,
  ) {
    this.billingForm = this.fb.group({
      studentId: ['', Validators.required],
      description: ['Enrollment Invoice', Validators.required],
      totalFees: [0, [Validators.required, Validators.min(0)]],
      amountPaid: [0, [Validators.required, Validators.min(0)]],
      paymentMethod: ['Credit Card', Validators.required],
      paymentProvider: [''],
      paymentPlan: ['Full Payment', Validators.required],
      statementMonth: ['Current Term', Validators.required],
    });

    this.billingForm.valueChanges.subscribe(() => this.updateInvoicePreview());
    this.billingForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      const providerControl = this.billingForm.get('paymentProvider');
      if (method === 'Credit Card' || method === 'Online Payment' || method === 'Bank Payment') {
        providerControl?.setValidators([Validators.required]);
      } else {
        providerControl?.clearValidators();
        this.billingForm.patchValue({ paymentProvider: '' }, { emitEvent: false });
      }
      providerControl?.updateValueAndValidity({ emitEvent: false });
    });
    this.loadStudents();
    this.loadBillings();
  }

  loadStudents() {
    this.api.getEnrollments().subscribe(data => {
      this.students = data.map(item => this.mapStudent(item));
      this.workflow.refreshEnrollments();
    });
  }

  loadBillings() {
    this.api.getBillings().subscribe(data => {
      this.billings = data.map(item => this.mapBilling(item));
      this.workflow.refreshBillings();
      this.updateInvoicePreview();
    });
  }

  onStudentChange(studentId: string) {
    const student = this.students.find(item => item.studentId === studentId);
    const totalFees = this.resolveStudentTotalFees(studentId);
    this.currentInvoiceNumber = this.generateInvoiceNumber(studentId);
    this.billingForm.patchValue(
      {
        totalFees,
        description: student ? `${student.course || student.program} enrollment billing` : 'Enrollment Invoice',
      },
      { emitEvent: false },
    );
    this.totalFeesMessage = student
      ? 'This amount comes from the saved student/admin fee record and cannot be edited here.'
      : 'Select a student to load the approved total fees.';
    this.updateInvoicePreview();
  }

  updateInvoicePreview() {
    const studentId = this.billingForm.value.studentId;
    const totalFees = this.resolveStudentTotalFees(studentId);
    if (studentId && Number(this.billingForm.value.totalFees || 0) !== totalFees) {
      this.billingForm.patchValue({ totalFees }, { emitEvent: false });
    }
    const amountPaid = Number(this.billingForm.value.amountPaid || 0);
    const priorPayments = this.billings
      .filter(item => item.studentId === studentId)
      .reduce((sum, item) => sum + Number(item.amountPaid ?? item.amount ?? 0), 0);

    this.invoicePreview = {
      totalFees,
      priorPayments,
      amountPaid,
      balanceDue: Math.max(totalFees - priorPayments - amountPaid, 0),
    };
  }

  generateInvoiceNumber(studentId = 'GEN') {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${studentId}-${stamp}`;
  }

  onSubmit() {
    if (this.billingForm.invalid) {
      this.billingForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const lockedTotalFees = this.resolveStudentTotalFees(this.billingForm.value.studentId);
    this.billingForm.patchValue({ totalFees: lockedTotalFees }, { emitEvent: false });
    const payload = {
      ...this.billingForm.value,
      totalFees: lockedTotalFees,
      amount: this.billingForm.value.amountPaid,
      paymentChannel: this.billingForm.value.paymentProvider || this.billingForm.value.paymentMethod,
      invoiceNumber: this.currentInvoiceNumber,
      balanceDue: this.invoicePreview.balanceDue,
    };

    this.api.postBilling(payload).subscribe({
      next: () => {
        this.loadBillings();
        const retainedStudentId = this.billingForm.value.studentId;
        const retainedTotalFees = this.billingForm.value.totalFees;
        this.currentInvoiceNumber = this.generateInvoiceNumber(retainedStudentId || 'GEN');
        this.billingForm.reset({
          studentId: retainedStudentId,
          description: 'Enrollment Invoice',
          totalFees: retainedTotalFees,
          amountPaid: 0,
          paymentMethod: 'Credit Card',
          paymentProvider: '',
          paymentPlan: 'Full Payment',
          statementMonth: 'Current Term',
        });
        this.updateInvoicePreview();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get paymentProviderOptions(): string[] {
    const method = this.billingForm.value.paymentMethod;
    if (method === 'Credit Card') {
      return this.creditCardOptions;
    }
    if (method === 'Online Payment') {
      return this.onlinePaymentOptions;
    }
    if (method === 'Bank Payment') {
      return this.bankPaymentOptions;
    }
    return [];
  }

  get paymentProviderLabel(): string {
    const method = this.billingForm.value.paymentMethod;
    if (method === 'Credit Card') {
      return 'Credit Card Option';
    }
    if (method === 'Online Payment') {
      return 'Online Payment Option';
    }
    if (method === 'Bank Payment') {
      return 'Bank Payment Option';
    }
    return 'Payment Option';
  }

  private resolveStudentTotalFees(studentId: string): number {
    const student = this.students.find(item => item.studentId === studentId);
    return Number(student?.totalFees || 0);
  }

  private mapStudent(item: ApiRecord): WorkflowEnrollmentView {
    return {
      studentId: this.readText(item, 'studentId', 'student_id'),
      name: this.readText(item, 'name'),
      firstName: this.readText(item, 'firstName', 'first_name'),
      lastName: this.readText(item, 'lastName', 'last_name'),
      program: this.readText(item, 'program'),
      course: this.readText(item, 'course'),
      totalFees: this.readNumber(item, 'totalFees', 'total_fees'),
    };
  }

  private mapBilling(item: ApiRecord): WorkflowBillingView {
    return {
      studentId: this.readText(item, 'studentId', 'student_id'),
      invoiceNumber: this.readText(item, 'invoiceNumber', 'invoice_no'),
      paymentMethod: this.readText(item, 'paymentMethod', 'method'),
      paymentChannel: this.readText(item, 'paymentChannel', 'payment_channel'),
      paymentPlan: this.readText(item, 'paymentPlan', 'payment_plan'),
      amountPaid: this.readNumber(item, 'amountPaid', 'amount_paid'),
      amount: this.readNumber(item, 'amount', 'total_amount'),
      balanceDue: this.readNumber(item, 'balanceDue', 'balance_due'),
    };
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
