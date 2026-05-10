import { Component } from '@angular/core';
import { ListTableConfig } from '../../../core/models/shared/list-table.config';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { RestService } from '../../../core/services/rest.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { ExpensesTypeLime, ExpenseTypeHeaderConfig } from './expense-type-setup.config';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { EmployeeClaimLime } from '../employee-claim/employee-claim.config';

@Component({
  standalone: false,
  selector: 'app-expense-type-setup',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" [MenuButtons]="MenuButtons"  (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>',
})
export class ExpenseTypeSetupComponent {
  config: DataTableConfig = {
    title: 'Expense Type Setup',
    idProp: 'systemId',
    headerApi: '/expenseClaimTypes',
    pageName: 'EXPENSE_TYPE_SETUP',
    headers: [
      { name: 'Code', prop: 'code', isPrimaryLink: true },
      { name: 'Description', prop: 'description' },
      { name: 'Active', prop: 'active', isBoolean: true },
      { name: 'VAT', prop: 'vat' }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Expense Type',
      recordId: 'code',
      recordTitle: 'description',
      headerConfig: ExpenseTypeHeaderConfig,
      lineConfig: ExpensesTypeLime
    }
  };

  constructor(private formFielService: FormFieldService,
    private restService: RestService,
    private formDataService: FormDataService,
    private additemservice: AddItemService,
  ) { }


  MenuButtons: Menubuttons[] = [
    {
      label: 'Claim Type',
      name: 'Claim Type',
      icon: 'bi bi-lightbulb',
      route: '/claim/claimtype',
    },
    {
      label: 'Rule Settings',
      name: 'Rule Settings',
      icon: 'bi bi-lightbulb',
      route: '/claim/ruleSetup',
    },
  ]



  popupLoaded(data: any) {
    if (data) {
      let limitType = data.header.limitType;
      if (limitType) {
        this.changelimitType(limitType);
      }
    }
  }


  changeEvent(data: any) {
    switch (data.control) {
      case 'code':
        this.changeDescription(data);
        break;
      case 'limitType':
        this.changelimitType(data.data);
        break;
      case 'vatCode':
        this.vatCodePercentage(data.data)
    }
  }

  changeDescription(data: any) {
    this.restService.get("/employeeClaimTypes?$filter=code eq '" + data.data + "'").subscribe((response: any) => {
      if (response) {
        this.formDataService.updateControlData$.next({ control: 'description', data: response.value[0].description });
      }
    });
  }

  changelimitType(data: any) {
    if (data == 'KM') {
      setTimeout(() => {
        this.formDataService.enableControlsList$.next(['rate', 'motorcycleRate', 'vehicleRate']);
        this.formDataService.disableControlsList$.next(['limitValue']);
        // this.formDataService.updateControlData$.next({ control: 'limitValue', data: '', eventEmit: true });
        this.formDataService.updateControlsListData$.next([{ control: 'limitValue', data: null }]);
      }, 100)
    } else if (data == 'Amount' || data == 'Days') {
      setTimeout(() => {
        this.formDataService.enableControlsList$.next(['limitValue']);
        this.formDataService.disableControlsList$.next(['rate', 'motorcycleRate', 'vehicleRate']);
        //this.formDataService.updateControlData$.next({ control: 'rate', data: '', eventEmit: true });
        this.formDataService.updateControlsListData$.next([{ control: 'rate', data: null }, { control: 'motorcycleRate', data: null }, { control: 'vehicleRate', data: null }]);
      }, 100)
    }
  }



  vatCodePercentage(data: string) {
    this.additemservice.showLoader$.next(true);
    this.restService.get('/vatPostingSetups').subscribe({
      next: (res: any) => {
        const vatPostingSetups = res?.value ?? res;

        if (Array.isArray(vatPostingSetups)) {
          const match = vatPostingSetups.find((e: any) => e.vatProdPostingGroup == data);

          if (match) {
            this.formDataService.updateControlData$.next({ control: 'vat', data: match.vat });
          } else {
          }
        } else {
        }
        this.additemservice.showLoader$.next(false);
      },
      error: (err) => {
        this.additemservice.showLoader$.next(false);
      }
    });
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'fieldPermission') {
      this.fieldPermission(buttonData)
    }
  }


  async fieldPermission(buttonData: CustomButtonEvent) {
    const payload = this.buildExpTypeFieldPermissionPayload(buttonData);

    if (!payload.length) {
      return;
    }

    const expenseType = buttonData?.headerData?.code;
    if (!expenseType) return;

    this.additemservice.showLoader$.next(true);

    try {
      const existingRes: any = await this.restService
        .get(`/expTypeConfigs?$filter=expenseType eq '${expenseType}'`)
        .toPromise();

      const existing = existingRes?.value ?? existingRes ?? [];

      const existingKeySet = new Set(
        existing
          .filter((e: any) => e.fieldName)
          .map((e: any) =>
            `${e.expenseType}|${e.fieldName}`.toLowerCase()
          )
      );

      for (const item of payload) {
        const key = `${item.expenseType}|${item.fieldName}`.toLowerCase();

        if (existingKeySet.has(key)) {
          continue;
        }

        await this.restService
          .post('/expTypeConfigs', item)
          .toPromise();
      }

    } finally {
      this.additemservice.showLoader$.next(false);
      this.additemservice.refreshData$.next(true);
    }
  }




  buildExpTypeFieldPermissionPayload(buttonData: any) {
    const expenseType = buttonData?.headerData?.code;
    if (!expenseType) return [];

    const lineControls = EmployeeClaimLime?.controls ?? [];
    return lineControls
      .filter(ctrl =>
        ctrl &&
        //ctrl.inputFromLine == true &&
        ctrl.label &&
        ctrl.type !== 11
      )
      .map(ctrl => ({
        expenseType,
        fieldName: ctrl.label,
        isVisible: true
      }));
  }






}
