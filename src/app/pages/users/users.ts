import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import * as usersConfig from './users.config';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './users.html',
})
export class UsersPage {
  readonly pageId = 'users';
  readonly listConfig = usersConfig.usersListConfig;
  readonly headerConfig = usersConfig.usersHeaderConfig;
}
