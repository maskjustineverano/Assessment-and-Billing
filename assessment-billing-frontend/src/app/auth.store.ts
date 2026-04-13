import { Injectable, signal } from '@angular/core';
import { ApiRecord } from './api';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/api';
const API_BASE_URL_KEY = 'assessment.api.baseUrl';
const API_TOKEN_KEY = 'assessment.api.token';
const API_USER_KEY = 'assessment.api.user';
const API_ROLE_KEY = 'assessment.api.role';

export type AppRole = 'student' | 'teacher' | 'admin';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private persistSession = this.hasStoredSession();

  readonly baseUrl = signal(this.readString(API_BASE_URL_KEY, DEFAULT_BASE_URL));
  readonly token = signal(this.readSessionString(API_TOKEN_KEY, ''));
  readonly user = signal<ApiRecord | null>(this.readUser());
  readonly role = signal<AppRole | null>(this.readRole());

  setPersistence(rememberSession: boolean): void {
    this.persistSession = rememberSession;
    this.syncSessionStorage();
  }

  setBaseUrl(value: string): void {
    const normalizedValue = value.trim() || DEFAULT_BASE_URL;
    this.baseUrl.set(normalizedValue);
    localStorage.setItem(API_BASE_URL_KEY, normalizedValue);
  }

  setToken(value: string): void {
    const normalizedValue = value.trim();
    this.token.set(normalizedValue);
    this.writeSessionString(API_TOKEN_KEY, normalizedValue);
  }

  setUser(value: ApiRecord | null): void {
    this.user.set(value);
    this.writeSessionRecord(API_USER_KEY, value);
  }

  setRole(value: AppRole | null): void {
    this.role.set(value);
    this.writeSessionString(API_ROLE_KEY, value ?? '');
  }

  clearSession(): void {
    this.setToken('');
    this.setUser(null);
    this.setRole(null);
  }

  private syncSessionStorage(): void {
    this.writeSessionString(API_TOKEN_KEY, this.token());
    this.writeSessionRecord(API_USER_KEY, this.user());
    this.writeSessionString(API_ROLE_KEY, this.role() ?? '');
  }

  private writeSessionString(key: string, value: string): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);

    if (!value) {
      return;
    }

    this.sessionStorageForCurrentMode().setItem(key, value);
  }

  private writeSessionRecord(key: string, value: ApiRecord | null): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);

    if (!value) {
      return;
    }

    this.sessionStorageForCurrentMode().setItem(key, JSON.stringify(value));
  }

  private sessionStorageForCurrentMode(): Storage {
    return this.persistSession ? localStorage : sessionStorage;
  }

  private readString(key: string, fallbackValue: string): string {
    return localStorage.getItem(key) ?? fallbackValue;
  }

  private readSessionString(key: string, fallbackValue: string): string {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? fallbackValue;
  }

  private readUser(): ApiRecord | null {
    const rawValue = localStorage.getItem(API_USER_KEY) ?? sessionStorage.getItem(API_USER_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as unknown;
      return typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)
        ? (parsedValue as ApiRecord)
        : null;
    } catch {
      return null;
    }
  }

  private readRole(): AppRole | null {
    const rawValue = localStorage.getItem(API_ROLE_KEY) ?? sessionStorage.getItem(API_ROLE_KEY);
    return rawValue === 'student' || rawValue === 'teacher' || rawValue === 'admin'
      ? rawValue
      : null;
  }

  private hasStoredSession(): boolean {
    return Boolean(localStorage.getItem(API_TOKEN_KEY) || localStorage.getItem(API_ROLE_KEY) || localStorage.getItem(API_USER_KEY));
  }
}
