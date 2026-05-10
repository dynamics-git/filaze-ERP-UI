import { ApplicationRef, Component, NgZone } from '@angular/core';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { DEFAULT_SUMMARY_FIELDS } from '../../../shared/components/summary/summary.config';
import { EmployeeClaimHeader, EmployeeClaimLime, EmployeeClaimCalculation } from '../employee-claim/employee-claim.config';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { RestService } from '../../../core/services/rest.service';
import { SessionService } from '../../../core/services/session.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { Utility } from '../../../core/services/utility.service';
import { PostedEmployeeClaimCalculation, PostedEmployeeClaimHeader, PostedEmployeeClaimLime } from './posted-employee-claim.config';

@Component({
  standalone: false,
  selector: 'app-posted-employee-claim',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" ></app-data-table>'
})
export class PostedEmployeeClaimComponent {

  config: DataTableConfig = {
    title: 'Posted Employee Claim',
    idProp: 'systemId',
    headerApi: '/employeeClaimHeaders',
    pageName: 'POSTED EMP CLAIM',
    fileUrlProp: 'FileUrl',
    headerApiOrderByField: 'claimNo',
    showCopy: false,
    showCreate: false,
    showEdit: false,
    showDelete: false,
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
        operator: 'eq',
        value: `'Paid'`
      },
    ],
    addItemConfig: {
      title: 'Posted Employee Claim',
      recordId: 'claimNo',
      recordTitle: 'claimNo',
      headerConfig: PostedEmployeeClaimHeader,
      lineConfig: PostedEmployeeClaimLime,
      calculationSectionConfig: PostedEmployeeClaimCalculation,
      informationSectionConfig: {
        documentNoProp: 'claimNo',
        documentType: 'Employee Claim',
        documentStatusProp: 'EmployeeClaim',
        allowAttachmentUpload: false,
        summaryFields: DEFAULT_SUMMARY_FIELDS
      }
    },
    factBoxConfig: {
      boxType: FactBoxType.EmployeeClaim
    },
  };


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
    private universalPopupService: UniversalPopupService
  ) { }


  popupLoaded(data: any) {
    this.addItemService.enableOrDisableAllControls$.next(false);
  }
}
