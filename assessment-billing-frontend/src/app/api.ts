import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthStore } from './auth.store';

export type ApiPrimitive = string | number | boolean | null;
export type ApiValue = ApiPrimitive | ApiRecord | ApiValue[];
export interface ApiRecord {
  [key: string]: ApiValue;
}

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  list(endpoint: string): Observable<unknown> {
    return this.http.get<unknown>(this.url(endpoint), this.requestOptions());
  }

  show(endpoint: string, id: string | number): Observable<unknown> {
    return this.http.get<unknown>(this.url(endpoint, id), this.requestOptions());
  }

  create(endpoint: string, payload: ApiRecord): Observable<unknown> {
    return this.http.post<unknown>(this.url(endpoint), payload, this.requestOptions());
  }

  update(endpoint: string, id: string | number, payload: ApiRecord): Observable<unknown> {
    return this.http.put<unknown>(this.url(endpoint, id), payload, this.requestOptions());
  }

  destroy(endpoint: string, id: string | number): Observable<unknown> {
    return this.http.delete<unknown>(this.url(endpoint, id), this.requestOptions());
  }

  login(payload: ApiRecord): Observable<unknown> {
    return this.http.post<unknown>(this.url('/login'), payload, this.requestOptions(false));
  }

  register(payload: ApiRecord): Observable<unknown> {
    return this.http.post<unknown>(this.url('/register'), payload, this.requestOptions(false));
  }

  getUser(): Observable<unknown> {
    return this.http.get<unknown>(this.url('/user'), this.requestOptions());
  }

  assessmentIndex(): Observable<unknown> {
    return this.http.get<unknown>(this.url('/assessment'), this.requestOptions());
  }

  assessmentShow(studentId: string | number): Observable<unknown> {
    return this.http.get<unknown>(this.url('/assessment', studentId), this.requestOptions());
  }

  assessmentStore(studentId: string | number, payload: ApiRecord): Observable<unknown> {
    return this.http.post<unknown>(
      this.url('/assessment', studentId),
      payload,
      this.requestOptions(),
    );
  }

  assessmentApplyScholarship(studentId: string | number, payload: ApiRecord): Observable<unknown> {
    return this.http.post<unknown>(
      this.url('/assessment', studentId, 'scholarship'),
      payload,
      this.requestOptions(),
    );
  }

  assessmentBreakdown(studentId: string | number): Observable<unknown> {
    return this.http.get<unknown>(
      this.url('/assessment', studentId, 'breakdown'),
      this.requestOptions(),
    );
  }

  getEnrollments(): Observable<ApiRecord[]> {
    return this.list('/enrollment').pipe(map(response => this.normalizeCollection(response)));
  }

  postEnrollment(payload: ApiRecord): Observable<unknown> {
    return this.create('/enrollment', payload);
  }

  getAssessments(): Observable<ApiRecord[]> {
    return this.assessmentIndex().pipe(map(response => this.normalizeCollection(response)));
  }

  postAssessment(payload: ApiRecord): Observable<unknown> {
    return this.create('/assessment', payload);
  }

  getBillings(): Observable<ApiRecord[]> {
    return this.list('/billing').pipe(map(response => this.normalizeCollection(response)));
  }

  postBilling(payload: ApiRecord): Observable<unknown> {
    return this.create('/billing', payload);
  }

  getFees(): Observable<ApiRecord[]> {
    return this.list('/fees').pipe(map(response => this.normalizeCollection(response)));
  }

  normalizeCollection(response: unknown): ApiRecord[] {
    if (Array.isArray(response)) {
      return response.filter(this.isApiRecord);
    }

    if (this.isApiRecord(response)) {
      const nestedCollection = this.readNestedCollection(response);
      if (nestedCollection) {
        return nestedCollection;
      }

      return [response];
    }

    return [];
  }

  normalizeRecord(response: unknown): ApiRecord | null {
    if (this.isApiRecord(response)) {
      const nestedRecord = this.readNestedRecord(response);
      return nestedRecord ?? response;
    }

    return null;
  }

  private url(...parts: Array<string | number>): string {
    const baseUrl = this.authStore.baseUrl().replace(/\/+$/, '');
    const sanitizedParts = parts
      .map(part => String(part).trim())
      .filter(Boolean)
      .map(part => part.replace(/^\/+|\/+$/g, ''));

    return [baseUrl, ...sanitizedParts].join('/');
  }

  private requestOptions(includeAuth = true): { headers: HttpHeaders } {
    let headers = new HttpHeaders({
      Accept: 'application/json',
    });

    const token = this.authStore.token().trim();
    if (includeAuth && token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }

  private readNestedCollection(record: ApiRecord): ApiRecord[] | null {
    const candidates = ['data', 'items', 'results', 'records'];

    for (const key of candidates) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value.filter(this.isApiRecord);
      }
    }

    return null;
  }

  private readNestedRecord(record: ApiRecord): ApiRecord | null {
    const candidates = ['data', 'item', 'record', 'result'];

    for (const key of candidates) {
      const value = record[key];
      if (this.isApiRecord(value)) {
        return value;
      }
    }

    return null;
  }

  private isApiRecord = (value: unknown): value is ApiRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
}
