import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Assessment } from './assessment';

describe('Assessment', () => {
  let component: Assessment;
  let fixture: ComponentFixture<Assessment>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Assessment],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Assessment);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    httpTesting.expectOne('http://127.0.0.1:8000/api/enrollment').flush([]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/assessment').flush([]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/fees').flush([]);
    expect(component).toBeTruthy();
  });

  it('should use admin fee setup values for the assessment form', () => {
    httpTesting.expectOne('http://127.0.0.1:8000/api/enrollment').flush([
      {
        student_id: 'STU-1',
        total_fees: 9000,
      },
    ]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/assessment').flush([]);
    httpTesting.expectOne('http://127.0.0.1:8000/api/fees').flush([
      { name: 'Tuition Fee', amount: 5000 },
      { name: 'Miscellaneous Fee', amount: 1200 },
      { name: 'Laboratory Fee', amount: 800 },
    ]);

    component.onStudentChange('STU-1');

    expect(component.assessmentForm['tuition_fee']).toBe('5000');
    expect(component.assessmentForm['miscellaneous_fee']).toBe('1200');
    expect(component.assessmentForm['laboratory_fee']).toBe('800');
  });
});
