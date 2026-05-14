import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? true : router.parseUrl('/login');
};

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user;

  if (!auth.isLoggedIn || !user) {
    return router.parseUrl('/login');
  }

  const roles = route.data?.['roles'] as string[] | undefined;
  const customRole = route.data?.['customRole'] as boolean | undefined;

  if (roles?.includes(user.role)) return true;
  if (customRole && !['admin', 'caller', 'supervisor'].includes(user.role)) return true;

  return router.parseUrl(auth.destinationFor(user));
};
