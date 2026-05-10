import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { environment } from '../../../../../../environments/environment';
import { SessionService } from '../../../../../core/services/session.service';
import { RestService } from '../../../../../core/services/rest.service';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { DrawerService } from '../drawer/drawer.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-user-box',
  templateUrl: './user-box.component.html',
  styleUrls: ['./user-box.component.scss'],
})
export class UserBoxComponent implements OnInit {
  user: any = {};
  displayName: string = 'Portal User';
  displaySubtitle: string = 'Portal user';
  initials: string = 'PU';
  profileImageUrl: string = '';
  private userProfileChangedSub?: Subscription;
  constructor(
    private modal: NgbModal,
    private sessionService: SessionService,
    private httpclient: HttpClient,
    private restService: RestService,
    private drawerService: DrawerService
  ) { }

  ngOnInit(): void {
    this.refreshUserView();


    this.userProfileChangedSub = this.sessionService.userProfileChanged$.subscribe(() => {
      this.refreshUserView();
    });
  }


  openProfile(): void {
    // const modalRef = this.modal.open(UserProfileComponent, {
    //   size: 'xl',
    //   backdrop: 'static',
    //   scrollable: true
    // });
    // modalRef.componentInstance.userData = this.user;
    const user = this.user;
    this.drawerService.open(
      UserProfileComponent,
      {
        userData: user
      }
    );
  }

  //   UserProfile(): void {
  //   const user = this.sessionService.User;
  //   this.drawerService.open(
  //     UserProfileComponent,
  //     {
  //       userData: user
  //     }
  //   );
  // }

  logOut(): void {
    this.logoutFromLicenseServer();
    this.sessionService.logout('manual');
  }

  private logoutFromLicenseServer(): void {
    const payload = this.sessionService.UserLiseceLoginIfo;

    if (!payload) {
      return;
    }

    this.httpclient
      .post(
        environment.lisenceApiCore + 'Logout',
        payload,
        this.restService.httpOptions
      )
      .subscribe({
        next: () => { },
        error: () => { }
      });
  }

  private refreshUserView(): void {
    this.user = this.sessionService.User || {};
    this.displayName = this.buildDisplayName(this.user);
    this.displaySubtitle =
      this.user?.Email ||
      this.user?.UserId ||
      this.user?.UserName ||
      'Portal user';
    this.initials = this.buildInitials(this.user);
    this.loadProfileImage(this.user);
  }

  private buildDisplayName(user: any): string {
    const fullName = [user?.FirstName, user?.LastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || user?.UserName || 'Portal User';
  }

  private loadProfileImage(user: any): void {
    const mediaReadLink = user?.['ProfilePicture@odata.mediaReadLink'];

    if (!mediaReadLink) {
      return;
    }

    this.restService.getBinary(mediaReadLink).subscribe({
      next: (fileBlob: Blob) => {
        if (!fileBlob || fileBlob.size === 0) {
          this.profileImageUrl = '';
          return;
        }

        const imageBlob = fileBlob.type
          ? fileBlob
          : new Blob([fileBlob], { type: 'image/*' });

        this.profileImageUrl = window.URL.createObjectURL(imageBlob);
      },
      error: () => {
        this.profileImageUrl = '';
      }
    });
  }

  private buildInitials(user: any): string {
    const first =
      user?.FirstName?.charAt(0) ||
      user?.UserName?.charAt(0) ||
      'P';

    const last =
      user?.LastName?.charAt(0) ||
      user?.UserName?.charAt(1) ||
      'U';

    return `${first}${last}`.toUpperCase();
  }

  ngOnDestroy(): void {
    this.userProfileChangedSub?.unsubscribe();
    this.clearProfileImage();
  }

  private clearProfileImage(): void {
    if (this.profileImageUrl && this.profileImageUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(this.profileImageUrl);
    }
    this.profileImageUrl = '';
  }
}
