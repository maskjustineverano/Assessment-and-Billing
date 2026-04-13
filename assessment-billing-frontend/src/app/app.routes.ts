import { Routes } from '@angular/router';
import { resourceRoleGuard, roleGuard } from './role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/auth').then(m => m.AuthPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard-redirect/dashboard-redirect').then(m => m.DashboardRedirect),
  },
  {
    path: 'dashboard/student',
    canActivate: [roleGuard],
    data: { roles: ['student'], role: 'student' },
    loadComponent: () => import('./role-dashboard/role-dashboard').then(m => m.RoleDashboard),
  },
  {
    path: 'dashboard/teacher',
    canActivate: [roleGuard],
    data: { roles: ['teacher'], role: 'teacher' },
    loadComponent: () => import('./role-dashboard/role-dashboard').then(m => m.RoleDashboard),
  },
  {
    path: 'dashboard/admin',
    canActivate: [roleGuard],
    data: { roles: ['admin'], role: 'admin' },
    loadComponent: () => import('./role-dashboard/role-dashboard').then(m => m.RoleDashboard),
  },
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth').then(m => m.AuthPage),
  },
  {
    path: 'assessment',
    canActivate: [roleGuard],
    data: { roles: ['student', 'admin'] },
    loadComponent: () => import('./assessment/assessment').then(m => m.Assessment),
  },
  {
    path: 'enrollment',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./enrollment/enrollment').then(m => m.Enrollment),
  },
  {
    path: 'billing',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'student'] },
    loadComponent: () => import('./billing/billing').then(m => m.Billing),
  },
  {
    path: 'resources/:resourceKey',
    canActivate: [resourceRoleGuard],
    loadComponent: () => import('./resource-page/resource-page').then(m => m.ResourcePage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
