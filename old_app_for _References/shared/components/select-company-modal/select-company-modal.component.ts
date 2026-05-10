import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CookieService } from 'ngx-cookie-service';

import { AuthService } from '../../../core/services/auth/auth.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  standalone: false,
  selector: 'app-select-company-modal',
  templateUrl: './select-company-modal.component.html',
  styleUrls: ['./select-company-modal.component.scss']
})
export class SelectCompanyModalComponent implements OnInit {
  companies: any[] = [];
  filteredCompanies: any[] = [];
  optionsForm!: FormGroup;

  user: any;
  searchTerm: string = '';
  currentCompanyId: string | null = null;
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    @Inject(NgbActiveModal) public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private cookie: CookieService
  ) {
    this.optionsForm = this.fb.group({
      cpm: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.user = this.sessionService.User;
    this.currentCompanyId = this.sessionService.Company || null;
    this.getCompanies();
  }

  get cpm() {
    return this.optionsForm.get('cpm');
  }

  onSearch(term: string): void {
    this.searchTerm = term || '';
    this.applyFilter();
  }

  selectCompany(companyId: string): void {
    this.cpm?.setValue(companyId);
    this.cpm?.markAsTouched();
  }

  trackByCompanyId(index: number, company: any): string | number {
    return company?.id || index;
  }

  getCompanies(): void {
    this.authService.getCompanies().subscribe({
      next: (response: any) => {
        const companies = Array.isArray(response?.value) ? response.value : [];
        this.companies = this.sortCompanies(companies);
        this.applyFilter();

        const initialCompanyId = this.currentCompanyId || this.companies[0]?.id || null;
        if (initialCompanyId) {
          this.cpm?.setValue(initialCompanyId);
        }
      },
      error: () => {
        this.companies = [];
        this.filteredCompanies = [];
        this.toastr.error('Unable to load companies right now.');
      }
    });
  }

  changeCompany(value: any): void {
    this.changeCompny(value);
  }

  changeCompny(value: any): void {
    if (!value) {
      this.cpm?.markAsTouched();
      return;
    }

    if (value === this.currentCompanyId) {
      this.activeModal.close();
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.user = this.sessionService.User;

    if (this.user?.UserName === 'admin@tecsa.com.my') {
      this.sessionService.Company = value;
      this.sessionService.CompanyName = this.getCompanyName(value);
      this.sessionService.ResponsibilityCenter = null;
      this.sessionService.ResponsibilityCenters = [];
      this.sessionService.ShowAllResCenters = false;
      this.sessionService.ShowResCenterSelection = false;

      this.finishSwitch();
      return;
    }

    this.checkUserCompanyPermission(this.user, value);
  }

  checkUserCompanyPermission(user: any, companyId: string): void {
    this.authService.getUserCompanyPermission(user.UserId, companyId).subscribe({
      next: (response: any) => {
        if (response?.value && response.value.length > 0) {
          const permission = response.value.filter(
            (x: any) => x.AccessAllCompany || x.CompanyId === companyId
          )[0];

          if (permission) {
            this.getUserRoleDetails(user, companyId);
          } else {
            this.isSubmitting = false;
            this.toastr.error("User doesn't have permission to the selected company.");
          }
        } else {
          this.isSubmitting = false;
          this.toastr.error("User doesn't have permission to the selected company.");
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error('Unable to validate company permission.');
      }
    });
  }

  getUserRoleDetails(user: any, companyId: string): void {
    this.authService.getUserRoleDetails(user.RoleId).subscribe({
      next: (response: any) => {
        if (response && response.value.length > 0) {
          const userRole = response.value[0];

          if (userRole.IsSuperAdmin) {
            this.cookie.set('app-user-details', JSON.stringify(user));
            this.sessionService.SuperAdmin = true;
            this.sessionService.Company = companyId;
            this.sessionService.CompanyName = this.getCompanyName(companyId);
            this.sessionService.User = user;
            this.sessionService.DefaultResponsibilityCenter =
              user.DefaultResponsibilityCentre;
            this.sessionService.ResponsibilityCenter = null;
            this.sessionService.ResponsibilityCenters = [];
            this.sessionService.ShowAllResCenters = false;
            this.sessionService.ShowResCenterSelection = false;

            this.finishSwitch();
          } else {
            this.getUserResponsibilityCenterPermission(user, companyId);
          }
        } else {
          this.getUserResponsibilityCenterPermission(user, companyId);
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error('Unable to load role details.');
      }
    });
  }

  getUserResponsibilityCenterPermission(user: any, companyId: string): void {
    this.authService
      .getUserResponsibilityCenterPermission(user.UserId, companyId)
      .subscribe({
        next: (response: any) => {
          const result = (response?.value || []).filter(
            (x: any) => x.AccessAllCompany || x.CompanyId === companyId
          );

          if (result.length > 0) {
            this.cookie.set('app-user-details', JSON.stringify(user));
            this.sessionService.Company = companyId;
            this.sessionService.CompanyName = this.getCompanyName(companyId);
            this.sessionService.User = user;
            this.sessionService.DefaultResponsibilityCenter =
              user.DefaultResponsibilityCentre;

            if (result.filter((x: any) => x.AccessAllResCentre).length > 0) {
              this.sessionService.ShowAllResCenters = true;
              this.sessionService.ResponsibilityCenters = [];
              this.sessionService.ResponsibilityCenter = null;
            } else {
              this.sessionService.ShowAllResCenters = false;
              this.sessionService.ResponsibilityCenters = result;
              this.sessionService.ResponsibilityCenter = result[0];

              if (!this.sessionService.DefaultResponsibilityCenter) {
                this.sessionService.DefaultResponsibilityCenter = result[0];
              }
            }

            this.sessionService.ShowResCenterSelection = true;
            this.finishSwitch();
          } else {
            this.isSubmitting = false;
            this.toastr.error(
              'User is not configured with any Responsibility Center. Contact your admin for more information.'
            );
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.toastr.error('Unable to load responsibility center permission.');
        }
      });
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredCompanies = [...this.companies];
      return;
    }

    this.filteredCompanies = this.companies.filter((company: any) =>
      (company?.name || '').toLowerCase().includes(term)
    );
  }

  private sortCompanies(companies: any[]): any[] {
    return [...companies].sort((a: any, b: any) => {
      const aIsCurrent = a?.id === this.currentCompanyId ? 1 : 0;
      const bIsCurrent = b?.id === this.currentCompanyId ? 1 : 0;

      if (aIsCurrent !== bIsCurrent) {
        return bIsCurrent - aIsCurrent;
      }

      return (a?.name || '').localeCompare(b?.name || '');
    });
  }

  private getCompanyName(companyId: string): string {
    return this.companies.find((x: any) => x.id === companyId)?.name || '';
  }

  private finishSwitch(): void {
    this.activeModal.close();
    this.router.navigate(['/home']).then(() => {
      window.location.reload();
    });
  }
}