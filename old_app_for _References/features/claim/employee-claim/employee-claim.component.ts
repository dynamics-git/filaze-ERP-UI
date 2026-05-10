import { ApplicationRef, Component, NgZone } from '@angular/core';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { EmployeeClaimHeader, EmployeeClaimLime, EmployeeClaimCalculation } from './employee-claim.config';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { RestService } from '../../../core/services/rest.service';
import { finalize, firstValueFrom, forkJoin, take } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { DatePipe } from '@angular/common';
import { Utility } from '../../../core/services/utility.service';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { SessionService } from '../../../core/services/session.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { DEFAULT_SUMMARY_FIELDS, EMPLOYEE_CLAIM_LINE_SUMMARY } from '../../../shared/components/summary/summary.config';
import { rejectLineConfig } from './reject-line.config';
import { ManagePaxComponent } from '../manage-pax/manage-pax.component';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';

@Component({
  standalone: false,
  selector: 'app-employee-claim',
  template: '<app-data-table [config]="config" (beforeCreate)="checkEmployeeId($event)" (popupLoaded)="popupLoaded($event)" (popupAddNewPostResponse)="popupAddNewPostResponse($event)" (drawerOpen)="drawerOpen($event)"  (drawerClosed)="drawerClosed($event)" (dropdownOpend)="dropdownOpend($event)" (drawerStateChange)="drawerStateChangeForClaim($event)" (changeEvent)="changeEvent($event)"  (leaveEvent)="leaveEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>'
})
export class EmployeeClaimComponent {

  /** Batch statuses that lock line editing */
  private readonly LOCKED_BATCH_STATUSES = [
    'Submitted', 'Approved', 'ReSubmitted', 'Finance Review',
    'Ready For Batch', 'In Batch', 'Payment Initiated', 'Paid'
  ];
  private cachedApiLines: any[] = [];

  headerEmployeeNo!: string;
  claimEmployeeNo!: string;
  claimNumber!: string;
  approvalRule!: any;
  expenseTypeRuleValue!: any[];
  lineList: any[] = [];
  config: DataTableConfig = {
    title: 'Employee Claim',
    idProp: 'systemId',
    headerApi: '/employeeClaimHdrs',
    pageName: 'EMP CLAIM',
    fileUrlProp: 'FileUrl',
    headerApiOrderByField: 'claimNo',
    headers: [
      { name: 'No', prop: 'claimNo', isPrimaryLink: true },
      { name: 'Employee No', prop: 'employeeNo' },
      { name: 'Employee Name', prop: 'employeeName' },
      { name: 'Claim Date', prop: 'claimDate' },
      { name: 'Approval Status', prop: 'approvalStatus' },
      { name: 'Batch Status', prop: 'batchStatus' },
      { name: 'Approved By', prop: 'approvedBy' },
      { name: 'Remarks', prop: 'remarks' },
      { name: 'Amount', prop: 'totalClaimAmount' },
      { name: 'Claim Month', prop: 'claimMonth' },
      { name: 'Creation Date', prop: 'creationDate' },
    ],
    removeUnicodeCharFields: ['batchStatus', 'approvalStatus'],
    selctionType: 'single',
    filterByUserCompanyResCenter: true,
    filters: [
      {
        field: 'UserId',
        operator: 'eq',
        value: `'${this.sessionService.UserId}'`
      },
      {
        field: 'batchStatus',
        operator: 'ne',
        value: `'Paid'`
      },
    ],
    filterConfig: [
      {
        field: 'employeeNo',
        label: 'Employee No',
        type: 'text'
      },
      // {
      //   field: 'employeeNo',
      //   label: 'Employee No',
      //   type: 'dropdown',
      //   apiUrl: '/employees',
      //   valueField: 'no',
      //   labelField: 'no'
      // },
      {
        field: 'employeeName',
        label: 'Employee Name',
        type: 'text'
      },
      {
        field: 'claimDate',
        label: 'Claim Date',
        type: 'date'
      },
      {
        field: 'approvalStatus',
        label: 'Approval Status',
        type: 'dropdown',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'Pending For Approval', label: 'Pending For Approval' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Rejected', label: 'Rejected' }
        ]
      },
      {
        field: 'batchStatus',
        label: 'Batch Status',
        type: 'dropdown',
        options: [
          { value: 'Draft', label: 'Draft' },
          { value: 'Submitted', label: 'Submitted' },
          { value: 'Returned', label: 'Returned' },
          { value: 'ReSubmitted', label: 'ReSubmitted' },
          { value: 'Finance Review', label: 'Finance Review' },
          { value: 'Ready For Batch', label: 'Ready For Batch' },
          { value: 'In Batch', label: 'In Batch' },
          { value: 'Payment Initiated', label: 'Payment Initiated' },
          { value: 'Paid', label: 'Paid' }
        ]
      },
      {
        field: 'totalClaimAmount',
        label: 'Amount',
        type: 'number'
      },
      {
        field: 'claimMonth',
        label: 'Claim Month',
        type: 'dropdown',
        options: [
          { value: 'January', label: 'January' },
          { value: 'February', label: 'February' },
          { value: 'March', label: 'March' },
          { value: 'April', label: 'April' },
          { value: 'May', label: 'May' },
          { value: 'June', label: 'June' },
          { value: 'July', label: 'July' },
          { value: 'August', label: 'August' },
          { value: 'September', label: 'September' },
          { value: 'October', label: 'October' },
          { value: 'November', label: 'November' },
          { value: 'December', label: 'December' }
        ]
      },
      {
        field: 'creationDate',
        label: 'Creation Date',
        type: 'date'
      }
    ],
    addItemConfig: {
      title: 'Employee Claim',
      recordId: 'claimNo',
      recordTitle: 'claimNo',
      headerConfig: EmployeeClaimHeader,
      lineConfig: EmployeeClaimLime,
      calculationSectionConfig: EmployeeClaimCalculation,
      informationSectionConfig: {
        documentNoProp: 'claimNo',
        documentType: 'Employee Claim',
        documentStatusProp: 'EmployeeClaim',
        summaryFields: DEFAULT_SUMMARY_FIELDS,
        SummaryFieldConfigLine: EMPLOYEE_CLAIM_LINE_SUMMARY,
      }
    },
    factBoxConfig: {
      boxType: FactBoxType.EmployeeClaim
    },
  };
  employees: any[] = [];
  rules: any[] = [];
  claimSetups: any;
  totalClaimAmount!: number;
  monthlyClaimAmount!: number;
  allTotalClaimAmount!: number;
  totalClaimAmountHeader!: number;
  approvalEntriesResponse!: any;
  private rejectPopupRef: any;
  selectedEmployeeId: any;
  isRepresentativeSubmission: boolean = false;

  constructor(
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private restService: RestService,
    private toastr: ToastrService,
    private utility: Utility,
    private datepipe: DatePipe,
    private sessionService: SessionService,
    private modalService: NgbModal,
    private formFielService: FormFieldService,
    private selectedItemService: SelectedItemService,
    private appRef: ApplicationRef,
    private ngZone: NgZone,
    private universalPopupService: UniversalPopupService,
    private dialogService: UnifiedDialogService
  ) { }

  ngOnInit(): void {
    this.loadSetup();
    this.addItemService.addHeaderButtons$.next([]);
    this.addItemService.addLineButtons$.next([]);
  }

  private loadSetup() {
    forkJoin([
      this.restService.get('/employees'),
      this.restService.get('/ClaimRuleSetups'),
      this.restService.get('/empClaimSetups')
    ]).subscribe((responses: any[]) => {
      this.employees = responses[0].value;
      this.rules = responses[1].value;
      this.claimSetups = responses[2].value[0];
    });
  }

  async checkEmployeeId(event: any) {
    try {
      const userDetails = JSON.parse(
        localStorage.getItem('app-user-details') || '{}'
      );

      const loginEmployeeId = userDetails.employeeID;
      const loginUserId = userDetails.userId || userDetails.UserId;

      if (!loginEmployeeId) {
        this.toastr.warning('Have no employeeId');
        event.proceed(false);
        return;
      }

      let repUsers: any[] = [];
      try {
        const repRes: any = await firstValueFrom(
          this.restService.get(
            `/portalUsers?$filter=representativeID eq '${loginUserId}' and enableRepresentative eq true`
          )
        );
        repUsers = repRes?.value || [];
      } catch {
        repUsers = [];
      }

      if (!repUsers.length) {
        this.isRepresentativeSubmission = false;
        this.selectedEmployeeId = loginEmployeeId;
        event.proceed(true);
        return;
      }
      const claimType = await this.dialogService.chooseClaimType();

      if (!claimType) {
        event.proceed(false);
        return;
      }

      if (claimType === 'own') {
        this.isRepresentativeSubmission = false;
        this.selectedEmployeeId = loginEmployeeId;
        event.proceed(true);
        return;
      }

      if (claimType === 'representative') {
        this.isRepresentativeSubmission = true;
        this.addItemService.showLoader$.next(true);

        try {
          const selectedUserId = await this.dialogService.chooseRepresentativeUser(repUsers);

          if (!selectedUserId) {
            event.proceed(false);
            return;
          }

          const selectedUser = repUsers.find(
            (u: any) => u.UserId === selectedUserId
          );

          if (!selectedUser?.employeeID) {
            this.toastr.warning('Selected user has no employee ID');
            event.proceed(false);
            return;
          }

          this.selectedEmployeeId = selectedUser.employeeID;
          event.proceed(true);
        } finally {
          this.addItemService.showLoader$.next(false);
        }

        return;
      }

      event.proceed(false);
    } catch (error) {
      this.toastr.error('Something went wrong');
      event.proceed(false);
    }
  }


  async drawerStateChangeForClaim(data: { isOpen: boolean; index: number; fromValue: any }) {
    let ruledata: any = this.getLineRule(data.fromValue?.expenseType, { no: this.claimEmployeeNo });
    if (ruledata?.claimTypeCode == 'MILEAGE') {
      this.formDataService.updateControlData$.next({ control: 'motorcycleMileageRate', data: ruledata?.motorcycleRate });
      this.formDataService.updateControlData$.next({ control: 'carMileageRate', data: ruledata?.vehicleRate });
    }
    if (data.fromValue) {
      const status = data.fromValue.batchStatus?.toString().trim().toLowerCase();
      const editable = status === '' || status === 'draft' || status === 'returned';
      this.formDataService.disableDrawer$.next({
        isDisabled: !editable,
        rowIndex: data.index
      });
    }
    if (!data.isOpen) {
      return;
    }
    const expenseType = data.fromValue?.expenseType;
    if (!expenseType) {
      return;
    }
    setTimeout(() => {
      this.disableEnableLineControls(expenseType, data.index!);
    }, 20);
  }


  //TMY/Subhankar/09.09.2025/ When add new item(Post call) then add its emplyeeIn and employee name
  popupAddNewPostResponse(response: any) {
    this.addItemService.showLoader$.next(true);
    const employeeId = this.selectedEmployeeId;

    this.restService.get('/employees').subscribe((res: any) => {
      const employees = res.value || [];
      const employee = employees.find((emp: any) => emp.no === employeeId);

      if (!employee) {
        this.toastr.error('Employee not found');
        this.addItemService.showLoader$.next(false);
        return;
      }

      const query = `(${response.systemId})`;
      const ifMatchKey = response['@odata.etag'];
      this.claimNumber = response.claimNo;

      const patchData: any = {
        employeeNo: employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        departmentCode: employee.departmentId
      };

      const doPatch = () => {
        this.restService.patch(this.config.addItemConfig?.headerConfig?.api + query, patchData, ifMatchKey).subscribe({
          next: () => {
            this.restService.get(this.config.addItemConfig?.headerConfig?.api + query).subscribe({
              next: (res: any) => {
                this.formDataService.updateControlData$.next({
                  control: 'employeeNo',
                  data: res.employeeNo
                });

                this.claimEmployeeNo = res.employeeNo;

                this.formDataService.updateControlData$.next({
                  control: 'employeeName',
                  data: `${employee.firstName} ${employee.lastName}`
                });

                this.formDataService.updateControlData$.next({
                  control: 'departmentCode',
                  data: employee.departmentId,
                });

                this.addItemService.showLoader$.next(false);
                this.addItemService.refreshDataById$.next(true);
                this.addItemService.reloadHeaderById$.next(res.systemId);
              },
              error: () => {
                this.toastr.error('Failed to fetch updated data');
                this.addItemService.showLoader$.next(false);
              }
            });
          },
          error: () => {
            this.toastr.error('Failed to update record');
            this.addItemService.showLoader$.next(false);
          }
        });
      };

      if (this.isRepresentativeSubmission) {
        this.restService
          .get(`/portalUsers?$filter=employeeID eq '${employee.no}'`)
          .subscribe({
            next: (portalRes: any) => {
              const portalUser = portalRes?.value?.[0];

              if (!portalUser) {
                this.toastr.error('Portal user not found for selected employee');
                this.addItemService.showLoader$.next(false);
                return;
              }

              patchData.representorId = this.sessionService.UserId;
              patchData.UserId = portalUser.UserId;
              patchData.representorEmpNo = JSON.parse(
                localStorage.getItem('app-user-details') || '{}'
              ).employeeID;
              patchData.representativeSubmission = true;

              doPatch();
            },
            error: () => {
              this.toastr.error('Failed to load portal user');
              this.addItemService.showLoader$.next(false);
            }
          });

        return;
      }

      doPatch();
    });
  }


  popupLoaded(data: any) {
    this.lineList = data?.line ?? [];
    this.cachedApiLines = data?.line ?? [];
    this.claimEmployeeNo = data.header?.employeeNo;

    if (data.line) {
      data.line.forEach((line: any, rowIndex: number) => {
        if (!line || Object.keys(line).length === 0) return;

        // Lock line if batch status is beyond Draft
        if (this.isLineLocked(line)) {
          this.lockLineControls(rowIndex);
        }

        // Apply expense-type field visibility
        if (this.claimEmployeeNo) {
          const emp = this.employees.find((x: any) => x.no === this.claimEmployeeNo);
          if (emp) {
            const rule = this.getLineRule(line.expenseType, emp);
            if (rule) {
              this.disableEnableLineControls(line.expenseType, rowIndex);
            }
          }

          if (line.approvalStatus === 'Approved' || line.approvalStatus === 'Pending For Approval') {
            this.addItemService.isDisableAddButtonLine$.next(true);
            this.addItemService.isDisableDeleteButtonLine$.next(true);
          }
        }
      });

      if (this.claimEmployeeNo) {
        this.calculateTotalAmount(data.line);
      }
    }

    if (data.header?.approvalStatus === 'Approved' || data.header?.approvalStatus === 'Pending For Approval') {
      this.addItemService.disableAllControlsExceptSome$.next(['remarks']);
    }

    if (data.header?.approvalStatus === 'Pending For Approval') {
      this.checkForApprovalEntry(data);
    }
  }

  /** Check if a line's batch status locks editing */
  private isLineLocked(line: any): boolean {
    return this.LOCKED_BATCH_STATUSES.includes(line?.batchStatus);
  }

  /** Disable key line controls and drawer for a locked row */
  private lockLineControls(rowIndex: number): void {
    this.formDataService.disableLineControlsList$.next([
      { label: 'amount', rowIndex },
      { label: 'receiptNo', rowIndex },
      { label: 'expenseType', rowIndex },
      { label: 'receiptDate', rowIndex },
      { label: 'Chargeable', rowIndex }
    ]);
    this.formDataService.disableDrawer$.next({
      isDisabled: true,
      rowIndex
    });
  }


  checkForApprovalEntry(data: any) {
    if (data?.header?.approvalStatus !== 'Pending For Approval' || data?.linkItemType !== 'Employee Claim') {
      return;
    }
    this.addItemService.showLoader$.next(true);
    const url = "/approvalEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.claimNo + "' and documentType eq '" + data.linkItemType + "'";
    this.restService.get(url)
      .pipe(
        finalize(() => {
          this.addItemService.showLoader$.next(false);
        })
      )
      .subscribe({
        next: (res: any) => {
          const response = res?.value?.find((x: any) => (x.approverId) === this.sessionService.UserId);
          if (!response) {
            return;
          }
          setTimeout(() => {
            (document.activeElement as HTMLElement)?.blur();
            document.body.focus();
          }, 0);
          this.approvalEntriesResponse = response;
        },
        error: (err) => {
        }
      });
  }


  private calculateTotalAmount(lines: any) {
    let totalExcAmount: number = 0;
    let totalTax: number = 0;

    lines.forEach((line: any, rowIndex: number) => {
      totalExcAmount += line['amount'] ? +line['amount'] : 0;
      totalTax += line['taxAmount'] ? +line['taxAmount'] : 0;
    });
    this.totalClaimAmountHeader = totalExcAmount + totalTax;
    this.formDataService.updateControlData$.next({ control: 'totalExcAmount', data: totalExcAmount.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalTax', data: totalTax.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalClaimAmount', data: this.totalClaimAmountHeader.toFixed(2) });
  }

  changeEvent(data: EventDataModel) {
    if (data.section === SectionType.Header) {
      if (data.control === 'employeeNo') {
        this.changeEmployeeName(data);
      }
    }

    else if (data.section === SectionType.Line) {

      if (data.control === 'expenseType') {
        this.changeExpenseType(data);
      }

    }
  }


  private clearLineDataByExpenseType(data: EventDataModel) {
    setTimeout(() => {
      this.formDataService.updateLineControlData$.next({ control: 'fromLocation', data: '', rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'toLocation', data: '', rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'km', data: '', rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'typeOfTransportation', data: '', rowIndex: data.rowIndex });
      this.formDataService.updateLineControlData$.next({ control: 'taxAmount', data: '', rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'amount', data: '', rowIndex: data.rowIndex, eventEmit: true });
    }, 100);
  }


  dropdownOpend(event: any) {
    if (event.control === 'expenseType') {
      this.showExpensesTypeInDropDown(this.claimEmployeeNo, event.rowIndex);
    }
  }

  drawerClosed(event: any) {
    const index = event?.index ?? event;

    if (typeof index === 'number') {
      this.enableAllLineFields(index);
    }

    this.expenseTypeRuleValue = [];
  }

  drawerOpen(event: any) {
    const index = event?.index ?? event;
    this.enableAllLineFields(index);
  }

  showExpensesTypeInDropDown(empOrNo: any, rowIndex: any) {
    this.addItemService.showLoader$.next(true);
    try {
      if (this.expenseTypeRuleValue?.length > 0) {
        this.formFielService.updateDropdownItem$.next({
          label: 'expenseType',
          items: this.expenseTypeRuleValue,
          displayFormat: '[claimTypeCode]',
          bindValue: 'claimTypeCode',
          rowIndex: rowIndex
        });

        return;
      }
      const employeeNo =
        typeof empOrNo === 'string' ? empOrNo : empOrNo?.no ?? empOrNo?.employeeNo;
      if (!employeeNo) {
        return;
      }

      const emp = this.employees?.find((x: any) => x.no === employeeNo);
      if (!emp) {
        return;
      }

      const myValue = [...new Set((this.rules || []).map((r: any) => r.claimTypeCode))];

      const newRules = myValue
        .map((value: any) => this.getLineRule(value, emp))
        .filter((r: any) => r != null);

      if (newRules.length > 0) {
        this.expenseTypeRuleValue = newRules;
        this.formFielService.updateDropdownItem$.next({
          label: 'expenseType',
          items: this.expenseTypeRuleValue,
          displayFormat: '[claimTypeCode]',
          bindValue: 'claimTypeCode',
          rowIndex: rowIndex
        });
      } else {
        this.toastr.warning('No rules found for this employee');
      }
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }


  private changeExpenseType(data: EventDataModel) {
    const query = this.config.addItemConfig?.headerConfig?.api + '(' + data.headerData?.systemId + ')';
    const expenseType = data.activeData.expenseType;

    const process = (employeeNo: string) => {
      const emp = this.employees.find((x: any) => x.no === employeeNo);
      if (!emp) {
        this.toastr.error('Employee is not found');
        return;
      }


      const rule = this.getLineRule(expenseType, emp);
      if (!rule) {
        this.dialogService.openUiError(`You don't have permission for this expense type "${expenseType}"`, () => {
        });
      }
      this.disableEnableLineControls(expenseType, data.rowIndex!);
      this.calculateLineAmount(data, rule);
      setTimeout(() => {
        this.restService
          .get(`/expenseClaimTypes?$filter=code eq '${data.data}'`)
          .subscribe((res: any) => {
            const expenseType = res.value[0];
            const showMotorcycleRate = expenseType.motorcycleRate || 0;
            const showVehicleRate = expenseType.vehicleRate || 0;
            this.addItemService.patchLineData$.next({
              rowIndex: data.rowIndex!,
              data: {
                vatCode: expenseType?.vatCode,
                vat: expenseType?.vat,
                // currencyCode: rule.currencyCode,
                receiptDate: this.utility.convertStringToDateObj(
                  this.datepipe.transform(new Date(), 'yyyy-MM-dd')!),
                departmentCode: data.headerData.departmentCode,
                employeeNo: emp.no,
                employeeName: emp.firstName + " " + emp.lastName
              },
              disableControls: false
            });
            this.formDataService.updateLineControlData$.next({
              control: 'motorcycleMileageRate',
              data: showMotorcycleRate,
              rowIndex: data.rowIndex!,
            });

            this.formDataService.updateLineControlData$.next({
              control: 'carMileageRate',
              data: showVehicleRate,
              rowIndex: data.rowIndex!,
            });
          });
      }, 100);

    };

    if (this.headerEmployeeNo) {
      process(this.headerEmployeeNo);
    } else {
      this.restService.get(query).subscribe({
        next: (res: any) => {
          this.headerEmployeeNo = res.employeeNo;
          process(this.headerEmployeeNo);
        },
        error: () => {
          this.toastr.error('Failed to fetch employee data');
        }
      });
    }
  }


  private async changeLineAmount(data: FormDataModel) {
    const expenseType = data.activeData.expenseType;
    const employeeNo = data.activeData?.employeeNo || data.headerData?.employeeNo;
    if (!employeeNo) {
      this.showErrorModal('Please select Employee No.');
      return;
    }
    const emp = this.employees.find((x: any) => x.no === employeeNo);
    if (!emp) {
      this.showErrorModal('Employee is not found');
      return;
    }
    const rule = this.getLineRule(expenseType, emp);
    if (!rule) {
      this.showErrorModal(`No matching rule found for "${expenseType}".`);
      return;
    }
    const errors = await this.validateLineDataWithRule(data, rule);
    if (errors.length > 0) return;
    this.calculateAmount(data);
  }

  private calculateAmount(data: FormDataModel) {
    const lineAmount = Number(data.activeData.amount);
    const lineVatPercent = Number(data.activeData.vat);
    const taxAmountLine = (lineAmount * lineVatPercent) / 100;
    this.formDataService.updateLineControlData$.next({
      control: 'taxAmount',
      data: taxAmountLine,
      rowIndex: data.rowIndex,
      eventEmit: false
    });
    this.addItemService.patchLineData$.next({
      rowIndex: data.rowIndex!,
      data: { taxAmount: taxAmountLine },
      disableControls: false
    });
  }


  private changeLineKM(data: FormDataModel) {
    const expenseType = data.activeData.expenseType;
    const employeeNo = data.activeData?.employeeNo || data.headerData?.employeeNo;
    if (!employeeNo) {
      this.showErrorModal('Please select Employee No.');
      return;
    }
    const emp = this.employees.find((x: any) => x.no === employeeNo);
    if (!emp) {
      this.showErrorModal('Employee is not found');
      return;
    }
    const rule = this.getLineRule(expenseType, emp);
    if (!rule) {
      this.showErrorModal(`No matching rule found for "${expenseType}".`);
      return;
    }
    this.calculateLineAmount(data, rule);
    this.validateLineDataWithRule(data, rule);
  }

  private getLineRule(expenseType: string, emp: any) {
    const filtered = this.rules.filter((rule: any) =>
      rule.claimTypeCode === expenseType && rule.status === 'Active'
    );

    if (!filtered.length) return null;

    const priority = [
      'Employee-Based',
      'Department-Based',
      'Role-Based',
      'Group-Based',
      'Country-Based'
    ];

    for (const type of priority) {
      const matched = filtered.find((rule: any) => {
        switch (type) {
          case 'Employee-Based':
            return emp.no && rule.conditionType === type &&
              rule.applicableToID?.includes(emp.no);

          case 'Department-Based':
            return emp.departmentId && rule.conditionType === type &&
              rule.applicableToID?.includes(emp.departmentId);

          case 'Role-Based':
            return emp.roleId && rule.conditionType === type &&
              rule.applicableToID?.includes(emp.roleId);

          case 'Group-Based':
            return emp.staffGroupId && rule.conditionType === type &&
              rule.applicableToID?.includes(emp.staffGroupId);

          case 'Country-Based':
            return emp.countryRegionCode && rule.conditionType === type &&
              rule.applicableToID?.includes(emp.countryRegionCode);

          default:
            return false;
        }
      });

      if (matched) return matched;
    }

    return null;
  }

  private normalizeField(field: string): string {
    return field.replace(/_/g, '').toLowerCase();
  }

  private async disableEnableLineControls(
    expenseType: string,
    rowIndex: number
  ): Promise<void> {
    this.enableAllLineFields(rowIndex);
    if (!expenseType) return;

    try {

      const res: any = await firstValueFrom(
        this.restService.get(`/expTypeConfigs?$filter=expenseType eq '${expenseType}'`)
      );

      const configs: any[] = res?.value ?? [];

      if (!configs.length) return;

      const controls =
        (EmployeeClaimLime?.controls ?? [])
          .filter(
            (ctrl): ctrl is { label: string } =>
              !!ctrl &&
              typeof ctrl.label === 'string' &&
              ctrl.type !== 11
          );

      const visibleFields = configs
        .filter(c => c?.isVisible && c?.fieldName)
        .map(c => this.normalizeField(c.fieldName));

      const fieldsToHide: { label: string, rowIndex: number }[] = [];

      controls.forEach(ctrl => {

        const normalized = this.normalizeField(ctrl.label);

        if (visibleFields.includes(normalized)) {
          this.formDataService.showLineControl$.next({
            label: ctrl.label,
            rowIndex
          });

        } else {
          fieldsToHide.push({
            label: ctrl.label,
            rowIndex
          });

        }

      });
      if (fieldsToHide.length) {
        this.formDataService.hideLineControlsList$.next(fieldsToHide);
      }

    } catch (error) {
    }
  }

  enableAllLineFields(rowIndex: number): void {

    const controls =
      (EmployeeClaimLime?.controls ?? [])
        .filter(
          (ctrl): ctrl is { label: string; hidden?: boolean } =>
            !!ctrl &&
            typeof ctrl.label === 'string' &&
            ctrl.type !== 11
        );
    controls.forEach(ctrl => {
      ctrl.hidden = false;

      this.formDataService.showLineControl$.next({
        label: ctrl.label,
        rowIndex
      });

      this.formDataService.enableLineControl$.next({
        label: ctrl.label,
        rowIndex
      });

    });

  }

  private calculateLineAmount(data: FormDataModel, rule: any) {
    // Auto-calculate amount if KM
    if (rule.limitType === 'KM') {

      const km = data.activeData?.km ?? 0;           // KM column
      const vatPercent = data.activeData?.vat ?? 0; // VAT %
      const typeOfTransportation = (data.activeData?.typeOfTransportation || '').trim();

      let rate = 0;

      if (typeOfTransportation === 'Motorcycle') {
        rate = rule.motorcycleRate ?? 0;
      }
      else if (typeOfTransportation === 'Vehicle') {
        rate = rule.vehicleRate ?? 0;
      }
      else {
        rate = rule.rate ?? 0; // default
      }

      const amount = km * rate;
      const taxAmount = (amount * vatPercent) / 100;

      // 🔥 Update single controls
      this.formDataService.updateLineControlData$.next({
        control: 'amount',
        data: amount,
        rowIndex: data.rowIndex
      });

      this.formDataService.updateLineControlData$.next({
        control: 'taxAmount',
        data: taxAmount,
        rowIndex: data.rowIndex
      });

      this.addItemService.patchLineData$.next({
        rowIndex: data.rowIndex!,
        data: { amount: amount, taxAmount: taxAmount, typeOfTransportation: typeOfTransportation },
        disableControls: false
      });
    }
  }


  calculateSameExpensesTypeAmount(data: FormDataModel, rule: any): { totalAmount: number, totalTax: number, totalClaim: number } {
    if (!data?.linesData || !rule?.claimTypeCode) {
      return { totalAmount: 0, totalTax: 0, totalClaim: 0 };
    }

    const claimTypeCode = rule.claimTypeCode;
    let totalAmount = 0;
    let totalTax = 0;

    data.linesData.forEach((item: any) => {
      if (item.expenseType === claimTypeCode) {
        const amount = Number(item.amount) || 0;
        const tax = Number(item.taxAmount) || 0;
        totalAmount += amount;
        totalTax += tax;
      }
    });

    const totalClaim = totalAmount + totalTax;
    return { totalAmount, totalTax, totalClaim };
  }


  private async validateLineDataWithRule(data: FormDataModel, rule: any): Promise<string[]> {
    const { totalAmount, totalTax, totalClaim } = this.calculateSameExpensesTypeAmount(data, rule);
    const errors: string[] = [];

    await new Promise(resolve => setTimeout(resolve, 100));
    const safePatchLine = async (patchData: any) => {
      (document.activeElement as HTMLElement)?.blur();
      await new Promise<void>(resolve => {
        const sub = this.appRef.isStable.subscribe(stable => {
          if (stable) {
            sub.unsubscribe();
            resolve();
          }
        });
      });
      await new Promise(r => setTimeout(r, 100));
      this.ngZone.run(() => {
        this.addItemService.patchLineData$.next(patchData);
      });
    };

    if (rule.limitType === 'Amount') {
      const amt = Number(totalClaim) || 0;
      if (rule.limitValue && amt > rule.limitValue) {
        this.showErrorModal(`Amount (${amt}) exceeds individual limit (${rule.limitValue}).`);
        setTimeout(() => {
          this.addItemService.patchLineData$.next({
            rowIndex: data.rowIndex!,
            data: { amount: 0, taxAmount: 0 },
            disableControls: false
          });
        }, 500)
        this.formDataService.updateLineControlData$.next({
          control: 'amount',
          data: 0,
          rowIndex: data.rowIndex
        });
        this.formDataService.updateLineControlData$.next({
          control: 'taxAmount',
          data: 0,
          rowIndex: data.rowIndex
        });

        return ['limitExceeded'];
      }
      if (rule.limitValue === 0 && amt > this.claimSetups.maxClaimAmountPerLine) {
        this.showErrorModal(
          `Line amount cannot exceed the maximum allowed per line (${this.claimSetups.maxClaimAmountPerLine}).`
        );
        setTimeout(() => {
          this.addItemService.patchLineData$.next({
            rowIndex: data.rowIndex!,
            data: { amount: 0, taxAmount: 0 },
            disableControls: false
          });
        }, 500)

        this.formDataService.updateLineControlData$.next({
          control: 'amount',
          data: 0,
          rowIndex: data.rowIndex
        });
        this.formDataService.updateLineControlData$.next({
          control: 'taxAmount',
          data: 0,
          rowIndex: data.rowIndex
        });

        return ['limitExceeded'];
      }
    }

    if (rule.limitType === 'KM') {
      const km = Number(data.activeData?.km) || 0;
      const typeOfTransportation = (data.activeData?.typeOfTransportation || '').trim();
      let rate = rule.rate ?? 0;
      if (typeOfTransportation === 'Motorcycle') rate = rule.motorcycleRate ?? 0;
      else if (typeOfTransportation === 'Vehicle') rate = rule.vehicleRate ?? 0;
      const claimAmountForKM = rate * km;
      if (claimAmountForKM > this.claimSetups.maxClaimAmountPerLine) {
        this.showErrorModal(
          `Claim amount exceeds the maximum allowed per line (${this.claimSetups.maxClaimAmountPerLine}). Please adjust KM.`
        );
        await safePatchLine({
          rowIndex: data.rowIndex!,
          data: { amount: 0, taxAmount: 0, km: 0 },
          disableControls: false
        });

        this.formDataService.updateLineControlData$.next({ control: 'km', data: 0, rowIndex: data.rowIndex });
        this.formDataService.updateLineControlData$.next({ control: 'amount', data: 0, rowIndex: data.rowIndex });
        this.formDataService.updateLineControlData$.next({ control: 'taxAmount', data: 0, rowIndex: data.rowIndex });

        return ['limitExceeded'];
      }

    }

    return errors;
  }


  private async maxAmountPerMonth(data: any, deleteLine?: boolean): Promise<boolean> {
    const lineData = data.lineData;
    this.addItemService.showLoader$.next(true);
    try {
      const monthlyLimit = this.claimSetups?.maxClaimsAmountPerMonth || 0;
      const limitPeriod = this.claimSetups?.limitPeriod;
      let totalAmountLimit = 0;

      if (limitPeriod == "Monthly") totalAmountLimit = monthlyLimit;
      else if (limitPeriod == "Quarterly") totalAmountLimit = monthlyLimit * 3;
      else if (limitPeriod == "Yearly") totalAmountLimit = monthlyLimit * 12;
      else totalAmountLimit = monthlyLimit;

      if (monthlyLimit === 0) {
        this.addItemService.showLoader$.next(false);
        return true;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let filter = "/employeeClaimLines";
      if (!this.sessionService.SuperAdmin) {
        let condition = `CompanyId eq ${this.sessionService.Company}`;
        if (this.sessionService.ResponsibilityCenterId) {
          condition += ` and PortalResponsibilityCentre eq '${this.sessionService.ResponsibilityCenterId}'`;
        }
        filter += `?$filter=${condition}`;
      }

      const response: any = await firstValueFrom(this.restService.get(filter));
      const lines = Array.isArray(response) ? response : response?.value || [];

      const thisMonthLines = lines.filter((line: any) => {
        if (!line.receiptDate) return false;
        const receiptDate = new Date(line.receiptDate);
        return (
          receiptDate.getMonth() === currentMonth &&
          receiptDate.getFullYear() === currentYear
        );
      });

      const totalClaimed = thisMonthLines.reduce((sum: number, line: any) => {
        const amount = Number(line.amount) || 0;
        const tax = Number(line.taxAmount) || 0;
        const total = amount + tax;
        const approval = (line.approvalStatus || "").trim().toLowerCase();
        const batch = (line.batchStatus || "").trim().toLowerCase();
        const returnOption = (this.claimSetups?.returnOption || "").trim();

        if (returnOption === "Document") {
          if (approval === "approved" || approval === "pending for approval") sum += total;
        } else if (returnOption === "Document Line") {
          if (approval === "approved" || approval === "pending for approval") {
            sum += total;
            if (batch === "returned") sum -= total;
          }
        }
        return sum;
      }, 0);

      this.monthlyClaimAmount = totalAmountLimit;
      this.totalClaimAmount = totalClaimed;
      let cumulative = totalClaimed;
      const exceededLineNos: number[] = [];

      for (const line of (lineData || [])) {
        const amt = Number(line.amount) || 0;
        const tax = Number(line.taxAmount) || 0;
        const total = amt + tax;

        cumulative += total;

        if (cumulative > totalAmountLimit) {
          exceededLineNos.push(line.lineNo || line.systemId || "unsaved");
        }
      }

      this.addItemService.exceededLines$.next(exceededLineNos);
      this.allTotalClaimAmount = cumulative;
      const limitExceeded = cumulative > totalAmountLimit;
      this.addItemService.showLoader$.next(false);
      return !limitExceeded;

    } catch (error) {
      this.toastr.error("Failed to check Monthly/Quarterly/Yearly claim amount.");
      this.addItemService.showLoader$.next(false);
      return false;
    }
  }


  async deleteLine(data: any) {
    if (!data?.linesData || data.linesData.length === 0) {
      this.toastr.warning('No lines available to delete.');
      return;
    }
    const itemIndex = data.rowIndex;
    const line = data.linesData[itemIndex];

    if (!line?.systemId) {
      this.toastr.error('Line not found or invalid system ID.');
      return;
    }
    const confirmed = await this.dialogService.confirm({
      message: 'Your claim limit for this month has been reached. You cannot add more expenses until the next period. This line will now be deleted.',
      yesButtonText: 'Yes, Delete',
      noButtonText: 'No',
      showAsNotification: false
    });

    if (!confirmed) {
      return;
    }

    try {
      this.addItemService.showLoader$.next(true);

      await firstValueFrom(
        this.restService.delete(`/employeeClaimLines(${line.systemId})`)
      );

      this.toastr.success(
        `Claim line ${line.lineNo || ''} deleted successfully.`
      );
      this.addItemService.popupRefreshLineData$.next(true);
    } catch (error) {
      this.toastr.error('Failed to delete claim line.');
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }


  private changeEmployeeName(data: EventDataModel) {
    setTimeout(() => {
      this.formDataService.updateControlData$.next({
        control: 'employeeName',
        data: data.dropdownData.firstName + ' ' + data.dropdownData.lastName,
        eventEmit: true
      });
      this.formDataService.updateControlData$.next({
        control: 'departmentCode',
        data: data.dropdownData.departmentId,
        eventEmit: true
      });
    }, 100)
  }

  public buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'resubmitLine') {
      this.resubmitLine(buttonData);
    } else if (buttonData.button.label === 'SendApprovalRequest') {
      this.SendSubmitWorkflow(buttonData);
    }
    else if (buttonData.button.label === 'CancelApprovalRequest') {
      this.SendCancelWorkflow(buttonData);
    } else if (buttonData.button.label === 'submit') {
      this.submit(buttonData)
    } else if (buttonData.button.label === 'reopen') {
      this.reopen(buttonData)
    } else if (buttonData.button.label === 'Approved') {
      this.Approved(this.approvalEntriesResponse)
    } else if (buttonData.button.label === 'ApprovalReject') {
      this.ApprovalReject(this.approvalEntriesResponse)
    } else if (buttonData.button.label === 'getRejectLine') {
      this.getRejectLine(buttonData);
    } else if (buttonData.button.label === 'applyRejectLine') {
      this.applyRejectLine(buttonData);
    } else if (buttonData.button.label === 'RejectLine') {
      this.approverRejectLine(buttonData);
    } else if (buttonData.button.label === 'managePax') {
      this.openManagePax(buttonData);
    }
  }

  //Bc fn
  async resubmitLine(buttonData: any) {
    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );

    if (!selectedIndexes?.length) {
      this.toastr.warning('Please select line(s) to resubmit.');
      return;
    }
    this.addItemService.showLoader$.next(true);

    try {
      const selectedLines = selectedIndexes
        .map((i: number) => buttonData.lineData[i])
        .filter((line: any) => !!line);

      if (!selectedLines.length) {
        this.toastr.warning('No valid lines selected.');
        this.addItemService.showLoader$.next(false);
        return;
      }
      for (const line of selectedLines) {
        if (!line?.systemId) continue;

        const url = `${this.config.addItemConfig!.lineConfig!.api}(${line.systemId})/Microsoft.NAV.resubmitLineAPI`;

        try {
          await firstValueFrom(this.restService.post(url, {}));
        } catch (err) {
        }
      }

      this.toastr.success('Resubmission process completed.');
      this.addItemService.popupRefreshLineData$.next(true);

    } catch (err) {
      this.toastr.error('Unexpected error during resubmission process.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);

    }
  }


  attachmentApi: string = '/portalDocumentAttachments';
  getAttachment(data: any, linedata: any): Promise<any[]> {
    const getUrl = `${this.attachmentApi}?$filter=DocumentType eq '${this.config.addItemConfig?.informationSectionConfig?.documentType}' and No eq '${data[this.config.headerApiOrderByField!]}' and recordLineNo eq ${linedata.lineNo}`;

    return this.restService.get(getUrl).toPromise().then((res: any) => res.value || []);
  }

  async totalClaimAmountPatch(buttonData: CustomButtonEvent): Promise<void> {
    this.addItemService.showLoader$.next(true);
    if (!buttonData.headerData?.systemId) {
      return;
    }
    const query = `${this.config.addItemConfig?.headerConfig?.api}(${buttonData.headerData?.systemId})`;
    const ifMatchKey = '*';
    const patchData = {
      totalClaimAmount: Number(this.totalClaimAmountHeader.toFixed(2))
    };

    try {
      await this.restService.patch(query, patchData, ifMatchKey).toPromise();
    } catch (err) {
      this.toastr.error('Failed to update total claim amount before workflow.');
      throw err;
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }


  private hasApprovalPermission(buttonData: any): boolean {
    const currentUserId = this.sessionService.UserId;
    const targetUserId = buttonData?.data?.UserId;
    if (!targetUserId || targetUserId !== currentUserId) {
      this.dialogService.showAlert('custom', {
        title: 'Warning',
        text: "You don't have permission for this operation."
      });
      return false;
    }
    return true;
  }

  //Bc function
  async SendSubmitWorkflow(buttonData: CustomButtonEvent) {
    // if (!this.hasApprovalPermission(buttonData)) {
    //   return;
    // }
    const confirmed = await this.dialogService.confirm({
      message: 'Are you sure you want to send approval request?',
      yesButtonText: 'Yes',
      noButtonText: 'No'
    });

    if (!confirmed) {
      return;
    }

    this.addItemService.showLoader$.next(true);
    this.approvalRule = null;
    const lines = buttonData.lineData || [];
    const errors: string[] = [];

    const approvalStatus = buttonData.headerData?.approvalStatus;
    if (approvalStatus && approvalStatus !== 'Open' && approvalStatus !== 'Rejected') {
      this.toastr.warning(`Cannot submit: Approval status is '${approvalStatus}'.`);
      this.addItemService.showLoader$.next(false);
      return;
    }

    const withinMonthLimit = await this.maxAmountPerMonth({
      header: buttonData.headerData,
      lineData: buttonData.lineData
    });
    if (!withinMonthLimit) {
      this.toastr.error(
        `Your total claims ${this.allTotalClaimAmount} exceed the allowed limit ${this.monthlyClaimAmount}. Please adjust your claims before submitting for approval.`
      );
      this.addItemService.showLoader$.next(false);
      return;
    }


    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line?.expenseType) continue;
      const emp = this.employees.find((x: any) => x.no === buttonData.data.employeeNo);
      const rule = this.getLineRule(line.expenseType, emp);
      if (!rule) {
        errors.push(`No matching rule found for "${line.expenseType}" on line "${i + 1}".`);
        continue;
      }

      // Keep the first valid rule for the approval payload
      if (!this.approvalRule) {
        this.approvalRule = rule;
      }

      if (rule.maxClaimsPerMonth) {
        const now = new Date();
        const claimsThisPeriod = lines.filter((l: any) => {
          if (l.expenseType !== rule.claimTypeCode || !l.receiptDate) return false;
          const rec = new Date(l.receiptDate);
          return rule.limitPeriod === 'Monthly'
            ? rec.getMonth() === now.getMonth() && rec.getFullYear() === now.getFullYear()
            : rule.limitPeriod === 'Yearly' && rec.getFullYear() === now.getFullYear();
        });
        if (claimsThisPeriod.length > rule.maxClaimsPerMonth) {
          errors.push(`Exceeded max ${rule.maxClaimsPerMonth} claims for ${line.expenseType} (${rule.limitPeriod}).`);
        }
      }

      if (rule.attachmentRequired && buttonData.lineData && buttonData.lineData[i]) {
        const attachments = await this.getAttachment(buttonData.headerData, buttonData.lineData[i]);
        if (!attachments || attachments.length === 0) {
          errors.push(`Attachment is required for ${line.expenseType}.`);
        }
      }

      if (rule.chargeableOption === 'Yes' && !line.Chargeable) {
        errors.push(`${line.expenseType} must be marked as Chargeable.`);
      }
      if (line.Chargeable && !line.clientName) {
        errors.push(` A Chargeable Client Name is required for ${line.expenseType}.`);
      }
      if (rule.chargeableOption === 'No' && line.Chargeable) {
        errors.push(`${line.expenseType} cannot be marked as Chargeable.`);
      }
      if (rule.chargeableOption === 'Optional') {
        if (this.claimSetups.chargeable === 'Yes' && !line.Chargeable) {
          errors.push(`${line.expenseType} must be marked as Chargeable.`);
        }
        if (this.claimSetups.chargeable === 'No' && line.Chargeable) {
          errors.push(`${line.expenseType} cannot be marked as Charge.`);
        }
      }
      if (line.amount === 0 || line.amount === null || line.amount === undefined) {
        errors.push(`Amount cannot be zero for ${line.expenseType}.`);
      }
      if (line.expenseType == 'MILEAGE' && (line.toLocation === "" || line.toLocation === null || line.toLocation === undefined)) {
        errors.push(`To Location cannot be Empty.`);
      }
      if (line.expenseType == 'MILEAGE' && (line.fromLocation === "" || line.fromLocation === null || line.fromLocation === undefined)) {
        errors.push(`From Location cannot be Empty.`);
      }
      if (line.expenseType == 'MILEAGE' && (line.km === "" || line.km === null || line.km === undefined)) {
        errors.push(`KM cannot be Empty.`);
      }
    }

    if (errors.length > 0) {
      this.dialogService.openUiError(errors.join(' '), () => { });
      this.addItemService.showLoader$.next(false);
      return;
    }

    try {
      const getUrl = `(${buttonData.data[this.config.idProp!]})/Microsoft.NAV.getUserId`;
      const payload = {
        userid2: buttonData.data.UserId,
        docNo: buttonData.data.claimNo,
        resCentre: this.sessionService.DefaultResponsibilityCenter,
        comp: this.sessionService.CompanyName,
        compId: this.sessionService.Company,
      };
      await firstValueFrom(
        this.restService.post(this.config.addItemConfig?.headerConfig?.api + getUrl, payload)
      );

      const url = `(${buttonData.data[this.config.idProp!]})/Microsoft.NAV.portalSendEmpClaimForApproval`;
      const sendPayload = {
        conditionType: this.approvalRule.conditionType,
        applicableToID: this.approvalRule.applicableToID,
      };
      await firstValueFrom(
        this.restService.post(this.config.addItemConfig?.headerConfig?.api + url, sendPayload)
      );

      this.toastr.success('Workflow request sent successfully!');
    } catch (err) {
      this.toastr.error('Failed to send workflow request.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.addItemService.customButtonResponse$.next(true);
    }

  }


  async SendCancelWorkflow(buttonData: CustomButtonEvent) {
    // if (!this.hasApprovalPermission(buttonData)) {
    //   return;
    // }

    if (buttonData.headerData.approvalStatus !== 'Pending For Approval') {
      this.toastr.warning('You are unable to cancel approval request.');
      return;
    }
    const confirmed = await this.dialogService.confirm({
      message: 'Are you sure you want to cancel request?',
      yesButtonText: 'Yes',
      noButtonText: 'No'
    });

    if (!confirmed) {
      return;
    }

    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.portalCancelEmpClaimApproval';
    try {
      await firstValueFrom(
        this.restService.post(this.config.addItemConfig?.headerConfig?.api + url, {})
      );
      this.toastr.success('Sent Cancel Request!');
      this.formDataService.updateControlData$.next({ control: 'approvalStatus', data: 'Open', eventEmit: true });
    } catch (err) {
      this.toastr.error('Failed to cancel approval request.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.addItemService.customButtonResponse$.next(true);
    }
  }

  private showErrorModal(message: string) {
    (document.activeElement as HTMLElement)?.blur();
    this.dialogService.openUiError(message, () => { });
  }


  leaveEvent(data: FormDataModel) {
    if (data.section == SectionType.Line) {
      if (data.control === 'amount') {
        const rowIndex = data.rowIndex!;
        const activeLine = Array.isArray(data.linesData)
          ? data.linesData[rowIndex]
          : data.activeData;

        const hasPax =
          (Number(activeLine?.noOfPAX ?? this.cachedApiLines[rowIndex]?.noOfPAX) || 0) > 0 ||
          (activeLine?.paxEnabled ?? this.cachedApiLines[rowIndex]?.paxEnabled) === true;
        if (hasPax) {
          this.dialogService.alert('custom', {
            title: 'Warning',
            text: 'The amount cannot be changed because it is assigned to a Pax.'
          });
          const original = this.cachedApiLines[rowIndex];
          const revertData = {
            amount: original.amount
          };

          this.addItemService.patchLineFormOnly$.next({ rowIndex, data: revertData });
          this.addItemService.revertLine(rowIndex, revertData);
          return;
        }
        this.changeLineAmount(data);
        this.calculateTotalAmount(data.linesData);
      } else if (data.control === 'km') {
        this.changeLineKM(data);
        this.calculateTotalAmount(data.linesData);
      } else if (data.control === 'typeOfTransportation') {
        this.changeLineKM(data);
      } else if (data.control === 'receiptDate') {
        this.changeReceiptDate(data);
      }
    }
  }

  async submit(buttonData: CustomButtonEvent) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.submitEmpClaimApproval';
    try {
      await firstValueFrom(
        this.restService.post(this.config.addItemConfig?.headerConfig?.api + url, {})
      );
      this.toastr.success(`Claim Submitted Successfully`);
    } catch (err) {
      this.toastr.error('Failed to submit claim.');
    } finally {
      this.addItemService.customButtonResponse$.next(true);
      this.addItemService.showLoader$.next(false);
    }
  }

  async reopen(buttonData: CustomButtonEvent) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.reopenEmpClaimApproval';
    try {
      await firstValueFrom(
        this.restService.post(this.config.addItemConfig?.headerConfig?.api + url, {})
      );
      this.toastr.success(`Claim Reopen Successfully`);
    } catch (err) {
      this.toastr.error('Failed to reopen claim.');
    } finally {
      this.addItemService.customButtonResponse$.next(true);
      this.addItemService.showLoader$.next(false);
    }
  }


  approvalApi = `/approvalEntries`;
  approvalIdProp = 'id';

  async Approved(response: any) {
    const selectedItem = response;
    if (!selectedItem) {
      this.toastr.warning('Please select an item to approve.');
      return;
    }

    const reasonResult = await this.dialogService.commentBox({
    });

    if (!reasonResult.isConfirmed) return;

    const comment = reasonResult.value?.trim?.() || '';
    const idProp = this.approvalIdProp;
    const baseUrl = this.approvalApi;

    try {
      this.addItemService.showLoader$.next(true);

      const itemId = selectedItem[idProp];
      const ifMatchKey = selectedItem["@odata.etag"];
      const patchData: any = {};

      if (comment) {
        patchData.actionComment = comment;
      }

      const payload = {
        entryNo: selectedItem.entryNo,
        approverId: selectedItem.approverId,
        actionComment: comment
      };

      await firstValueFrom(
        this.restService.patch(`${baseUrl}(${itemId})`, patchData, ifMatchKey)
      );

      const url = `(${itemId})/Microsoft.NAV.portalApproveWorkflow`;

      await firstValueFrom(
        this.restService.post(`${baseUrl}${url}`, payload)
      );

      this.toastr.success('Approved successfully!');

    } catch (err) {
      this.toastr.error(`Failed to approve item`);
    } finally {
      this.addItemService.refreshData$.next(true);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
      this.addItemService.closePopup$.next(true);
    }
  }


  async ApprovalReject(response: any) {
    const selectedItem = response;

    if (!selectedItem) {
      this.toastr.warning('Please select an item to reject.');
      return;
    }

    const reasonResult = await this.dialogService.commentBox({
    });

    if (!reasonResult.isConfirmed) return;

    const comment = reasonResult.value?.trim?.();
    if (!comment) {
      return;
    }

    const idProp = this.approvalIdProp;
    const baseUrl = this.approvalApi;

    try {
      this.addItemService.showLoader$.next(true);

      const itemId = selectedItem[idProp];
      const ifMatchKey = selectedItem["@odata.etag"];

      const patchData = { actionComment: comment };

      const payload = {
        entryNo: selectedItem.entryNo,
        approverId: selectedItem.approverId,
        actionComment: comment
      };

      await firstValueFrom(
        this.restService.patch(`${baseUrl}(${itemId})`, patchData, ifMatchKey)
      );

      const url = `(${itemId})/Microsoft.NAV.portalRejectWorkflow`;
      await firstValueFrom(
        this.restService.post(`${baseUrl}${url}`, payload)
      );

      this.toastr.success("Item rejected successfully!");

    } catch (err) {
      this.toastr.error("Failed to reject item.");
    } finally {
      this.addItemService.refreshData$.next(true);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
      this.addItemService.closePopup$.next(true);
    }
  }


  async loadEmployeeClaimLines(claimNo: string): Promise<any[]> {
    const url = `/employeeClaimLines?$filter=claimNo eq '${claimNo}'`;
    try {
      const res: any = await firstValueFrom(this.restService.get(url));
      return res?.value || [];
    } catch {
      this.toastr.error('Failed to load claim lines');
      return [];
    }
  }

  async changeReceiptDate(data: FormDataModel) {
    if (!data?.headerData?.claimNo) return;
    // this.addItemService.showLoader$.next(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const lines = await this.loadEmployeeClaimLines(data.headerData.claimNo);
      if (!lines.length) {
        this.toastr.warning('No claim lines found');
        return;
      }
      const line = lines[data.rowIndex!];
      if (!line?.systemId) {
        this.toastr.error('Line ID not found');
        return;
      }
      const url = `/employeeClaimLines(${line.systemId})`;
      if (line.dueClaim === true) {
        const result = await this.dialogService.commentBox({
          title: 'Overdue Claim Reason',
        });
        const reason = result.value?.trim();
        if (!reason) { //if not give reason
          const today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
          await firstValueFrom(
            this.restService.patch(url, { receiptDate: today }, '*')
          );
          return;
        }

        await firstValueFrom(
          this.restService.patch(url, { dueClaimReason: reason }, '*')
        );
        this.toastr.success('Due reason updated.');
      } else {
        await firstValueFrom(
          this.restService.patch(url, { dueClaimReason: '' }, '*')
        );
      }
    } catch (err) {
      this.toastr.error('Something went wrong.');
    }
    finally {
      //  this.addItemService.showLoader$.next(false);
      this.addItemService.reloadHeaderById$.next(data.headerData.systemId);
    }
  }


  getRejectLine(buttonData: any) {
    const employeeNo = buttonData?.headerData?.employeeNo;
    if (!employeeNo) {
      this.toastr.warning("Employee No not found");
      return;
    }
    const api = `/employeeClaimLines?$filter=
    employeeNo eq '${employeeNo}'
    and approverReject eq true
    and (rejectClaimReference eq '' or rejectClaimReference eq null)
    and approvalStatus eq 'Rejected'
  `;

    rejectLineConfig.api = api;

    this.rejectPopupRef =
      this.universalPopupService.openPopupObjectForEmployeeClaim({
        module: "employeeClaim",
        headerData: buttonData?.headerData,
        parentComponent: this,
        childComponent: this
      });

  }


  async applyRejectLine(buttonData: any) {

    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );

    if (!selectedIndexes?.length) {
      this.toastr.warning('Please select line(s) to apply.');
      return;
    }

    this.addItemService.showLoader$.next(true);

    try {

      const selectedLines = selectedIndexes
        .map((i: number) => buttonData.lineData[i])
        .filter((line: any) => !!line);

      if (!selectedLines.length) {
        this.toastr.warning('No valid lines selected.');
        return;
      }

      const systemId = buttonData?.headerData?.systemId;

      if (!systemId) {
        this.toastr.warning('Header SystemId not found.');
        return;
      }

      const url = `/employeeClaimHeaders(${systemId})/Microsoft.NAV.ApplyRejectedLine`;

      for (const line of selectedLines) {
        const payload = {
          oldClaimNo: line.claimNo,
          oldLineNo: line.lineNo,
          returnReason: ''
        };

        await firstValueFrom(
          this.restService.post(url, payload)
        );
      }

      this.toastr.success('Rejected line(s) applied successfully.');
    } catch (err) {
      this.toastr.error('Unexpected error during apply process.');

    } finally {
      if (this.rejectPopupRef) {
        this.rejectPopupRef.close();
        this.rejectPopupRef = null;
      }
      this.addItemService.reloadHeaderById$.next(buttonData.headerData.systemId);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }


  async approverRejectLine(buttonData: any) {
    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );

    if (!selectedIndexes?.length) {
      this.toastr.warning('Please select line(s) to reject.');
      return;
    }

    const selectedItems = selectedIndexes
      .map((i: number) => buttonData.lineData[i])
      .filter((line: any) => !!line);

    if (!selectedItems.length) {
      this.toastr.warning('No valid lines selected.');
      return;
    }

    const reasonResult = await this.dialogService.showMessageBox({
      title: 'Reject Reason',
    });

    if (!reasonResult.isConfirmed) return;

    const comment = reasonResult.value?.trim?.();
    if (!comment) {
      return;
    }

    const idProp = this.config.idProp!;
    const baseUrl = this.config.addItemConfig!.lineConfig!.api;

    try {
      this.addItemService.showLoader$.next(true);

      for (const item of selectedItems) {
        if (!item?.systemId) continue;

        const ifMatchKey = item['@odata.etag'];

        const patchData: any = {
          remarks: comment
        };

        try {
          await firstValueFrom(
            this.restService.patch(
              `${baseUrl}(${item.systemId})`,
              patchData,
              ifMatchKey
            )
          );

          const url =
            `${baseUrl}(${item.systemId})/Microsoft.NAV.rejectClaimLine`;

          const payload: any = {
            userId: this.sessionService.UserId,
            returnReason: comment
          };

          await firstValueFrom(
            this.restService.post(url, payload)
          );

        } catch (err) {
          this.toastr.error(`Failed to reject line ${item.lineNo}`);
        }
      }

      this.toastr.success('Line(s) rejected successfully.');
      this.addItemService.popupRefreshLineData$.next(true);

    } catch (err) {
      this.toastr.error('Something went wrong.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }


  private openManagePax(buttonData: CustomButtonEvent) {

    const rowIndex = (buttonData as any)?.data?.rowIndex;
    if (rowIndex === undefined || rowIndex === null) {
      this.toastr.warning('No line selected.');
      return;
    }

    const line = buttonData.lineData?.[rowIndex];
    if (!line) return;

    const amount = Number(line.amount) || 0;
    if (amount <= 0) {
      this.dialogService.alert('custom', {
        title: 'Warning',
        text: 'Please enter amount before managing PAX.'
      });
      return;
    }

    const header = buttonData.headerData;

    // 🚫 Block if document is finalized
    if (
      header?.approvalStatus === 'Approved' ||
      header?.batchStatus === 'In_x0020_Batch' ||
      line?.approvalStatus === 'Approved' ||
      line?.batchStatus === 'In_x0020_Batch'
    ) {
      this.dialogService.alert('custom', {
        title: 'Action Not Allowed',
        text: 'Manage PAX cannot be modified for approved or batched claims.',
        confirmButtonColor: '#69aa8a'
      });
      return;
    }

    const emp = this.employees.find(x => x.no === line.employeeNo);
    const rule = this.getLineRule(line.expenseType, emp);

    // Only allow Manage Pax if rule.enablePAX is true
    if (!rule || !rule.enablePAX) {
      this.toastr.warning('Manage PAX is not enabled for this expense type.');
      return;
    }

    const modalRef = this.modalService.open(ManagePaxComponent, {
      backdrop: 'static',
      size: 'md'
    });

    modalRef.componentInstance.amount = line.amount;
    modalRef.componentInstance.paxLimit = rule?.paxLimit || 0;
    modalRef.componentInstance.gEFormUploaded = line.gEFormUploaded || false;
    modalRef.componentInstance.noOfPAX = line.noOfPAX || 0;

    modalRef.componentInstance.recordLineNo = line.lineNo;
    modalRef.componentInstance.documentNo = buttonData.headerData.claimNo;
    modalRef.componentInstance.documentType = buttonData.headerData.documentType;

    modalRef.componentInstance.documentData = buttonData.headerData;
    modalRef.componentInstance.itemConfig = this.config?.addItemConfig;

    modalRef.result.then((result: any) => {
      if (!result) return;
      // 1️⃣ Update noOfPAX
      this.formDataService.updateLineControlData$.next({
        control: 'noOfPAX',
        data: result.noOfPAX,
        rowIndex,
        eventEmit: false
      });
      // 2️⃣ Update paxValue
      this.formDataService.updateLineControlData$.next({
        control: 'paxValue',
        data: result.paxValue,
        rowIndex,
        eventEmit: false
      });
      // 3️⃣ Update paxEnabled
      this.formDataService.updateLineControlData$.next({
        control: 'paxEnabled',
        data: result.paxEnabled,
        rowIndex,
        eventEmit: false
      });
      // 4️⃣ Patch backend line
      this.addItemService.patchLineData$.next({
        rowIndex,
        data: {
          noOfPAX: result.noOfPAX,
          paxValue: result.paxValue,
          paxEnabled: result.paxEnabled
        },
        disableControls: false
      });
      this.addItemService.getLineAttachment$.next({ documentType: buttonData.headerData.documentType, documentNo: buttonData.headerData.claimNo, recordLineNo: line.lineNo })

    });
  }

}


