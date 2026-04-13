import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore, AppRole } from '../auth.store';

type DashboardCard = {
  label: string;
  value: string;
  detail: string;
};

type QuickLink = {
  label: string;
  path: string;
};

type RoleStat = {
  label: string;
  value: string;
};

type RoleDashboardConfig = {
  eyebrow: string;
  brandLabel: string;
  title: string;
  description: string;
  highlight: string;
  roleIconPath: string;
  focusTitle: string;
  focusText: string;
  stats: RoleStat[];
  cards: DashboardCard[];
  links: QuickLink[];
};

const roleDashboardConfigs: Record<AppRole, RoleDashboardConfig> = {
  student: {
    eyebrow: 'Student Dashboard',
    brandLabel: 'Academic Atelier',
    title: 'Track assignments, submissions, and billing in one place.',
    description: 'Students can review class work, submit requirements, and monitor their assessment and payment status.',
    highlight: 'Student access is limited to student workflows only.',
    roleIconPath: 'roles/student.png',
    focusTitle: 'Student workspace',
    focusText: 'Built for class tasks, assessment visibility, and payment tracking without exposing teacher or admin tools.',
    stats: [
      { label: 'Role', value: 'Student' },
      { label: 'Access', value: 'Exclusive' },
      { label: 'Mode', value: 'Portal' },
    ],
    cards: [
      { label: 'Assignments', value: 'Open', detail: 'View assigned tasks and due dates.' },
      { label: 'Submissions', value: 'Ready', detail: 'Submit files and monitor feedback.' },
      { label: 'Assessment', value: 'Visible', detail: 'Check your current assessment breakdown.' },
      { label: 'Billing', value: 'Visible', detail: 'Review fee totals and posted payments.' },
    ],
    links: [
      { label: 'Assessment', path: '/assessment' },
      { label: 'Assignments', path: '/resources/assignment' },
      { label: 'Submissions', path: '/resources/assignment' },
      { label: 'Billing', path: '/billing' },
    ],
  },
  teacher: {
    eyebrow: 'Teacher Dashboard',
    brandLabel: 'Academic Atelier',
    title: 'Manage classes, assignments, and grading with role-based access.',
    description: 'Teachers can publish assignments, update grades, and work within their class-related academic tools.',
    highlight: 'Teacher access is limited to teacher workflows only.',
    roleIconPath: 'roles/teacher.png',
    focusTitle: 'Teacher workspace',
    focusText: 'Designed for assignment publishing, subject handling, and grading while keeping admin-only controls hidden.',
    stats: [
      { label: 'Role', value: 'Teacher' },
      { label: 'Access', value: 'Exclusive' },
      { label: 'Mode', value: 'Academic' },
    ],
    cards: [
      { label: 'Assignments', value: 'Manage', detail: 'Create, edit, and review assigned work.' },
      { label: 'Grades', value: 'Manage', detail: 'Update student grades and academic records.' },
      { label: 'Classes', value: 'Shared', detail: 'View classes available to teachers and admins.' },
      { label: 'Subjects', value: 'Active', detail: 'Review teacher-subject loads and schedules.' },
    ],
    links: [
      { label: 'Classes', path: '/resources/classes' },
      { label: 'Assignments', path: '/resources/assignment' },
      { label: 'Grades', path: '/resources/grade' },
      { label: 'Teacher Load', path: '/resources/teacher-subject' },
    ],
  },
  admin: {
    eyebrow: 'Admin Dashboard',
    brandLabel: 'Academic Atelier',
    title: 'Oversee school setup, user roles, enrollment, and finance operations.',
    description: 'Admins can maintain the core system setup and access the broadest management tools across the platform.',
    highlight: 'Admin access is limited to admin-approved management workflows.',
    roleIconPath: 'roles/admin.png',
    focusTitle: 'Admin workspace',
    focusText: 'Structured for system oversight, user-role control, enrollment supervision, and finance management.',
    stats: [
      { label: 'Role', value: 'Admin' },
      { label: 'Access', value: 'Exclusive' },
      { label: 'Mode', value: 'Control' },
    ],
    cards: [
      { label: 'School', value: 'Manage', detail: 'Update school profile and system records.' },
      { label: 'Roles', value: 'Manage', detail: 'Control role and user-role assignments.' },
      { label: 'Enrollment', value: 'Live', detail: 'Monitor student enrollment and assessments.' },
      { label: 'Finance', value: 'Active', detail: 'Access fees, billing, and payment records.' },
    ],
    links: [
      { label: 'School', path: '/resources/school' },
      { label: 'Roles', path: '/resources/role' },
      { label: 'Enrollment', path: '/enrollment' },
      { label: 'Billing', path: '/billing' },
    ],
  },
};

@Component({
  selector: 'app-role-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './role-dashboard.html',
  styleUrl: './role-dashboard.scss',
})
export class RoleDashboard {
  private readonly route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);

  readonly role = computed(() => (this.route.snapshot.data['role'] as AppRole | undefined) ?? 'student');
  readonly config = computed(() => roleDashboardConfigs[this.role()]);
}
