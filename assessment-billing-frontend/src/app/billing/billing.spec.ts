import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Billing } from './billing';
import { WorkflowService } from '../workflow.service';

describe('Billing', () => {
  let component: Billing;
  let fixture: ComponentFixture<Billing>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Billing],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: WorkflowService,
          useValue: {
            paymentsReceived: 0,
            totalFees: 0,
            balanceDue: 0,
            refreshEnrollments: () => undefined,
            refreshBillings: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Billing);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    httpTesting.expectOne('http://127.0.0.1:8000/api/enrollment').flush([]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/billing').flush([]);
    expect(component).toBeTruthy();
  });

  it('should normalize snake_case billing data for the UI preview', () => {
    httpTesting.expectOne('http://127.0.0.1:8000/api/enrollment').flush([
      {
        student_id: 'STU-9',
        first_name: 'Noah',
        last_name: 'Ray',
        total_fees: 4500,
      },
    ]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/billing').flush([
      {
        student_id: 'STU-9',
        invoice_no: 'INV-STU-9-20260413',
        amount_paid: 500,
        balance_due: 4000,
      },
    ]);

    component.billingForm.patchValue({ studentId: 'STU-9', totalFees: 4500, amountPaid: 500 });
    component.updateInvoicePreview();

    expect(component.students[0]?.studentId).toBe('STU-9');
    expect(component.billings[0]?.invoiceNumber).toBe('INV-STU-9-20260413');
    expect(component.invoicePreview.priorPayments).toBe(500);
  });
});
