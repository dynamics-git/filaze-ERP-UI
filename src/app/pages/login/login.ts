import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, throwError, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IdleSessionService } from '../../core/services/idle-session.service';
import { SessionService } from '../../core/services/session.service';
import { UtilityService } from '../../core/services/utility.service';
import { ApiErrorService } from '../../shared/erp-core/public-api';

type CompanyOption = {
  id: string;
  name: string;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private defaultCompanyId = '';
  defaultCompanyName = 'Tecsa Sdn Bhd';

  loadingCompanies = false;
  loggingIn = false;
  errorMessage = '';

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private readonly authService: AuthService,
    private readonly apiError: ApiErrorService,
    private readonly idleSessionService: IdleSessionService,
    private readonly router: Router,
    private readonly sessionService: SessionService,
    private readonly utilityService: UtilityService
  ) {}

  ngOnInit(): void {
    this.sessionService.IP = this.utilityService.generateUUID();
    this.loadCompanies();
  }

  login(): void {
    this.errorMessage = '';
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loggingIn) {
      return;
    }

    if (!this.defaultCompanyId) {
      this.errorMessage = 'Default company is not configured.';
      return;
    }

    this.loggingIn = true;
    const value = this.form.getRawValue();

    this.authService.login({
      companyId: this.defaultCompanyId,
      companyName: this.defaultCompanyName,
      email: value.email.trim(),
      password: value.password
    }).pipe(
      finalize(() => {
        this.loggingIn = false;
      })
    ).subscribe({
      next: () => {
        this.idleSessionService.start();
        void this.router.navigate(['/']).then((navigated) => {
          if (!navigated) {
            this.errorMessage = 'Login succeeded but navigation was blocked.';
          }
        });
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  private loadCompanies(): void {
    this.loadingCompanies = true;
    this.errorMessage = '';

    this.authService.authenticate().pipe(
      timeout(10000),
      catchError(() => throwError(() => new Error('Unable to initialize authentication for default company.')))
    ).subscribe({
      next: () => {
        this.authService.getCompanies().pipe(
          timeout(10000),
          finalize(() => {
            this.loadingCompanies = false;
          }),
          catchError(() => throwError(() => new Error('Unable to load default company from API.')))
        ).subscribe({
          next: (response) => {
            const companies = this.toCompanies(response);
            const preferred = companies.find((company) => {
              const needle = `${company.id} ${company.name}`.toLowerCase();
              return needle.includes('tecsa');
            }) ?? companies[0];

            if (!preferred) {
              this.errorMessage = 'No company data is available for login.';
              return;
            }

            this.defaultCompanyId = preferred.id;
            this.defaultCompanyName = preferred.name;
          },
          error: (error: unknown) => {
            this.errorMessage = this.getErrorMessage(error);
          }
        });
      },
      error: (error: unknown) => {
        this.loadingCompanies = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  private toCompanies(response: unknown): CompanyOption[] {
    if (!response || typeof response !== 'object' || !('value' in response)) {
      return [];
    }

    const rows = (response as Record<string, unknown>)['value'];

    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map((row) => {
      const record = row as Record<string, unknown>;
      return {
        id: String(record['id'] ?? record['Id'] ?? record['SystemId'] ?? ''),
        name: String(record['name'] ?? record['Name'] ?? record['displayName'] ?? record['id'] ?? '')
      };
    }).filter((company) => company.id && company.name);
  }

  private getErrorMessage(error: unknown): string {
    return this.apiError.toMessage(error, 'Login failed. Please check your connection and credentials.');
  }
}
