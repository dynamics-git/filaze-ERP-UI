import { Component } from '@angular/core';
import { DocumentRuntimeCommandEvent, DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import { userLineConfig, usersHeaderConfig, usersListConfig } from './users.config';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './users.html',
})
export class UsersPage {
  readonly pageId = 'users';
  readonly listConfig = usersListConfig;
  readonly headerConfig = usersHeaderConfig;
  readonly lineConfig = userLineConfig;

  handleBusinessCommand(event: DocumentRuntimeCommandEvent): void {
    if (event.actionKey === 'cmd:send-approval') {
      // Replace with real business API process.
    }
  }
}