// // import { Component, OnInit } from '@angular/core';
// // import { SessionService } from './core/services/session.service';
// // import { Router } from '@angular/router';

// // @Component({
// //   selector: 'app-root',
// //   templateUrl: './app.component.html',
// //   styleUrl: './app.component.scss'
// // })
// // export class AppComponent implements OnInit {
// //   title = 'procure360-v17';

// //   constructor(
// //     private sessionService: SessionService,
// //     private router: Router
// //   ) {
// //   }

// //   ngOnInit(): void {
// //     if (this.sessionService.User) {
// //       const path = window.location.href.replace(window.location.origin, '').replace('#/', '');
// //       if (path === '/' || path.includes('/auth/login')) {
// //         this.router.navigate(['/home']);
// //       } else {
// //         this.router.navigate([path]);
// //       }
// //     }
// //   }
// // }
// // New Code 
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { SessionService } from './core/services/session.service';
// import { Router } from '@angular/router';
// import { IdleSessionService } from './core/services/idle-session.service';


// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrl: './app.component.scss'
// })
// export class AppComponent implements OnInit, OnDestroy {

//   title = 'procure360-v17';
//   isDark = false;

//   constructor(
//     private sessionService: SessionService,
//     private idleSessionService: IdleSessionService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {

//     if (this.sessionService.User) {
//       this.idleSessionService.start();
//     }

//     // Session redirect logic
//     if (this.sessionService.User) {
//       const path = window.location.href.replace(window.location.origin, '').replace('#/', '');
//       if (path === '/' || path.includes('/auth/login')) {
//         this.router.navigate(['/home']);
//       } else {
//         this.router.navigate([path]);
//       }
//     }

//     // THEME logic
//     const saved = localStorage.getItem('theme');
//     this.isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
//     this.applyTheme();
//   }

//   toggleTheme(): void {
//     this.isDark = !this.isDark;
//     localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
//     this.applyTheme();
//   }

//   private applyTheme(): void {
//     document.body.classList.toggle('dark-theme', this.isDark);
//   }

//   ngOnDestroy(): void {
//   this.idleSessionService.stop();
// }

// }

//Session expire tested block 

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdleSessionService } from './core/services/idle-session.service';
import { SessionService } from './core/services/session.service';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'procure360-v17';
  isDark = false;

  constructor(
    private sessionService: SessionService,
    private idleSessionService: IdleSessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.sessionService.isSessionValid()) {
      this.idleSessionService.start();
      this.handleSessionRedirect();
    }

    const saved = localStorage.getItem('theme');
    this.isDark =
      saved === 'dark' ||
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);

    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDark);
  }

  private handleSessionRedirect(): void {
    const path = window.location.href
      .replace(window.location.origin, '')
      .replace('#/', '');

    if (path === '/' || path.includes('/auth/login')) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate([path]);
    }
  }

  ngOnDestroy(): void {
    this.idleSessionService.stop();
  }
}