import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface CrmUser {
  id: number;
  name: string;
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<CrmUser | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly router: Router) {}

  get user(): CrmUser | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token') && !!this.user;
  }

  login(user: CrmUser, token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.userSubject.next(user);
    this.router.navigateByUrl(this.destinationFor(user));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.router.navigateByUrl('/login');
  }

  destinationFor(user: CrmUser | null = this.user): string {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'caller') return '/caller';
    if (user.role === 'supervisor') return '/supervisor';
    return '/custom';
  }

  private readUser(): CrmUser | null {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
}
