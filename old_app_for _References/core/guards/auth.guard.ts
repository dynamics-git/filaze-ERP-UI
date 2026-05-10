// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
// import { Observable } from 'rxjs';

// @Injectable({
//     providedIn: 'root'
// })
// export class AuthGuard {

//     constructor(private router: Router) {
//     }

//     canActivate(
//         next: ActivatedRouteSnapshot,
//         state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
//         const user = localStorage.getItem('cenergi-user-details');
//         if (user === 'null' || user === null) {
//             this.router.navigate(['/auth', 'login']);
//             return false;
//         }

//         return true;
//     }

// }



import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { SessionService } from '../services/session.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.sessionService.isSessionValid()) {
      this.sessionService.logout('expired');
      return false;
    }

    return true;
  }
}