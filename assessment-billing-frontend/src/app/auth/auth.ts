import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api, ApiRecord } from '../api';
import { AppRole, AuthStore } from '../auth.store';

type AuthMode = 'login' | 'register';
type SocialProvider = 'google' | 'facebook' | 'apple';
type AccountRoleRegistry = Partial<Record<string, AppRole>>;

const ACCOUNT_ROLE_REGISTRY_KEY = 'assessment.api.accountRoles';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class AuthPage {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  mode: AuthMode = 'login';
  loading = false;
  message = '';
  errorMessage = '';
  baseUrlInput = this.authStore.baseUrl();
  rememberSession = true;

  readonly loginForm: Record<string, string> = {
    email: '',
    password: '',
  };

  readonly registerForm: Record<string, string> = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  };

  readonly accessRoles: Array<{ key: AppRole; label: string; iconPath: string }> = [
    { key: 'student', label: 'Student', iconPath: 'roles/student.png' },
    { key: 'teacher', label: 'Teacher', iconPath: 'roles/teacher.png' },
    { key: 'admin', label: 'Admin', iconPath: 'roles/admin.png' },
  ];

  selectedRole: AppRole = 'student';
  lockedLoginRole: AppRole | null = null;

  constructor() {
    this.syncLockedLoginRole();
  }

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.message = '';
    this.errorMessage = '';
    this.syncLockedLoginRole();
  }

  selectRole(role: AppRole): void {
    if (!this.isRoleSelectable(role)) {
      return;
    }

    this.selectedRole = role;
  }

  onLoginEmailChange(value: string): void {
    this.loginForm['email'] = value;
    this.syncLockedLoginRole();
  }

  saveBaseUrl(): void {
    this.authStore.setBaseUrl(this.baseUrlInput);
    this.message = `API base URL updated to ${this.authStore.baseUrl()}`;
    this.errorMessage = '';
  }

  submit(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    if (!this.hasMinimumCredentials()) {
      this.loading = false;
      this.errorMessage = this.mode === 'login'
        ? 'Enter your email and password first.'
        : 'Complete the required sign-up fields first.';
      return;
    }

    if (this.mode === 'login' && this.lockedLoginRole && this.selectedRole !== this.lockedLoginRole) {
      this.loading = false;
      this.errorMessage = `This account is registered as ${this.lockedLoginRole}.`;
      this.selectedRole = this.lockedLoginRole;
      return;
    }

    const requestedRole = this.mode === 'login'
      ? (this.lockedLoginRole ?? this.selectedRole)
      : this.selectedRole;
    this.authStore.setPersistence(this.mode === 'login' ? this.rememberSession : true);
    const request = this.mode === 'login'
      ? this.api.login({ ...this.loginForm, role: requestedRole } as ApiRecord)
      : this.api.register({ ...this.registerForm, role: this.selectedRole } as ApiRecord);

    request.subscribe({
      next: response => {
        const record = this.api.normalizeRecord(response);
        const token = this.extractToken(record);
        const user = this.extractUser(record);
        const email = this.extractEmail(record, user) || this.resolveEmail();
        const role = this.extractRole(record, user) ?? this.lookupRegisteredRole(email) ?? requestedRole;

        if (token) {
          this.authStore.setToken(token);
        }

        if (user) {
          this.authStore.setUser(user);
        }

        this.rememberRegisteredRole(email, role);
        this.authStore.setRole(role);
        this.syncLockedLoginRole();

        this.loading = false;
        this.message = this.mode === 'login' ? 'Authentication successful.' : 'Registration submitted successfully.';
        void this.router.navigateByUrl(`/dashboard/${role}`);
      },
      error: error => {
        this.loading = false;
        const fallbackRole = this.mode === 'login'
          ? this.lockedLoginRole
          : this.selectedRole;

        if (!fallbackRole) {
          this.message = '';
          this.errorMessage = 'Unable to verify this account role while the backend API is unavailable.';
          return;
        }

        const email = this.resolveEmail();
        this.startLocalRoleSession(fallbackRole, this.resolveDisplayName(), email);
        this.rememberRegisteredRole(email, fallbackRole);
        this.syncLockedLoginRole();
        this.message = this.mode === 'login'
          ? 'Signed in with verified local role access. Backend API is unavailable right now.'
          : 'Account created with local role access. Backend API is unavailable right now.';
        this.errorMessage = '';
        void this.router.navigateByUrl(`/dashboard/${fallbackRole}`);
      },
    });
  }

  fetchCurrentUser(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api.getUser().subscribe({
      next: response => {
        const user = this.api.normalizeRecord(response);
        this.authStore.setUser(user);
        const email = this.extractEmail(user, user) || this.resolveEmail();
        const role = this.extractRole(user, user) ?? this.authStore.role();
        this.authStore.setRole(role);
        if (role) {
          this.rememberRegisteredRole(email, role);
          this.syncLockedLoginRole();
        }
        this.loading = false;
        this.message = 'Authenticated user profile refreshed.';
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.extractError(error);
      },
    });
  }

  logout(): void {
    this.authStore.clearSession();
    this.message = 'Stored session cleared from the frontend.';
    this.errorMessage = '';
  }

  connectSocial(provider: SocialProvider): void {
    this.message = '';
    this.errorMessage = '';
    window.location.href = this.socialAuthUrl(provider);
  }

  private hasMinimumCredentials(): boolean {
    if (this.mode === 'login') {
      return Boolean(this.loginForm['email']?.trim() && this.loginForm['password']?.trim());
    }

    return Boolean(
      this.registerForm['name']?.trim()
      && this.registerForm['email']?.trim()
      && this.registerForm['password']?.trim()
      && this.registerForm['password_confirmation']?.trim(),
    );
  }

  private startLocalRoleSession(role: AppRole, name: string, email: string): void {
    this.authStore.setToken(`local-${role}-session`);
    this.authStore.setRole(role);
    this.authStore.setUser({
      name,
      email,
      role: {
        name: role,
      },
    });
  }

  private socialAuthUrl(provider: SocialProvider): string {
    const apiBase = this.authStore.baseUrl().replace(/\/+$/, '');
    const appBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    const roleQuery = `role=${encodeURIComponent(this.lockedLoginRole ?? this.selectedRole)}`;
    return `${appBase}/auth/${provider}/redirect?${roleQuery}`;
  }

  private isRoleSelectable(role: AppRole): boolean {
    return this.mode !== 'login' || !this.lockedLoginRole || this.lockedLoginRole === role;
  }

  private syncLockedLoginRole(): void {
    this.lockedLoginRole = this.mode === 'login'
      ? this.lookupRegisteredRole(this.loginForm['email'])
      : null;

    if (this.lockedLoginRole) {
      this.selectedRole = this.lockedLoginRole;
    }
  }

  private resolveDisplayName(): string {
    const registerName = this.registerForm['name']?.trim();
    if (registerName) {
      return registerName;
    }

    const loginEmail = this.resolveEmail();
    const emailPrefix = loginEmail.split('@')[0]?.trim();
    return emailPrefix || `${this.selectedRole} user`;
  }

  private resolveEmail(): string {
    return this.loginForm['email']?.trim() || this.registerForm['email']?.trim() || `${this.selectedRole}@local.test`;
  }

  private extractToken(record: ApiRecord | null): string {
    const candidates = [
      record?.['token'],
      record?.['access_token'],
      record?.['plainTextToken'],
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }

    return '';
  }

  private extractUser(record: ApiRecord | null): ApiRecord | null {
    const userValue = record?.['user'];
    return typeof userValue === 'object' && userValue !== null && !Array.isArray(userValue)
      ? (userValue as ApiRecord)
      : record;
  }

  private extractRole(record: ApiRecord | null, user: ApiRecord | null): AppRole | null {
    const roleCandidates = [
      record?.['role'],
      user?.['role'],
      user?.['role_name'],
      user?.['user_role'],
    ];

    for (const candidate of roleCandidates) {
      const resolvedRole = this.normalizeRoleCandidate(candidate);
      if (resolvedRole) {
        return resolvedRole;
      }
    }

    return null;
  }

  private extractEmail(record: ApiRecord | null, user: ApiRecord | null): string {
    const emailCandidates = [
      record?.['email'],
      user?.['email'],
      user?.['mail'],
    ];

    for (const candidate of emailCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim().toLowerCase();
      }
    }

    return '';
  }

  private normalizeRoleCandidate(candidate: unknown): AppRole | null {
    if (typeof candidate === 'string') {
      return this.normalizeRoleName(candidate);
    }

    if (typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate) && 'name' in candidate) {
      const roleName = (candidate as { name?: unknown }).name;
      return typeof roleName === 'string' ? this.normalizeRoleName(roleName) : null;
    }

    return null;
  }

  private normalizeRoleName(value: string): AppRole | null {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'student' || normalizedValue === 'teacher' || normalizedValue === 'admin') {
      return normalizedValue;
    }

    return null;
  }

  private extractError(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const errorBody = (error as { error?: unknown }).error;
      if (typeof errorBody === 'string') {
        return errorBody;
      }
      if (typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody) {
        const message = (errorBody as { message?: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
      }
    }

    return 'Request failed. Check your API URL, auth payload, or backend response format.';
  }

  private lookupRegisteredRole(email: string): AppRole | null {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return null;
    }

    const registry = this.readAccountRoleRegistry();
    return registry[normalizedEmail] ?? null;
  }

  private rememberRegisteredRole(email: string, role: AppRole): void {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    const registry = this.readAccountRoleRegistry();
    registry[normalizedEmail] = role;
    localStorage.setItem(ACCOUNT_ROLE_REGISTRY_KEY, JSON.stringify(registry));
  }

  private readAccountRoleRegistry(): AccountRoleRegistry {
    const rawValue = localStorage.getItem(ACCOUNT_ROLE_REGISTRY_KEY);

    if (!rawValue) {
      return {};
    }

    try {
      const parsedValue = JSON.parse(rawValue) as unknown;
      if (typeof parsedValue !== 'object' || parsedValue === null || Array.isArray(parsedValue)) {
        return {};
      }

      const registry: AccountRoleRegistry = {};
      for (const [email, value] of Object.entries(parsedValue as Record<string, unknown>)) {
        const normalizedRole = typeof value === 'string' ? this.normalizeRoleName(value) : null;
        if (normalizedRole) {
          registry[email] = normalizedRole;
        }
      }

      return registry;
    } catch {
      return {};
    }
  }
}
