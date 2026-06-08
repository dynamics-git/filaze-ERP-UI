import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfilePage {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  get fullName(): string {
    const user = this.sessionService.User as Record<string, unknown> | undefined;
    const firstName = String(user?.['firstName'] ?? user?.['FirstName'] ?? '').trim();
    const lastName = String(user?.['lastName'] ?? user?.['LastName'] ?? '').trim();
    const joined = `${firstName} ${lastName}`.trim();

    return joined || this.userName || 'User';
  }

  get userName(): string {
    return this.sessionService.UserName || this.sessionService.Email || 'Unknown User';
  }

  get userEmail(): string {
    return this.sessionService.Email || 'N/A';
  }

  get roleId(): string {
    return this.sessionService.RoleId || 'N/A';
  }

  get companyName(): string {
    return this.sessionService.CompanyName || 'N/A';
  }

  get companyId(): string {
    return this.sessionService.Company || 'N/A';
  }

  get environmentLabel(): string {
    return environment.isLive || environment.production ? 'LIVE' : 'SANDBOX';
  }

  get userInitials(): string {
    const label = this.fullName;
    const tokens = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase());

    return tokens.length ? tokens.join('') : 'U';
  }

  logout(): void {
    this.sessionService.logout('profile-logout');
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
