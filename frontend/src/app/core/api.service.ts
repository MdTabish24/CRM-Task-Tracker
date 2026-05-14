import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl =
    window.location.hostname === 'localhost' && window.location.port === '4200'
      ? 'http://localhost:5000/api'
      : '/api';

  constructor(private readonly http: HttpClient) {}

  get<T = any>(path: string) {
    return this.http.get<T>(this.url(path));
  }

  post<T = any>(path: string, body: any, options?: any) {
    return this.http.post<T>(this.url(path), body, options);
  }

  patch<T = any>(path: string, body: any) {
    return this.http.patch<T>(this.url(path), body);
  }

  put<T = any>(path: string, body: any) {
    return this.http.put<T>(this.url(path), body);
  }

  delete<T = any>(path: string) {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string) {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
