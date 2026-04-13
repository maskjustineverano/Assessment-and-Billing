import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppRole, AuthStore } from './auth.store';

type SidebarItem = {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
};

const sidebarItemsByRole: Record<AppRole, SidebarItem[]> = {
  admin: [
    { label: 'Schools', path: '/resources/school', icon: 'SC' },
    { label: 'Classes', path: '/resources/classes', icon: 'CL' },
    { label: 'Enrollment', path: '/enrollment', icon: 'EN' },
    { label: 'Subjects', path: '/resources/subject', icon: 'SU' },
    { label: 'Teachers', path: '/resources/teacher-subject', icon: 'TE' },
    { label: 'Assignments', path: '/resources/assignment', icon: 'AS' },
    { label: 'Grades', path: '/resources/grade', icon: 'GR' },
    { label: 'Fees', path: '/resources/fees', icon: 'FE' },
    { label: 'Billing', path: '/billing', icon: 'BI' },
  ],
  teacher: [
    { label: 'Dashboard', path: '/dashboard/teacher', icon: 'DB', exact: true },
    { label: 'Classes', path: '/resources/classes', icon: 'CL' },
    { label: 'Subjects', path: '/resources/subject', icon: 'SU' },
    { label: 'Teachers', path: '/resources/teacher-subject', icon: 'TE' },
    { label: 'Assignments', path: '/resources/assignment', icon: 'AS' },
    { label: 'Grades', path: '/resources/grade', icon: 'GR' },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard/student', icon: 'DB', exact: true },
    { label: 'Enrollment', path: '/assessment', icon: 'EN' },
    { label: 'Subjects', path: '/resources/subject', icon: 'SU' },
    { label: 'Assignments', path: '/resources/assignment', icon: 'AS' },
    { label: 'Fees', path: '/billing', icon: 'FE' },
  ],
};

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(
    public authStore: AuthStore,
    readonly router: Router,
  ) {}

  isAuthLayout(): boolean {
    return this.router.url === '/' || this.router.url.startsWith('/auth');
  }

  sidebarItems(): SidebarItem[] {
    const role = this.authStore.role();
    return role ? sidebarItemsByRole[role] : [];
  }

  roleLabel(): string {
    const role = this.authStore.role();
    return role ? `${role} management` : 'workspace';
  }
}
