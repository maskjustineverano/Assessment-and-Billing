import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthStore } from './auth.store';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should hide the workspace shell on auth routes', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-shell')).toBeNull();
  });

  it('should return sidebar items for the stored role', () => {
    const fixture = TestBed.createComponent(App);
    const authStore = TestBed.inject(AuthStore);

    authStore.setRole('admin');

    const sidebarLabels = fixture.componentInstance.sidebarItems().map(item => item.label);

    expect(sidebarLabels).toContain('Enrollment');
    expect(sidebarLabels).toContain('Billing');
  });
});
