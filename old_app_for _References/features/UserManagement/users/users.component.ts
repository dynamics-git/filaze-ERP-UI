import { Component } from '@angular/core';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { RestService } from '../../../core/services/rest.service';
import { SessionService } from '../../../core/services/session.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { AddUserConfig } from './add-user.config';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { ToastrService } from 'ngx-toastr';


@Component({
  standalone: false,
  selector: 'app-users',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" [MenuButtons]="MenuButtons"  (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>'
})
export class UsersComponent {

  config: DataTableConfig = {
    title: 'Users',
    idProp: 'Id',
    headerApi: '/portalUsers',
    pageName: 'USERS',
    headers: [{
      name: 'User Id',
      prop: 'UserId',
      isPrimaryLink: true
    },
    {
      name: 'First Name',
      prop: 'FirstName'
    }, {
      name: 'Last Name',
      prop: 'LastName'
    }, {
      name: 'Email',
      prop: 'Email'
    }, {
      name: 'Status',
      prop: 'Status'
    },
    {
      name: 'Default Responsibility Centre',
      prop: 'DefaultResponsibilityCentre'
    },
    {
      name: 'Department ID',
      prop: 'departmentID'
    },
    {
      name: 'Role Id',
      prop: 'RoleId'
    }],
    selctionType: 'single',
    addItemConfig: {
      title: 'User',
      recordId: 'UserId',
      recordTitle: 'FirstName',
      headerConfig: AddUserConfig
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Page Configuration',
      name: 'Page Configuration',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/pages',
    },
    {
      label: 'Users',
      name: 'Users',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/users',
      isEnable: false
    },
    {
      label: 'User Roles',
      name: 'User Roles',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/roles',
    },
    {
      label: 'Company Permissions',
      name: 'Company Permissions',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/company-permissions',
    },
    {
      label: 'Portal Reason',
      name: 'Portal Reason',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/portal-reasons',
    },
    {
      label: 'Active User',
      name: 'Active User',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/activeUser',
    },
  ];

  allResCenters!: any[];
  portalUsers: any;
  approvalGroups: any;

  constructor(private restService: RestService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private sessionService: SessionService,
    private addItemService: AddItemService,
    private toaster: ToastrService) {
  }

  // ngOnInit(): void {
  //   this.loadUsersAndGroups();
  // }



  // private loadUsersAndGroups(): void {
  //   this.addItemService.showLoader$.next(true);
  //   forkJoin({
  //     users: this.restService.get('/portalUsers'),
  //     groups: this.restService.get('/approvalGroups'),
  //   }).subscribe({
  //     next: (response: { users: any; groups: any }) => {
  //       this.portalUsers = response.users?.value;
  //       this.approvalGroups = response.groups?.value || [];
  //     },
  //     error: (err) => {
  //       console.error('Error loading users/groups:', err);
  //     },
  //     complete: () => {
  //       this.formFielService.updateDropdownItem$.next({
  //         label: 'workflowDelegateUser',
  //         items: this.portalUsers,
  //         displayFormat: '[UserId]',
  //         bindValue: 'UserId'
  //       });

  //       this.formFielService.updateDropdownItem$.next({
  //         label: 'workflowDelegateGroup',
  //         items: this.approvalGroups,
  //         displayFormat: '[Code]',
  //         bindValue: 'Code'
  //       });
  //       this.addItemService.showLoader$.next(false);
  //     },
  //   });
  // }


  popupLoaded(data: any) {
    if (data.header.UserId) {
      let url = `/portalResponsibilityPermissions?$filter=UserId eq '${data.header.UserId}'`
      this.restService.get(url).subscribe((response: any) => {
        const result = response.value.filter((x: any) => (x.AccessAllCompany || x.CompanyId === this.sessionService.Company));
        if (result.length > 0) {
          if (result.filter((x: any) => x.AccessAllResCentre).length > 0) {
            this.getAllResCenters(data.header.DefaultResponsibilityCentre);
          } else {
            const items = result.map((x: any) => {
              return { id: x.PortalResponsibilityCentre, name: x.PortalResponsibilityCentre };
            });
            this.formFielService.updateDropdownItem$.next({ label: 'DefaultResponsibilityCentre', items: items, bindValue: "id", bindLabel: "name" });
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'DefaultResponsibilityCentre', data: data.header.DefaultResponsibilityCentre });
            }, 100);
          }
        }
      });
    }
    if (data.header.workflowDelegateType == "User") {
      this.formDataService.updateControlData$.next({ control: 'workflowDelegateID', data: data.header.workflowDelegateID });
      if (this.portalUsers) {
        setTimeout(() => {
          this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.portalUsers, displayFormat: '[UserId]', bindValue: 'UserId' });
        }, 100);
      } else {
        this.addItemService.showLoader$.next(true);
        this.restService.get('/portalUsers').subscribe((response: any) => {
          this.portalUsers = response.value;
          this.addItemService.showLoader$.next(false);
          setTimeout(() => {
            this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.portalUsers, displayFormat: '[UserId]', bindValue: 'UserId' });
          }, 100);
        });
      }
    } else if (data.header.workflowDelegateType == "Group") {
      this.formDataService.updateControlData$.next({ control: 'workflowDelegateID', data: data.header.workflowDelegateID });
      if (this.approvalGroups) {
        setTimeout(() => {
          this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.approvalGroups, displayFormat: '[Code]', bindValue: 'Code' });
        }, 100);
      } else {
        this.addItemService.showLoader$.next(true);
        this.restService.get('/approvalGroups').subscribe((response: any) => {
          this.approvalGroups = response.value;
          this.addItemService.showLoader$.next(false);
          setTimeout(() => {
            this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.approvalGroups, displayFormat: '[Code]', bindValue: 'Code' });
          }, 100);
        });
      }
    }
  }

  getAllResCenters(defaultResponsibilityCentre: string) {
    if (this.allResCenters) {
      const items = this.allResCenters.map((x: any) => {
        return { id: x.Code, name: x.Code };
      });
      this.formFielService.updateDropdownItem$.next({ label: 'DefaultResponsibilityCentre', items: items, bindValue: "id", bindLabel: "name" });
      setTimeout(() => {
        this.formDataService.updateControlData$.next({ control: 'DefaultResponsibilityCentre', data: defaultResponsibilityCentre });
      }, 100);
    } else {
      this.restService.get('/portalResponsibilityCentres').subscribe((response: any) => {
        this.allResCenters = response.value;
        const items = this.allResCenters.map((x: any) => {
          return { id: x.Code, name: x.Code };
        });
        this.formFielService.updateDropdownItem$.next({ label: 'DefaultResponsibilityCentre', items: items, bindValue: "id", bindLabel: "name" });
        setTimeout(() => {
          this.formDataService.updateControlData$.next({ control: 'DefaultResponsibilityCentre', data: defaultResponsibilityCentre });
        }, 100);
      });
    }
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'workflowDelegateType':
          this.SelectWorkflowDelegateType(data);
          break
      }
    }
  }


  SelectWorkflowDelegateType(data: EventDataModel) {
    switch (data.data) {
      case 'User':
        this.formDataService.updateControlData$.next({ control: 'workflowDelegateID', data: '' });
        if (this.portalUsers) {
          this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.portalUsers, displayFormat: '[UserId]', bindValue: 'UserId' });
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/portalUsers').subscribe((response: any) => {
            this.portalUsers = response.value;
            this.addItemService.showLoader$.next(false);
            this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.portalUsers, displayFormat: '[UserId]', bindValue: 'UserId' });
          });
        }
        break;

      case 'Group':
        this.formDataService.updateControlData$.next({ control: 'workflowDelegateID', data: '' });
        if (this.approvalGroups) {
          this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.approvalGroups, displayFormat: '[Code]', bindValue: 'Code' });
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/approvalGroups').subscribe((response: any) => {
            this.approvalGroups = response.value;
            this.addItemService.showLoader$.next(false);
            this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.approvalGroups, displayFormat: '[Code]', bindValue: 'Code' });
          });
        }
        break;
    }
  }


  public buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'assignRepresentative') {
      this.assignRepresentative(buttonData);
    } else if (buttonData.button.label === 'cancelRepresentative') {
      this.cancelRepresentative(buttonData);
    }
  }


  assignRepresentative(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.enableRepresentative) {
      this.toaster.warning("Representative is already assigned for this user");
      return;
    }
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.assignRepresentative';
    try {
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toaster.success("Representative Assigned Successfully");
        this.addItemService.reloadHeaderById$.next(buttonData.headerData.Id);
      });
    }
    finally {
      this.addItemService.reloadHeaderById$.next(buttonData.headerData.Id);
      this.addItemService.customButtonResponse$.next(true);
      this.addItemService.showLoader$.next(false);
    }

  }

  async cancelRepresentative(buttonData: CustomButtonEvent) {
    if (!buttonData.headerData.enableRepresentative) {
      this.toaster.warning("Representative is already not assigned for this user");
      return;
    }
    this.addItemService.showLoader$.next(true);

    const id = buttonData.data[this.config.idProp!];
    const url = `(${id})/Microsoft.NAV.cancelRepresentative`;

    try {

      await firstValueFrom(
        this.restService.post(this.config.headerApi + url, {})
      );
      this.toaster.success("Representative Cancelled Successfully");
      this.addItemService.refreshDataById$.next(true);
      window.location.reload();
    } catch (err) {
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }



}