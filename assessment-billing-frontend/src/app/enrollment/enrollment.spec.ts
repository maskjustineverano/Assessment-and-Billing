import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Enrollment } from './enrollment';
import { WorkflowService } from '../workflow.service';

describe('Enrollment', () => {
  let component: Enrollment;
  let fixture: ComponentFixture<Enrollment>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Enrollment],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: WorkflowService,
          useValue: {
            refreshEnrollments: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Enrollment);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    httpTesting.expectOne('http://127.0.0.1:8000/api/enrollment').flush([]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/fees').flush([]);
    expect(component).toBeTruthy();
  });

  it('should normalize enrollment records from snake_case payloads', () => {
    httpTesting.expectOne('http://127.0.0.1:8000/api/enrollment').flush([
      {
        student_id: 'STU-1',
        first_name: 'Ava',
        last_name: 'Stone',
        program: 'computer-science',
        course: 'Computer Science',
        total_fees: 3770,
        status: 'Pending Assessment',
      },
    ]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/fees').flush([]);

    expect(component.enrollments[0]?.studentId).toBe('STU-1');
    expect(component.enrollments[0]?.firstName).toBe('Ava');
    expect(component.enrollments[0]?.totalFees).toBe(3770);
  });

  it('should use the admin tuition fee in the student total fees preview', () => {
    httpTesting.expectOne('http://127.0.0.1:8000/api/enrollment').flush([]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/fees').flush([
      { name: 'Tuition Fee', amount: 5000 },
    ]);

    component.enrollmentForm.patchValue({
      program: 'computer-science',
      classes: ['mathematics', 'science-lab'],
      discountPercent: 10,
    });

    expect(component.feePreview.tuition).toBe(5000);
    expect(component.feePreview.fees).toBe(590);
    expect(component.feePreview.total).toBe(5031);
  });
});
