import { Component } from "@angular/core";
import { ItemConfig } from "../../../core/models/shared/item.config";
import { AddUserConfig } from "./add-user.config";

@Component({
  standalone: false,
    selector: 'app-add-users',
    template: '<app-add-item [config]="config"></app-add-item>'
})
export class AddUsersComponent {
    public config: ItemConfig = {
        title: 'User',
        recordId: 'UserId',
        recordTitle: 'UserName',
        headerConfig: AddUserConfig,
        returnUrl: '/users/users'
    }
}