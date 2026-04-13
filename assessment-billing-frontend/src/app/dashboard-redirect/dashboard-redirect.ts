import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-dashboard-redirect',
  template: '',
})
export class DashboardRedirect {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  constructor() {
    const role = this.authStore.role();
    void this.router.navigateByUrl(role ? `/dashboard/${role}` : '/auth');
  }
}
