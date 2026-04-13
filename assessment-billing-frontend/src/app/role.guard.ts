import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore, AppRole } from './auth.store';
import { resourceConfigs, ResourceKey } from './resource-config';

export const roleGuard: CanActivateFn = route => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const currentRole = authStore.role();
  const allowedRoles = (route.data?.['roles'] as AppRole[] | undefined) ?? [];

  if (!authStore.token()) {
    return router.createUrlTree(['/auth']);
  }

  if (!currentRole) {
    return router.createUrlTree(['/auth']);
  }

  if (allowedRoles.length && !allowedRoles.includes(currentRole)) {
    return router.createUrlTree(['/dashboard', currentRole]);
  }

  return true;
};

export const resourceRoleGuard: CanActivateFn = route => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const currentRole = authStore.role();
  const resourceKey = route.paramMap.get('resourceKey') as ResourceKey | null;

  if (!authStore.token()) {
    return router.createUrlTree(['/auth']);
  }

  if (!currentRole || !resourceKey || !(resourceKey in resourceConfigs)) {
    return router.createUrlTree(['/auth']);
  }

  const allowedRoles = resourceConfigs[resourceKey].roles ?? [];

  if (allowedRoles.length && !allowedRoles.includes(currentRole)) {
    return router.createUrlTree(['/dashboard', currentRole]);
  }

  return true;
};
