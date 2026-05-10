import { Component, OnDestroy } from '@angular/core';
import { ListTableConfig } from '../../../core/models/shared/list-table.config';
import { ClaimRuleConfig, } from './claim-rule-setup.config';

import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { EventDataModel } from '../../../core/models/shared/eventDataModel';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { ToastrService } from 'ngx-toastr';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { SessionService } from '../../../core/services/session.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';

@Component({
  standalone: false,
  selector: 'app-claim-rule-setup',
  template: `<app-data-table [config]="config" [MenuButtons]="MenuButtons" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (leaveEvent)="leaveEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>`
})
export class ClaimRuleSetupComponent implements OnDestroy {
  groupBasedData!: any[];
  roleBasedData!: any[];
  countryBasedData!: any[];
  employeeBasedData!: any[];
  departmentBasedData!: any[];
  private destroy$ = new Subject<void>();

  config: DataTableConfig = {
    title: 'Claim Rule Setup',
    idProp: 'systemId',
    headerApi: '/ClaimRuleSetups',
    pageName: 'CLAIM_RULE_SETUP',
    headers: [
      { name: 'Code', prop: 'claimTypeCode', isPrimaryLink: true },
      { name: 'Condition Type', prop: 'conditionType' },
      { name: 'Applicable To', prop: 'applicableToID' },
      { name: 'Entitlement Code', prop: 'entitlementCode' },
      { name: 'Limit Value', prop: 'limitValue' },
      { name: 'Limit Type', prop: 'limitType' },
      { name: 'Status', prop: 'status' }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Claim Rule',
      recordId: 'claimTypeCode',
      recordTitle: 'claimTypeCode',
      headerConfig: ClaimRuleConfig
    }
  };

  MenuButtons: Menubuttons[] = [
    { label: 'Suggest Rules', name: 'Suggest Rules', icon: 'bi bi-gear', fn: () => this.suggestRule(), },
    { label: 'Rule Settings', name: 'Rule Settings', icon: 'bi bi-lightbulb', route: '/claim/ruleSetup', isEnable: false },
  ]

  constructor(
    private restService: RestService,
    private formFieldService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private toastr: ToastrService,
    private sessionService: SessionService,
    private dialogService: UnifiedDialogService
  ) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDropdown(
    label: string,
    items: any[],
    displayFormat: string,
    bindValue: string,
    value: any,
    rowIndex: number
  ) {
    this.formFieldService.updateDropdownItem$.next({ //reset dropdown
      label,
      items: [],
      displayFormat: '',
      bindValue: '',
      rowIndex
    });
    setTimeout(() => {
      this.formFieldService.updateDropdownItem$.next({ //update value in dropdown
        label,
        items,
        displayFormat,
        bindValue,
        rowIndex
      });
      setTimeout(() => {
        this.formDataService.updateControlData$.next({ // update controle data 
          control: label,
          data: value,
          eventEmit: true
        });
      }, 0);
    }, 0);
  }


  popupLoaded(data: any) {
    if (!data) return;
    if (data.header.limitType) {
      this.changelimitType(data.header.limitType);
    }
    const rowIndex = data.rowIndex;
    const applicableValue = data.applicableToID;

    switch (data.header.conditionType) {
      case 'Group-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        if (this.groupBasedData) {
          this.updateDropdown('applicableToID', this.groupBasedData, '[groupId]', 'groupId', applicableValue, rowIndex);
          setTimeout(() => {
            this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
          }, 100);
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/staffGroups').subscribe((response: any) => {
            this.groupBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.updateDropdown('applicableToID', this.groupBasedData, '[groupId]', 'groupId', applicableValue, rowIndex);
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
            }, 100);
          });
        }
        break;

      case 'Role-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        if (this.roleBasedData) {
          this.updateDropdown('applicableToID', this.roleBasedData, '[roleId]', 'roleId', applicableValue, rowIndex);
          setTimeout(() => {
            this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
          }, 100);
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/employeeRoles').subscribe((response: any) => {
            this.roleBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.updateDropdown('applicableToID', this.roleBasedData, '[roleId]', 'roleId', applicableValue, rowIndex);
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
            }, 100);
          });
        }
        break;

      case 'Country-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        if (this.countryBasedData) {
          this.updateDropdown('applicableToID', this.countryBasedData, '[Code] - [Name]', 'Code', applicableValue, rowIndex);
          setTimeout(() => {
            this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
          }, 100);
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/countryRegionCodes').subscribe((response: any) => {
            this.countryBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.updateDropdown('applicableToID', this.countryBasedData, '[Code] - [Name]', 'Code', applicableValue, rowIndex);
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
            }, 100);
          });
        }
        break;

      case 'Employee-Based':
        this.formDataService.enableControlsList$.next(['entitlementCode']);
        if (this.employeeBasedData) {
          this.updateDropdown('applicableToID', this.employeeBasedData, '[no] - [firstName] [lastName]', 'no', applicableValue, rowIndex);
          setTimeout(() => {
            this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
          }, 100);
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/employees').subscribe((response: any) => {
            this.employeeBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.updateDropdown('applicableToID', this.employeeBasedData, '[no] - [firstName] [lastName]', 'no', applicableValue, rowIndex);
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
            }, 100);
          });
        }
        break;

      case 'Department-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        if (this.departmentBasedData) {
          this.updateDropdown('applicableToID', this.departmentBasedData, '[departmentId] - [departmentName]', 'departmentId', applicableValue, rowIndex);
          setTimeout(() => {
            this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
          }, 100);
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/employeeDepartments').subscribe((response: any) => {
            this.departmentBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.updateDropdown('applicableToID', this.departmentBasedData, '[departmentId] - [departmentName]', 'departmentId', applicableValue, rowIndex);
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'applicableToID', data: data.header.applicableToID });
            }, 100);
          });
        }
        break;
    }

    if (data.header.enablePAX == true) {
      this.formDataService.enableControlsList$.next(['paxLimit']);
    } else {
      this.formDataService.disableControlsList$.next(['paxLimit']);
    }
  }



  async buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label == 'managePaxLimit') {
      await this.openManagePaxLimitPopup(buttonData);
    }
    else if (buttonData.button.label == 'ResetPaxLimit') {
      this.resetPaxLimit(buttonData);
    }

  }




  changeEvent(data: EventDataModel) {
    switch (data.control) {
      case 'conditionType':
        this.changeApplicableToID(data);
        break;
      case 'limitType':
        this.changelimitType(data.data);
        break;
      case 'claimTypeCode':
        this.changeClaimTypeCode(data.data);
        break;
      case 'entitlementCode':
        this.changeEntitlementCode(data.data);
        break;
      case 'enablePAX':
        this.enablePAX(data);
        break;

    }
  }

  leaveEvent(data: FormDataModel) {
    switch (data.control) {
      case 'paxLimit':
        this.chackPaxLimit(data);
        break;
    }
  }

  changeEntitlementCode(data: any) {
    setTimeout(() => {
      this.restService.get(`/entitlements?$filter=code eq '${data}'`).subscribe((res: any) => {
        let resData = res.value[0];
        this.formDataService.updateControlData$.next({ control: 'limitValue', data: resData.amount });
      })
    }, 100)
  }

  changeClaimTypeCode(data: EventDataModel) {
    setTimeout(() => {
      this.restService.get(`/expenseClaimTypes?$filter=code eq '${data}'`).subscribe((res: any) => {
        let resData = res.value[0];
        this.formDataService.updateControlData$.next({ control: 'limitType', data: resData.limitType });
        this.changelimitType(resData.limitType);
      })
    }, 100)
  }

  changeApplicableToID(data: EventDataModel) {
    switch (data.data) {
      case 'Group-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        this.formDataService.updateControlData$.next({ control: 'entitlementCode', data: '' });
        this.formDataService.updateControlData$.next({ control: 'applicableToID', data: '' });
        if (this.groupBasedData) {
          this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.groupBasedData, displayFormat: '[groupId]', bindValue: 'groupId', });
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/staffGroups').subscribe((response: any) => {
            this.groupBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.groupBasedData, displayFormat: '[groupId]', bindValue: 'groupId', });
          });
        }
        break;

      case 'Role-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        this.formDataService.updateControlData$.next({ control: 'entitlementCode', data: '' });
        this.formDataService.updateControlData$.next({ control: 'applicableToID', data: '' });
        if (this.roleBasedData) {
          this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.roleBasedData, displayFormat: '[roleId]', bindValue: 'roleId', });
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/employeeRoles').subscribe((response: any) => {
            this.roleBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.roleBasedData, displayFormat: '[roleId]', bindValue: 'roleId', });
          });
        }
        break;

      case 'Country-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        this.formDataService.updateControlData$.next({ control: 'entitlementCode', data: '' });
        this.formDataService.updateControlData$.next({ control: 'applicableToID', data: '' });
        if (this.countryBasedData) {
          this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.countryBasedData, displayFormat: '[Code] - [Name]', bindValue: 'Code', });
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/countryRegionCodes').subscribe((response: any) => {
            this.countryBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.countryBasedData, displayFormat: '[Code] - [Name]', bindValue: 'Code', });
          });
        }
        break;

      case 'Employee-Based':
        this.formDataService.enableControlsList$.next(['entitlementCode']);
        this.formDataService.updateControlData$.next({ control: 'applicableToID', data: '' });
        if (this.employeeBasedData) {
          this.formFieldService.updateDropdownItem$.next({
            label: 'applicableToID', items: this.employeeBasedData, displayFormat: '[no] - [firstName] [lastName]', bindValue: 'no',
          });
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/employees').subscribe((response: any) => {
            this.employeeBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.formFieldService.updateDropdownItem$.next({
              label: 'applicableToID', items: this.employeeBasedData, displayFormat: '[no] - [firstName] [lastName]', bindValue: 'no',
            });
          });
        }
        break;

      case 'Department-Based':
        this.formDataService.disableControlsList$.next(['entitlementCode']);
        this.formDataService.updateControlData$.next({ control: 'entitlementCode', data: '' });
        this.formDataService.updateControlData$.next({ control: 'applicableToID', data: '' });
        if (this.departmentBasedData) {
          this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.departmentBasedData, displayFormat: '[departmentId] - [departmentName]', bindValue: 'departmentId', });
        } else {
          this.addItemService.showLoader$.next(true);
          this.restService.get('/employeeDepartments').subscribe((response: any) => {
            this.departmentBasedData = response.value;
            this.addItemService.showLoader$.next(false);
            this.formFieldService.updateDropdownItem$.next({ label: 'applicableToID', items: this.departmentBasedData, displayFormat: '[departmentId] - [departmentName]', bindValue: 'departmentId', });
          });
        }
        break;
    }
  }

  changelimitType(data: any) {
    if (data == 'KM') {
      setTimeout(() => {
        this.formDataService.enableControlsList$.next(['rate', 'motorcycleRate', 'vehicleRate']);
        this.formDataService.disableControlsList$.next(['limitValue']);
        // this.formDataService.updateControlData$.next({ control: 'limitValue', data: 0, eventEmit: true });
      }, 100)
    } else if (data == 'Amount' || data == 'Days') {
      setTimeout(() => {
        this.formDataService.enableControlsList$.next(['limitValue']);
        this.formDataService.disableControlsList$.next(['rate', 'motorcycleRate', 'vehicleRate']);
        // this.formDataService.updateControlData$.next({ control: 'rate', data: 0, eventEmit: true });
      }, 100)
    }
  }



  async suggestRule() {
    const confirmed = await this.dialogService.confirm({
      message: 'Are you sure you want to create new suggest rules? This action cannot be undone.',
      yesButtonText: 'Yes, Please',
      noButtonText: 'No',
      showAsNotification: false,
      modalOptions: { windowClass: 'modal-dialog-confirm' }
    });

    if (confirmed) {
      this.suggestDynamicRules();
    }
  }


  claimTypeCode: any[] = [];
  staffGroups: any[] = [];
  roles: any[] = [];
  departments: any[] = [];
  employees: any[] = [];
  // countries: string[] = ['Malaysia'];
  generatedRules: any[] = [];

  suggestDynamicRules(): void {
    const today = new Date().toISOString().split('T')[0];
    this.addItemService.showLoader$.next(true);

    forkJoin([
      // this.restService.get('/employeeClaimTypes'),
      this.restService.get('/expenseClaimTypes'),
      this.restService.get('/staffGroups'),
      this.restService.get('/employeeRoles'),
      this.restService.get('/employeeDepartments'),
      this.restService.get('/countryRegionCodes'),
      this.restService.get('/employees'),
      this.restService.get('/ClaimRuleSetups'),
      this.restService.get('/expenseClaimTypes'),
      this.restService.get('/empClaimSetups')
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe((responses: any[]) => {
        const claimTypes = responses[0]?.value || [];
        const staffGroups = responses[1]?.value || [];
        const roles = responses[2]?.value || [];
        const departments = responses[3]?.value || [];
        const allCountries = responses[4]?.value || [];
        const employees = responses[5]?.value || [];
        const existingRules = responses[6]?.value || [];
        const expenseTypes = responses[7]?.value || [];
        // const defaultCountryCode = responses[8].value?.[0]?.defaultCountry || '';
        const empClaimSetupsRes = responses[8].value?.[0];
        // const countries = allCountries.filter((country: any) =>
        //   country.Code?.trim().toLowerCase() === defaultCountryCode.toLowerCase()
        // );

        const conditionMap: Record<string, any[]> = {
          'Group-Based': staffGroups,
          'Role-Based': roles,
          'Department-Based': departments,
          // 'Country-Based': empClaimSetupsRes.defaultCountry,
          'Country-Based': empClaimSetupsRes?.defaultCountry ? [empClaimSetupsRes.defaultCountry] : [],
          'Employee-Based': employees
        };

        const suggestedRules: any[] = [];

        for (const ct of claimTypes) {
          const claimType = ct.code?.trim();
          if (!claimType) continue;

          for (const conditionType in conditionMap) {
            const applicableList = conditionMap[conditionType];

            for (const item of applicableList) {
              const applicableToID = this.getApplicableToValue(conditionType, item)?.trim();
              if (!applicableToID) continue;

              const matchingExpense = expenseTypes.find((et: any) =>
                et.code?.trim().toLowerCase() === claimType.toLowerCase()
              );
              const limitType = matchingExpense?.limitType;
              const limitValue = matchingExpense?.limitValue;
              const rate = matchingExpense?.rate;
              const motorcycleRate = matchingExpense?.motorcycleRate;
              const vehicleRate = matchingExpense?.vehicleRate;

              const alreadyExists = this.isDuplicateRule(existingRules, claimType, conditionType, applicableToID);

              if (!alreadyExists) {
                suggestedRules.push({
                  claimTypeCode: claimType,
                  conditionType,
                  applicableToID,
                  limitType,
                  limitValue,
                  rate,
                  motorcycleRate,
                  vehicleRate,
                  allowOverseas: empClaimSetupsRes?.allowOverseas,
                  attachmentRequired: empClaimSetupsRes?.attachmentRequired,
                  chargeableOption: empClaimSetupsRes?.chargeable,
                  status: 'Active',
                  currencyCode: empClaimSetupsRes?.currencyCode ?? 'MYR',
                  maxClaimsPerMonth: empClaimSetupsRes?.maxClaimsPerMonth,
                  // limitPeriod: empClaimSetupsRes?.limitPeriod,
                  // maxClaimAmountPerLine: empClaimSetupsRes?.maxClaimAmountPerLine,
                  company: this.sessionService.CompanyName,
                  companyId: this.sessionService.Company,
                  createdBy: this.sessionService.UserId,
                  portalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
                  userId: this.sessionService.UserId
                });
              } else {
                // console.log('Skipping (already exists):', { claimType, conditionType, applicableToID });
              }
            }
          }
        }

        if (suggestedRules.length > 0) {
          this.postRulesRecursively(suggestedRules);
        } else {
          this.toastr.info('All dynamic rule combinations already exist.');
          this.addItemService.showLoader$.next(false);
        }
      }, error => {
        this.toastr.error('Failed to suggest dynamic rules.');
        this.addItemService.showLoader$.next(false);
      });
  }

  postRulesRecursively(rules: any[], index = 0, insertedCount = 0): void {
    if (index >= rules.length) {
      this.toastr.success(`${insertedCount} dynamic rules added.`);
      this.addItemService.showLoader$.next(false);
      this.addItemService.refreshData$.next(true);
      return;
    }

    const rule = rules[index];
    this.restService.post('/ClaimRuleSetups', rule)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.postRulesRecursively(rules, index + 1, insertedCount + 1);
        },
        error: (error) => {
          this.toastr.error(`Failed to insert rule: ${rule.claimTypeCode} - ${rule.conditionType}`);
          this.addItemService.showLoader$.next(false);
        }
      });
  }

  private isDuplicateRule(existing: any[], claimTypeCode: string, conditionType: string, applicableToID: string): boolean {
    return existing.some(r =>
      (r.claimTypeCode || '').toLowerCase().trim() === claimTypeCode.toLowerCase().trim() &&
      (r.conditionType || '').toLowerCase().trim() === conditionType.toLowerCase().trim() &&
      (r.applicableToID || '').toLowerCase().trim() === applicableToID.toLowerCase().trim()
    );
  }

  getApplicableToValue(conditionType: string, item: any): string {
    switch (conditionType) {
      case 'Group-Based': return item.groupId || item.groupName || '';
      case 'Role-Based': return item.roleId || item.roleName || '';
      case 'Department-Based': return item.departmentId || item.departmentName || '';
      case 'Country-Based': return item.Code || item.Name || item.countryName || '';
      case 'Employee-Based': return item.no || `${item.firstName || ''} ${item.lastName || ''}`.trim();
      default: return '';
    }
  }

  enablePAX(data: EventDataModel) {
    if (data.data) {
      this.formDataService.enableControlsList$.next(['paxLimit']);
    } else {
      this.formDataService.disableControlsList$.next(['paxLimit']);
    }
  }

  async chackPaxLimit(data: FormDataModel) {
    console.log("leave data=", data);

    if (data.data.paxLimit > data.data.limitValue) {

      const result = await this.dialogService.alert('custom', {
        title: 'Warning',
        text: 'Pax limit should not be greater than Limit value!'
      });

      if (result.isConfirmed) {
        const systemId = data.headerData.systemId;
        const etag = data.headerData['@odata.etag'];

        let api = `${this.config.headerApi}(${systemId})`;
        let payload = { paxLimit: 0 };
        this.formDataService.updateControlData$.next({
          control: 'paxLimit',
          data: 0
        });

        this.restService.patch(api, payload, etag).subscribe();
      }
    }
  }



  async openManagePaxLimitPopup(data: any) {
    const currentPaxLimit =
      parseInt(String(data?.header?.paxLimit ?? data?.headerData?.paxLimit ?? 0), 10) || 0;

    const limitValue =
      parseInt(String(data?.header?.limitValue ?? data?.headerData?.limitValue ?? 0), 10) || 0;

    const result = await this.dialogService.showAlert('custom', {
      title: 'Manage Pax Limit',
      html: `
      <div style="margin-bottom:10px; font-size:14px;">
        <b>Limit Value:</b> ${limitValue}
      </div>
    `,
      input: 'text',
      inputLabel: 'Enter Pax Limit',
      inputValue: String(currentPaxLimit),
      inputPlaceholder: 'Enter pax limit',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      preConfirm: (value:any) => {
        const rawValue = String(value ?? '').trim();

        if (rawValue === '') {
          return 0;
        }

        if (!/^\d+$/.test(rawValue)) {
          this.toastr.error('Please enter a valid whole number.');
          return false;
        }

        const enteredValue = parseInt(rawValue, 10);

        if (enteredValue > limitValue) {
          this.toastr.error(`Pax limit cannot be greater than Limit Value (${limitValue}).`);
          return false;
        }

        return enteredValue;
      }
    });

    if (!result.isConfirmed) return;

    const enteredValue = parseInt(String(result.value ?? 0), 10) || 0;
    const paxLimit = enteredValue > 0 ? enteredValue : 0;
    const enablePAX = paxLimit > 0;

    this.updatePaxFields(data, paxLimit, enablePAX);
  }


  resetPaxLimit(data: any) {
    this.updatePaxFields(data, 0, false);
  }

  private updatePaxFields(data: any, paxLimit: number, enablePAX: boolean) {
    const systemId = data?.header?.systemId || data?.headerData?.systemId;
    if (!systemId) return;

    this.formDataService.updateControlData$.next({
      control: 'paxLimit',
      data: paxLimit,
      eventEmit: true
    });

    this.formDataService.updateControlData$.next({
      control: 'enablePAX',
      data: enablePAX,
      eventEmit: true
    });

    if (enablePAX) {
      this.formDataService.enableControlsList$.next(['paxLimit']);
    } else {
      this.formDataService.disableControlsList$.next(['paxLimit']);
    }

    const getApi = `${this.config.headerApi}?$filter=systemId eq ${systemId}`;

    this.restService.get(getApi).subscribe({
      next: (res: any) => {
        const latest = res?.value?.[0];
        const etag = latest?.['@odata.etag'];

        if (!latest || !etag) {
          this.toastr.error('Unable to get latest record version.');
          return;
        }

        const patchApi = `${this.config.headerApi}(${systemId})`;
        const payload = { paxLimit, enablePAX };

        this.restService.patch(patchApi, payload, etag).subscribe({
          next: () => {
            this.toastr.success('Pax limit updated successfully.');
            this.addItemService.refreshData$.next(true);
          },
          error: (err) => {
            this.toastr.error(err?.error?.error?.message || 'Failed to update pax limit.');
          }
        });
      },
      error: () => {
        this.toastr.error('Failed to get latest record before updating.');
      }
    });
  }
}