import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { SessionService } from '../services/session.service';

const canActivate = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const sessionService = inject(SessionService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  if (sessionService.isSessionValid()) {
    const pageCode = route.data?.['pageCode'];
    if (typeof pageCode === 'string' && !permissionService.canView(pageCode)) {
      return router.createUrlTree(['/']);
    }

    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

export const authGuard: CanActivateFn = canActivate;
export const authChildGuard: CanActivateChildFn = canActivate;
