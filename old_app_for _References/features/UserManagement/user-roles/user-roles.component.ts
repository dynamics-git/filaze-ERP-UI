import { Component, OnInit } from '@angular/core';
import { UserRoleHeaderConfig, UserRoleLineConfig } from './add-user-role.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { RestService } from '../../../core/services/rest.service';
import { ToastrService } from 'ngx-toastr';
import { SessionService } from '../../../core/services/session.service';
import { firstValueFrom, take } from 'rxjs';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { ButtonPermissionComponent } from '../button-permission/button-permission.component';
import { Router } from '@angular/router';
import { ModuleRegistry } from '../../../core/models/registry/module-registry';

@Component({
  standalone: false,
  selector: 'app-user-roles',
  template: '<app-data-table [config]="config" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class UserRolesComponent {

  constructor(
    private addItemService: AddItemService,
    private restService: RestService,
    private toastr: ToastrService,
    private sessionService: SessionService,
    private selectedItemService: SelectedItemService,
    private universalPopupService: UniversalPopupService,
    private router: Router
  ) { }

  config: DataTableConfig = {
    title: 'User Roles',
    idProp: 'Id',
    headerApi: '/portalUsersRoles',
    pageName: 'USER ROLES',
    headers: [{
      name: 'Role Id',
      prop: 'RoleId',
      isPrimaryLink: true
    }, {
      name: 'Name',
      prop: 'Name'
    }, {
      name: 'IsSuperAdmin',
      prop: 'Is Super Admin'
    }],
    selctionType: 'single',
    addItemConfig: {
      title: 'User Role',
      recordId: 'RoleId',
      recordTitle: 'Name',
      headerConfig: UserRoleHeaderConfig,
      lineConfig: UserRoleLineConfig
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
    },
    {
      label: 'User Roles',
      name: 'User Roles',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/roles',
      isEnable: false
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


  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'UserRoleUpdate') {
      this.addItemService.showLoader$.next(true);
      const url: string = '(' + buttonData.headerData[this.config.idProp!] + ')/Microsoft.NAV.CreatePermissions';
      try {
        let payload = {
          roleId: buttonData.headerData.RoleId,
          userId: this.sessionService.UserId,
          company: this.sessionService.CompanyName,
          companyId: this.sessionService.Company,
          portalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter
        }
        this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
          this.toastr.success(`User Role Updated Successfully`);
          this.addItemService.showLoader$.next(false);
        });
      }
      finally {
        setTimeout(() => {
          this.addItemService.showLoader$.next(false);
          this.addItemService.popupRefreshLineData$.next(true);
        }, 100)
      }
    } else if (buttonData.button.label === 'CheckAll') {
      this.CheckAll(buttonData);
    }
    else if (buttonData.button.label === 'UpdatePermission') { this.UpdatePermission(buttonData); }
    else if (buttonData.button.label === 'ButtonPermission') { this.ButtonPermission(buttonData); }
  }



  CheckAll(buttonData: any) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.headerData[this.config.idProp!] + ')/Microsoft.NAV.CheckAllPermissionsByRole';
    try {
      let payload = {
        roleId: buttonData.headerData.RoleId,
        companyId: this.sessionService.Company,
      }
      this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
        this.toastr.success(`Check all Successfully`);
        this.addItemService.showLoader$.next(false);
      });
    }
    finally {
      setTimeout(() => {
        this.addItemService.showLoader$.next(false);
        this.addItemService.popupRefreshLineData$.next(true);
      }, 100)
    }
  }


  ClearAll(buttonData: any) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.headerData[this.config.idProp!] + ')/Microsoft.NAV.UncheckAllPermissionsByRole';
    try {
      let payload = {
        roleId: buttonData.headerData.RoleId,
        companyId: this.sessionService.Company,
      }
      this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
        this.toastr.success(`Clear all Successfully`);
        this.addItemService.showLoader$.next(false);
      });
    }
    finally {
      setTimeout(() => {
        this.addItemService.showLoader$.next(false);
        this.addItemService.popupRefreshLineData$.next(true);
      }, 100)
    }
  }

  //-------------------------------------button permission-------------------------------------------------------

  async UpdatePermission(buttonData: any) {
    this.addItemService.showLoader$.next(true);

    try {
      const selectedIndexes = await firstValueFrom(
        this.selectedItemService.selectedLines$.pipe(take(1))
      );

      if (!selectedIndexes || selectedIndexes.length === 0) {
        this.toastr.warning('No lines selected.');
        return;
      }

      const selectedLines = selectedIndexes
        .map((i: number) => buttonData?.lineData?.[i])
        .filter(Boolean);

      if (selectedLines.length === 0) {
        this.toastr.warning('No valid lines selected.');
        return;
      }

      for (const line of selectedLines) {
        const buttons = this.getButtonsByObjectName(line.ObjectName);

        if (!buttons || buttons.length === 0) {
          console.warn(`No buttons found for ${line.ObjectName}`);
          continue;
        }

        for (const btn of buttons) {
          const pageID = line.ObjectName;
          const roleID = line.RoleId ?? line.RoleID;
          const fieldName = btn.label || btn.name;
          const sourceType = btn.sourceType;

          const filter =
            `?$filter=pageID eq '${pageID}' and roleID eq '${roleID}' and fieldName eq '${fieldName}'`;

          const existing: any = await firstValueFrom(
            this.restService.get(`/buttonPermissions${filter}`)
          );

          if (existing?.value?.length > 0) {
            continue;
          }

          const payload = {
            pageID,
            roleID,
            fieldName,
            sourceType,
            IsEnable: true,
            IsVisible: false,
            createdBy: this.sessionService.UserId,
            UserId: this.sessionService.UserId,
            Company: this.sessionService.CompanyName,
            CompanyId: this.sessionService.Company,
            PortalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
          };

          await firstValueFrom(
            this.restService.post(
              `/portalPermissions(${line?.Id})/buttonPermissions`,
              payload
            )
          );
        }
      }

      this.toastr.success('Button permissions updated successfully');
    } catch (error) {
      console.error(error);
      this.toastr.error('Failed to update button permissions');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.addItemService.popupRefreshLineData$.next(true);
      this.addItemService.refreshDataById$.next(true);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }





  getButtonsByObjectName(objectName: string, pageMenuButtons: any[] = []) {
    const entry = Object.values(ModuleRegistry)
      .find((m: any) => m.pageName === objectName);

    const manualListButtons = (Array.isArray(pageMenuButtons) ? pageMenuButtons : []).map((btn: any) => ({
      ...btn,
      sourceType: 'List'
    }));

    if (!entry) {
      if (manualListButtons.length > 0) {
        return manualListButtons;
      }

      console.warn('No ModuleRegistry entry for:', objectName);
      return [];
    }

    const cardConfig = entry.getCardConfig?.();
    const listConfig = entry.getListConfig?.();

    const registryMenuButtons = (entry.menuButtons || []).map((btn: any) => ({
      ...btn,
      sourceType: 'List'
    }));

    const headerConfig =
      cardConfig?.headerConfig ??
      listConfig?.addItemConfig?.headerConfig;

    const lineConfig =
      cardConfig?.lineConfig ??
      listConfig?.addItemConfig?.lineConfig;

    const configListButtons = [
      ...(listConfig?.buttons || []),
      ...(listConfig?.topbuttons || [])
    ].map((btn: any) => ({
      ...btn,
      sourceType: 'List'
    }));

    const headerButtons = (headerConfig?.buttons || []).map((btn: any) => ({
      ...btn,
      sourceType: 'Header'
    }));

    const lineButtons = (lineConfig?.buttons || []).map((btn: any) => ({
      ...btn,
      sourceType: 'Line'
    }));

    const seen = new Set<string>();

    return [
      ...manualListButtons,
      ...registryMenuButtons,
      ...configListButtons,
      ...headerButtons,
      ...lineButtons
    ].filter((btn: any) => {
      const name = btn.label || btn.name;
      const key = `${name}|${btn.sourceType}`;

      if (!name) {
        return false;
      }

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }



  async ButtonPermission(buttonData: any) {
    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );

    if (!selectedIndexes?.length) {
      this.toastr.warning('No lines selected.');
      return;
    }

    const selectedLines = selectedIndexes
      .map((i: number) => buttonData.lineData[i])
      .filter((l: any) => !!l);

    if (!selectedLines.length) {
      this.toastr.warning('No valid lines selected.');
      return;
    }

    if (selectedLines.length !== 1) {
      this.toastr.warning('Please select one line!');
      return;
    }

    const line = selectedLines[0];

    try {
      this.addItemService.showLoader$.next(true);

      const buttons = this.getButtonsByObjectName(line.ObjectName);

      for (const btn of buttons) {
        const pageID = line.ObjectName;
        const roleID = line.RoleId ?? line.RoleID;
        const fieldName = btn.label || btn.name;
        const sourceType = btn.sourceType;

        if (!fieldName) {
          continue;
        }

        const filter =
          `?$filter=pageID eq '${pageID}' and roleID eq '${roleID}' and fieldName eq '${fieldName}'`;

        const existing: any = await firstValueFrom(
          this.restService.get(`/buttonPermissions${filter}`)
        );

        if (existing?.value?.length > 0) {
          continue;
        }

        const payload = {
          pageID,
          roleID,
          fieldName,
          sourceType,
          IsEnable: true,
          IsVisible: false,
          createdBy: this.sessionService.UserId,
          UserId: this.sessionService.UserId,
          Company: this.sessionService.CompanyName,
          CompanyId: this.sessionService.Company,
          PortalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
        };

        await firstValueFrom(
          this.restService.post(
            `/portalPermissions(${line?.Id})/buttonPermissions`,
            payload
          )
        );
      }

      this.universalPopupService.openPopupObjectForButtonPermission({
        module: 'buttonPermission',
        childComponent: new ButtonPermissionComponent(),
        parentComponent: this,
        lineId: line
      });

    } catch (err) {
      console.error(err);
      this.toastr.error('Unexpected error occurred.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.addItemService.popupRefreshLineData$.next(true);
      this.addItemService.refreshDataById$.next(true);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }



}
