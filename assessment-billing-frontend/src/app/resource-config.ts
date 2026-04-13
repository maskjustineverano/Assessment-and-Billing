import { AppRole } from './auth.store';

export interface ResourceFieldOption {
  label: string;
  value: string;
}

export interface ResourceField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date';
  placeholder?: string;
  options?: ResourceFieldOption[];
}

export interface ResourceConfig {
  key: ResourceKey;
  title: string;
  endpoint: string;
  description: string;
  fields: ResourceField[];
  roles?: AppRole[];
}

export interface NavigationSection {
  title: string;
  links: Array<{
    label: string;
    path: string;
    roles?: AppRole[];
  }>;
}

export type ResourceKey =
  | 'role'
  | 'user-role'
  | 'school'
  | 'classes'
  | 'enrollment'
  | 'subject'
  | 'teacher-subject'
  | 'assignment'
  | 'grade'
  | 'fees'
  | 'billing'
  | 'payment'
  | 'year';

export const resourceConfigs: Record<ResourceKey, ResourceConfig> = {
  role: {
    key: 'role',
    title: 'Role Management',
    endpoint: '/role',
    description: 'Create access roles and keep permission labels organized for the rest of the system.',
    roles: ['admin'],
    fields: [
      { key: 'name', label: 'Role Name', type: 'text', placeholder: 'Registrar' },
      { key: 'display_name', label: 'Display Name', type: 'text', placeholder: 'Registrar Officer' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe responsibilities for this role.' },
    ],
  },
  'user-role': {
    key: 'user-role',
    title: 'User Role Assignment',
    endpoint: '/user-role',
    description: 'Map users to roles so the backend can apply the correct access rules.',
    roles: ['admin'],
    fields: [
      { key: 'user_id', label: 'User ID', type: 'number', placeholder: '1' },
      { key: 'role_id', label: 'Role ID', type: 'number', placeholder: '2' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ],
  },
  school: {
    key: 'school',
    title: 'School Profile',
    endpoint: '/school',
    description: 'Maintain the core school record that other academic modules point back to.',
    roles: ['admin'],
    fields: [
      { key: 'name', label: 'School Name', type: 'text', placeholder: 'Northfield Academy' },
      { key: 'code', label: 'School Code', type: 'text', placeholder: 'NFA' },
      { key: 'address', label: 'Address', type: 'textarea', placeholder: 'School address' },
      { key: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'admin@school.edu' },
    ],
  },
  classes: {
    key: 'classes',
    title: 'Class Management',
    endpoint: '/classes',
    description: 'Register class sections, advisers, and capacity for each offering period.',
    roles: ['admin', 'teacher'],
    fields: [
      { key: 'name', label: 'Class Name', type: 'text', placeholder: 'Grade 10 - Starlight' },
      { key: 'code', label: 'Class Code', type: 'text', placeholder: 'G10-STL' },
      { key: 'school_id', label: 'School ID', type: 'number', placeholder: '1' },
      { key: 'year_id', label: 'Academic Year ID', type: 'number', placeholder: '1' },
      { key: 'capacity', label: 'Capacity', type: 'number', placeholder: '40' },
    ],
  },
  enrollment: {
    key: 'enrollment',
    title: 'Enrollment',
    endpoint: '/enrollment',
    description: 'Capture student registration, class assignment, and admission state before assessment.',
    roles: ['admin'],
    fields: [
      { key: 'student_id', label: 'Student ID', type: 'text', placeholder: 'STU-2026-001' },
      { key: 'first_name', label: 'First Name', type: 'text', placeholder: 'Maria' },
      { key: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Santos' },
      { key: 'class_id', label: 'Class ID', type: 'number', placeholder: '3' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Assessed', value: 'assessed' },
          { label: 'Enrolled', value: 'enrolled' },
        ],
      },
    ],
  },
  subject: {
    key: 'subject',
    title: 'Subject Catalog',
    endpoint: '/subject',
    description: 'Organize subjects that can be attached to classes, teachers, assignments, and grades.',
    roles: ['admin', 'teacher', 'student'],
    fields: [
      { key: 'name', label: 'Subject Name', type: 'text', placeholder: 'General Mathematics' },
      { key: 'code', label: 'Subject Code', type: 'text', placeholder: 'MATH-101' },
      { key: 'units', label: 'Units', type: 'number', placeholder: '3' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short subject overview' },
    ],
  },
  'teacher-subject': {
    key: 'teacher-subject',
    title: 'Teacher Subject Load',
    endpoint: '/teacher-subject',
    description: 'Assign teachers to subjects and sections for the current school year.',
    roles: ['teacher', 'admin'],
    fields: [
      { key: 'teacher_id', label: 'Teacher ID', type: 'number', placeholder: '12' },
      { key: 'subject_id', label: 'Subject ID', type: 'number', placeholder: '5' },
      { key: 'class_id', label: 'Class ID', type: 'number', placeholder: '2' },
      { key: 'schedule', label: 'Schedule', type: 'text', placeholder: 'MWF 08:00 - 09:00' },
    ],
  },
  assignment: {
    key: 'assignment',
    title: 'Assignments',
    endpoint: '/assignment',
    description: 'Post academic work and due dates that tie back to teacher-subject assignments.',
    roles: ['teacher', 'student'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'Midterm Project' },
      { key: 'teacher_subject_id', label: 'Teacher Subject ID', type: 'number', placeholder: '7' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Explain what students need to submit.' },
    ],
  },
  grade: {
    key: 'grade',
    title: 'Student Grades',
    endpoint: '/grade',
    description: 'Record grade entries per student and subject after submissions are reviewed.',
    roles: ['teacher', 'admin'],
    fields: [
      { key: 'student_id', label: 'Student ID', type: 'text', placeholder: 'STU-2026-001' },
      { key: 'subject_id', label: 'Subject ID', type: 'number', placeholder: '4' },
      { key: 'term', label: 'Term', type: 'text', placeholder: 'First Quarter' },
      { key: 'grade', label: 'Grade', type: 'number', placeholder: '92' },
      { key: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Excellent performance' },
    ],
  },
  fees: {
    key: 'fees',
    title: 'Fee Setup',
    endpoint: '/fees',
    description: 'Define billing items that assessments and student ledgers can pull into totals.',
    roles: ['admin'],
    fields: [
      { key: 'name', label: 'Fee Name', type: 'text', placeholder: 'Tuition Fee' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'Academic' },
      { key: 'amount', label: 'Amount', type: 'number', placeholder: '2500' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional notes about this fee.' },
    ],
  },
  billing: {
    key: 'billing',
    title: 'Billing Ledger',
    endpoint: '/billing',
    description: 'Generate billing rows per student after assessment and fee calculation are finalized.',
    roles: ['admin', 'student'],
    fields: [
      { key: 'student_id', label: 'Student ID', type: 'text', placeholder: 'STU-2026-001' },
      { key: 'assessment_id', label: 'Assessment ID', type: 'number', placeholder: '10' },
      { key: 'invoice_no', label: 'Invoice No.', type: 'text', placeholder: 'INV-2026-0001' },
      { key: 'total_amount', label: 'Total Amount', type: 'number', placeholder: '4500' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
    ],
  },
  payment: {
    key: 'payment',
    title: 'Payment Posting',
    endpoint: '/payment',
    description: 'Record payments against billing records to keep balances and reports current.',
    roles: ['admin', 'student'],
    fields: [
      { key: 'billing_id', label: 'Billing ID', type: 'number', placeholder: '1' },
      { key: 'amount', label: 'Amount', type: 'number', placeholder: '1500' },
      { key: 'payment_date', label: 'Payment Date', type: 'date' },
      {
        key: 'method',
        label: 'Method',
        type: 'select',
        options: [
          { label: 'Cash', value: 'cash' },
          { label: 'Online', value: 'online' },
          { label: 'Bank Transfer', value: 'bank-transfer' },
        ],
      },
      { key: 'reference_no', label: 'Reference No.', type: 'text', placeholder: 'REF-90817' },
    ],
  },
  year: {
    key: 'year',
    title: 'Academic Year',
    endpoint: '/year',
    description: 'Manage academic year records used by classes, enrollment, and assessments.',
    roles: ['admin'],
    fields: [
      { key: 'name', label: 'Academic Year', type: 'text', placeholder: '2026 - 2027' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Planning', value: 'planning' },
          { label: 'Active', value: 'active' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    ],
  },
};

export const navigationSections: NavigationSection[] = [
  {
    title: 'Start',
    links: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Authentication', path: '/auth' },
      { label: 'Assessment', path: '/assessment', roles: ['student', 'admin'] },
      { label: 'Enrollment Workflow', path: '/enrollment', roles: ['admin'] },
      { label: 'Billing Workflow', path: '/billing', roles: ['admin', 'student'] },
    ],
  },
  {
    title: 'Administration',
    links: [
      { label: 'Roles', path: '/resources/role', roles: ['admin'] },
      { label: 'User Roles', path: '/resources/user-role', roles: ['admin'] },
      { label: 'Academic Years', path: '/resources/year', roles: ['admin'] },
      { label: 'School Profile', path: '/resources/school', roles: ['admin'] },
    ],
  },
  {
    title: 'Academics',
    links: [
      { label: 'Classes', path: '/resources/classes', roles: ['admin', 'teacher'] },
      { label: 'Enrollment', path: '/resources/enrollment', roles: ['admin'] },
      { label: 'Subjects', path: '/resources/subject', roles: ['admin', 'teacher'] },
      { label: 'Teacher Load', path: '/resources/teacher-subject', roles: ['teacher', 'admin'] },
      { label: 'Assignments', path: '/resources/assignment', roles: ['teacher', 'student'] },
      { label: 'Grades', path: '/resources/grade', roles: ['teacher', 'admin'] },
    ],
  },
  {
    title: 'Finance',
    links: [
      { label: 'Fees', path: '/resources/fees', roles: ['admin'] },
      { label: 'Billing', path: '/resources/billing', roles: ['admin', 'student'] },
      { label: 'Payments', path: '/resources/payment', roles: ['admin', 'student'] },
    ],
  },
];

export function filterNavigationSections(role: AppRole | null): NavigationSection[] {
  return navigationSections
    .map(section => ({
      ...section,
      links: section.links.filter(link => !link.roles || (role !== null && link.roles.includes(role))),
    }))
    .filter(section => section.links.length > 0);
}
