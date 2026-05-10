import { Component, OnInit, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { firstValueFrom, take } from 'rxjs';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { ProcurementFlowService } from '../services/procurement-flow.service';
import { ProcurementMethod } from '../models/procurement-flow.model';
import { CombinedRequisitionCalculation, CombinedRequisitionHeader, CombinedRequisitionLine, CombinedRequisitionListHeaders, RfqVendorItemConfig } from './combined-requisition.config';

@Component({
  selector: 'app-combined-requisition',
  template: '<app-data-table [config]="config" [filterDropdown]="filterDropdown" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (leaveEvent)="leaveEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>',
  providers: [ProcurementFlowService],
  standalone: false,
})
export class CombinedRequisitionComponent implements OnInit {
  private readonly procurementMethodOptions: Record<string, string> = {
    'Direct Purchase': 'Direct Purchase',
    'RFQ': 'RFQ',
    'Bid Waiver': 'Bid Waiver',
    'Vendor Selection': 'Vendor Selection',
    'Contract Purchase': 'Contract Purchase'
  };
  private readonly dialogService = inject(UnifiedDialogService);
  private readonly universalPopupService = inject(UniversalPopupService);

  private isPrWorkflowSetupEnabled = false;

  config: DataTableConfig = {
    title: 'Combined Requisition',
    idProp: 'Id',
    headerApi: '/purchaseRequisitionHeaders',
    pageName: 'COMBINED-REQUISITION',
    headerApiOrderByField: 'Number',
    filters: [
      {
        field: 'ApprovalStatus',
        operator: 'ne',
        value: "'Approved'"
      },
      {
        field: 'ApprovalStatus',
        operator: 'ne',
        value: "'Archived'"
      },
      {
        field: 'DocumentType',
        operator: 'eq',
        value: "'Requisition'"
      }, {
        field: 'isCombinedPrHeader',
        operator: 'eq',
        value: "true"
      }
    ],
    filterByUserCompanyResCenter: true,
    headers: CombinedRequisitionListHeaders,
    //selctionType: 'single',
    selctionType: 'multiple',
    showCopy: true,
    addItemConfig: {
      title: 'Combined Requisition',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: CombinedRequisitionHeader,
      lineConfig: CombinedRequisitionLine,
      calculationSectionConfig: CombinedRequisitionCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Requisition',
        documentStatusProp: 'ApprovalStatus',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition,
        procurementFlow: {
          enabled: true,
          documentNoProp: 'Number',
          methodProp: 'procurementMethod',
          procurementStatusProp: 'procurementStatus',
          sourcingStatusProp: 'sourcingStatus',
          workflowStatusProp: 'workflowStatus',
          selectedVendorNoProp: 'selectedVendorNo',
          selectedVendorNameProp: 'selectedVendorName',
          vendorNoProp: 'vendorNo',
          vendorNameProp: 'vendorName',
          quoteCreatedProp: 'quoteCreated',
          orderCreatedProp: 'orderCreated',
          purchaseOrderNoProp: 'purchaseOrderNo',
          vendorLinesApi: '/rfqVendors',
          vendorLineDocumentNoProp: 'prNo',
          vendorLineInvitedProp: 'isInvited',
          vendorLineQuotedAmountProp: 'quotedAmount',
          vendorLineSelectedProp: 'isSelected',
          vendorLineQuoteNoProp: 'quoteNo',
          vendorLineOrderNoProp: 'poNo'
        }
      }
    },
    factBoxConfig: {
      boxType: FactBoxType.PurchaseRequsition
    }
  };

  filterDropdown: any = [{
    fieldName: 'Approval Status',
    filedLabel: 'ApprovalStatus',
    fieldOptions: [
      { value: 'Open', label: 'Open' },
      { value: 'Archived', label: 'Archived' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Pending Approval', label: 'Pending Approval' }
    ]
  }];

  private getRfqVendorItemConfig() {
    return RfqVendorItemConfig;
  }

  private getRfqVendorLineApi() {
    return this.getRfqVendorItemConfig()?.lineConfig?.api ?? '/rfqVendors';
  }

  private compareQuotedVendors(a: any, b: any) {
    const amountDiff = Number(a?.quotedAmount || 0) - Number(b?.quotedAmount || 0);
    if (amountDiff !== 0) {
      return amountDiff;
    }

    const aDelivery = new Date(a?.deliveryDate || '9999-12-31').getTime();
    const bDelivery = new Date(b?.deliveryDate || '9999-12-31').getTime();
    return aDelivery - bDelivery;
  }

  private async setWinningVendor(buttonData: CustomButtonEvent, winnerRow: any) {
    const persistedVendors = (buttonData?.lineData || []).filter((row: any) => row?.systemId);

    if (!winnerRow?.systemId || !persistedVendors.length) {
      this.toastr.warning('Selected vendor must be saved before winner selection.');
      return;
    }

    this.addItemService.showLoader$.next(true);

    try {
      await Promise.all(
        persistedVendors.map((vendor: any) => firstValueFrom(this.restService.patch(
          `${this.getRfqVendorLineApi()}(${vendor.systemId})`,
          {
            isSelected: vendor.systemId === winnerRow.systemId,
            UserId: this.sessionService.UserId
          },
          '*'
        )))
      );

      this.toastr.success(`${winnerRow.vendorName || winnerRow.vendorNo || 'Vendor'} selected as RFQ winner.`);
      this.refreshRfqVendorPopup(buttonData);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    } catch {
      this.toastr.error('Failed to update RFQ winner selection.');
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }

  private async compareQuote(buttonData: CustomButtonEvent) {
    const quotedRows = (buttonData?.lineData || [])
      .filter((row: any) => Number(row?.quotedAmount || 0) > 0 && row?.systemId)
      .sort((a: any, b: any) => this.compareQuotedVendors(a, b));

    if (!quotedRows.length) {
      await this.dialogService.showAlert('warning', {
        title: 'Compare Quote',
        text: 'No valid supplier quotes are available to compare yet.'
      });
      return;
    }

    const selectedIndexes = await this.getSelectedRfqIndexes();

    const selectedRows = this.getSelectedRfqRows(buttonData, selectedIndexes)
      .filter((row: any) => Number(row?.quotedAmount || 0) > 0 && row?.systemId);

    if (selectedRows.length > 1) {
      this.toastr.warning('Select only one vendor row when choosing an RFQ winner.');
      return;
    }

    const recommendedVendor = quotedRows[0];
    const chosenVendor = selectedRows[0] ?? recommendedVendor;

    const confirmed = await this.dialogService.confirm({
      title: 'RFQ Comparison',
      message: selectedRows.length
        ? `Set ${chosenVendor.vendorName || chosenVendor.vendorNo} as the RFQ winner? Recommended vendor is ${recommendedVendor.vendorName || recommendedVendor.vendorNo}.`
        : `Recommended vendor is ${recommendedVendor.vendorName || recommendedVendor.vendorNo}. Click Compare Quote after selecting a different row if you want to override the recommendation.`,
      yesButtonText: 'Select Winner',
      noButtonText: 'Cancel'
    });

    if (!confirmed) {
      return;
    }

    await this.setWinningVendor(buttonData, chosenVendor);
  }



  MenuButtons: Menubuttons[] = [
    {
      label: 'Purchase Requisition',
      name: 'Purchase Requisition',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/requisition',
      isEnable: false
    },
    {
      label: 'Approved Purchase Requisition',
      name: 'Approved Purchase Requisition',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/approved-pr'
    },
    {
      label: 'Archived Purchase Requisition',
      name: 'Archived Purchase Requisition',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-requisition'
    },
    {
      label: 'Purchase Requisition Cancelled',
      name: 'Purchase Requisition Cancelled',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/cancelled-pr'
    },
  ]

  chartAccountData!: any[];
  itemData!: any[];
  fixedAssetData!: any[];
  totalAmount: number = 0;
  PendingApproversID: any;
  PendingApproversEmailId: any;
  private static combineProcureHeaderData: any = null;
  private static combineProcurePopupRef: any = null;

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility,
    private selectedItemService: SelectedItemService,
    private procurementFlow: ProcurementFlowService = new ProcurementFlowService()
  ) {
  }

  ngOnInit() {
    this.loadPrWorkflowSetupState();
  }

  private loadPrWorkflowSetupState() {
    const url = "/workflowHeaders?$filter=documentType eq 'Requisition' and isEnabled eq true";

    this.restService.get(url).subscribe({
      next: (response: any) => {
        this.isPrWorkflowSetupEnabled = Array.isArray(response?.value) && response.value.length > 0;
      },
      error: () => {
        this.isPrWorkflowSetupEnabled = false;
      }
    });
  }

  popupLoaded(data: any) {
    if (data.header.ApprovalStatus !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }
    if (this.isPrWorkflowSetupEnabled && data.header.ApprovalStatus == 'Pending Approval') {
      let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "'";
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          const ifMatchKey = "*";
          const query = '(' + data.header.Id + ')';
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          this.PendingApproversID = response.value[0].ApproverID;
          this.PendingApproversEmailId = response.value[0].ApproverEmailId;
          this.restService.patch("/purchaseRequisitionHeaders" + query, patchData, ifMatchKey).subscribe();
        }
      });
    }


    const lineData = data.line;
    this.totalAmount = 0;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['Amount'] ? +line['Amount'] : 0;
        switch (line.PurchaseRequisitionType) {
          case 'G/L Account':
            this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
            if (this.chartAccountData) {
              this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/glAccounts').subscribe((response: any) => {
                this.chartAccountData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case 'Item':
            this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
            if (this.itemData) {
              this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/Items').subscribe((response: any) => {
                this.itemData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case 'Fixed Asset':
            this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
            if (this.fixedAssetData) {
              this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/fixedAssets').subscribe((response: any) => {
                this.fixedAssetData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case ' ':
            this.formDataService.disableLineControlsList$.next([
              { label: 'Number', rowIndex: rowIndex, clearValue: true },
              { label: 'UnitOfMeasure', rowIndex: rowIndex, clearValue: true },
              { label: 'LocationCode', rowIndex: rowIndex, clearValue: true },
              { label: 'Quantity', rowIndex: rowIndex, clearValue: true },
              { label: 'UnitPrice', rowIndex: rowIndex, clearValue: true },
              { label: 'Amount', rowIndex: rowIndex, clearValue: true }
            ]);
            break;
          default:
            this.formDataService.disableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
            break;
        }
      });
    }
    this.applyRfqVendorLineState(lineData || []);

    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    this.applyProcurementFlow(data.header, lineData || []);
  }

  private applyRfqVendorLineState(lineData: any[]) {
    lineData.forEach((line: any, rowIndex: number) => {
      if (line?.isInvited === false) {
        this.formDataService.disableLineControlsList$.next([
          { label: 'quotedAmount', rowIndex: rowIndex },
          { label: 'deliveryDate', rowIndex: rowIndex },
        ]);
      }
    });
  }

  private handleRfqVendorChangeEvent(data: EventDataModel) {
    if (data.section === SectionType.Header || data.section === SectionType.Line) {
      if (data.control === 'vendorNo') {
        this.SetVendor(data);
      }
    }
  }

  private openRfqVendorPopup(buttonData: CustomButtonEvent) {
    const header = this.getCurrentHeaderData(buttonData);
    const recordId = header?.[this.config.idProp!] ?? buttonData.data?.[this.config.idProp!];

    if (!recordId) {
      this.toastr.warning('Save the requisition before opening RFQ vendors.');
      return;
    }

    const popup = this.universalPopupService.openModulePopup('rfqVendor', {
      recordId,
      size: 'xl',
      suspendAutoSave: true,
      onLoaded: (data: any) => this.applyRfqVendorLineState(data?.line || []),
      onChangeEvent: (data: EventDataModel) => this.handleRfqVendorChangeEvent(data),
      onButtonClick: (data: CustomButtonEvent) => this.buttonClickEvent(data)
    });

    popup?.hidden.subscribe(() => {
      this.refreshCurrentRequisition(buttonData);
    });
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'vendorNo':
          this.SetVendor(data);
          break;
      }
    }

    if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'PurchaseRequisitionType':
          this.changePurchaseRequisitionType(data);
          break;
        case 'Number':
          this.changeItemNo(data);
          break;
        case 'vendorNo':
          this.SetVendor(data);
          break;
      }
    }
  }

  leaveEvent(data: FormDataModel) {
    if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'Quantity':
        case 'UnitPrice':
          this.calculateAmount(data);
          break;
      }

      if (Array.isArray(data.linesData)) {
        this.totalAmount = 0;
        data.linesData.forEach((line: any, index: number) => {
          this.totalAmount += line['Amount'] ? +line['Amount'] : 0;
        });
        this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
      }
    }
  }

  changePurchaseRequisitionType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'Number', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: null, rowIndex: data.rowIndex });
    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        if (this.chartAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/glAccounts').subscribe((response: any) => {
            this.chartAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Item':
        this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        if (this.itemData) {
          this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/Items').subscribe((response: any) => {
            this.itemData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Fixed Asset':
        this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        if (this.fixedAssetData) {
          this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/fixedAssets').subscribe((response: any) => {
            this.fixedAssetData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case ' ':
        this.formDataService.disableLineControlsList$.next([
          { label: 'Number', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LocationCode', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Quantity', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitPrice', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Amount', rowIndex: data.rowIndex!, clearValue: true }
        ]);
        break;
      default:
        this.formDataService.disableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        break;
    }
  }

  changeItemNo(data: EventDataModel) {
    const purchaseRequisitionType = data.activeData.PurchaseRequisitionType;
    switch (purchaseRequisitionType) {
      case 'G/L Account':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            Number: data.data,
            Description: data.dropdownData.Name,
            GLAccountName: data.dropdownData.Name
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        break;
      case 'Item':
      case 'Fixed Asset':
      case ' ':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            Description: data.dropdownData.Name,
            GLAccountName: data.dropdownData.Name
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        break;
    }
  }

  calculateAmount(data: FormDataModel) {
    const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    const unitPrice = data.control === 'UnitPrice' ? data.data : data.activeData.UnitPrice;
    let amount = 0;
    if (quantity && unitPrice) {
      amount = +quantity * +unitPrice;
    }
    this.formDataService.updateLineControlData$.next({ control: 'Amount', data: amount.toFixed(2), rowIndex: data.rowIndex });
    this.addItemService.patchLineData$.next({
      rowIndex: data.rowIndex!, data: {
        Amount: amount.toFixed(2),
        Quantity: quantity,
        UnitPrice: unitPrice
      }, disableControls: false
    });

    if (data.linesData && data.linesData.length > 0) {
      this.totalAmount = 0;
      data.linesData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) {
          this.totalAmount += amount;
        } else {
          this.totalAmount += line['Amount'] ? +line['Amount'] : 0;
        }
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
  }

  validateHeaderData(header: any) {
    if (header.Remark) {
      return true;
    }

    this.toastr.warning('Remark must have a value');

    return false;
  }

  validateLineData(lines: any[]) {
    if (lines && lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.PurchaseRequisitionType && line.Number) {
          if (line.UnitOfMeasure && line.LocationCode) {
            continue;
          } else {
            this.toastr.warning('Unit of Measure, Location must have a value');
            return false;
          }
        }
      }
    }

    return true;
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (!this.isPrWorkflowSetupEnabled && this.isPrApprovalAction(buttonData.button.label)) {
      this.toastr.info('Workflow approval is disabled in Workflow Setup.');
      return;
    }

    if (buttonData.button.label === 'SendApprovalRequest') {
      if (this.validateHeaderData(buttonData.headerData) && this.validateLineData(buttonData.lineData!)) {
        this.addItemService.showLoader$.next(true);
        this.updateUserId(buttonData, true);
      }
    } else if (buttonData.button.label === 'CancelApprovalRequest') {
      if (buttonData.data.ApprovalStatus === 'Pending Approval') {
        this.addItemService.showLoader$.next(true);
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForApprovalID';
        let payload = {
          docNo: buttonData.data.Number,
        }
        this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
          if (response.value == this.sessionService.UserId) {
            this.updateUserId(buttonData, false);
          }
          else {
            this.toastr.error('You do not have permission to cancel the document. Only Sender can Cancel the Document.');
            this.addItemService.showLoader$.next(false);
          }
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      }
    }
    else if (buttonData.button.label === 'StartProcurementReview') {
      this.startProcurementReview(buttonData);
    }
    else if (buttonData.button.label === 'SetProcurementMethod') {
      this.setProcurementMethod(buttonData);
    }
    else if (buttonData.button.label === 'InviteVendors') {
      this.openRfqVendorPopup(buttonData);
    }
    else if (buttonData.button.label === 'MarkVendorSelected') {
      this.markVendorSelected(buttonData);
    }
    else if (buttonData.button.label === 'CombineProcure') {
      this.openCombineProcureList(buttonData);
    }
    else if (buttonData.button.name === 'CombinedPR' || buttonData.button.label === 'CombinedPR') {
      this.CombinedPR(buttonData);
    }
    else if (buttonData.button.label === 'ConvertPurchaseRequisitionToQuote') {
      this.convertPurchaseRequisitionToQuote(buttonData);
    }
    else if (buttonData.button.label === 'ConvertPurchaseRequisitionToOrder') {
      this.convertPurchaseRequisitionToOrder(buttonData);
    }
    else if (buttonData.button.label === 'BidWaiverRequired') {
      if (buttonData.data.ApprovalStatus === 'Open') {
        this.addItemService.showLoader$.next(true);
        this.formDataService.updateControlData$.next({ control: 'DocumentType', data: 'BW Requisition' });
        const ifMatchKey = "*";
        const query = '(' + buttonData.data.Id + ')';
        let patchData = { "DocumentType": "BW Requisition" }
        this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
          this.toastr.success('Bid waiver marked successfully.');
          this.refreshCurrentRequisition(buttonData);
          this.addItemService.showLoader$.next(false);
        }, (error) => {
          this.toastr.error('Failed to update bid waiver status.');
          this.addItemService.showLoader$.next(false);
        });
      } else {
        this.toastr.warning('You can only Convert a Purchase Requisition to PR Bid Waiver only if the status is "Open".');
      }
    } else if (buttonData.button.label === 'DownloadPdf') {
      this.downloadPdf(buttonData);
    } else if (buttonData.button.label === 'SubmitWorkflow') {
      if (this.validateHeaderData(buttonData.headerData) && this.validateLineData(buttonData.lineData!)) {
        this.addItemService.showLoader$.next(true);
        this.updateUserId(buttonData, true);
      }
    } else if (buttonData.button.label === 'CancelWorkflow') {
      if (buttonData.data.ApprovalStatus === 'Pending Approval') {
        this.addItemService.showLoader$.next(true);
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.portalCancelPRApproval';
        let payload = {}
        this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
          this.toastr.success('Sent Cancel Request!');
          this.addItemService.showLoader$.next(false);
          this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Open' });
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      }
    }
    else if (buttonData.button.label === 'sendInvite') {
      this.sendInviteEmail(buttonData);
    } else if (buttonData.button.label === 'CompareQuote') {
      this.compareQuote(buttonData);
    } else if (buttonData.button.label === 'ConvertToQuote') {
      this.ConvertToQuote(buttonData);
    } else if (buttonData.button.label === 'ConvertToOrder') {
      this.ConvertToOrder(buttonData);
    }
  }

  private normalizeStatus(value: any) {
    return String(value ?? '').trim().toLowerCase();
  }

  private getProcurementMethod(header: any): ProcurementMethod {
    const method = String(header?.procurementMethod ?? '').trim();
    return (['Direct Purchase', 'RFQ', 'Bid Waiver', 'Vendor Selection', 'Contract Purchase'].includes(method) ? method : '') as ProcurementMethod;
  }

  private hasSelectedVendor(header: any) {
    return !!(header?.selectedVendorNo || header?.vendorNo || header?.selectedVendorName || header?.vendorName);
  }

  private isBidWaiverComplete(header: any) {
    return !!(header?.Reason && header?.Remark && this.hasSelectedVendor(header));
  }

  private applyProcurementFlow(header: any, lines: any[]) {
    const state = this.procurementFlow.getState(header, lines);
    this.addItemService.addHeaderButtons$.next(state.buttons);
  }

  private openCombineProcureList(buttonData: CustomButtonEvent) {
    const targetHeader = buttonData?.headerData || buttonData?.data;

    if (!targetHeader?.Id && !targetHeader?.id) {
      this.toastr.error('Unable to identify current purchase requisition header id.');
      return;
    }
    CombinedRequisitionComponent.combineProcureHeaderData = targetHeader;

    const popup = this.universalPopupService.open(
      'combinedRequisitionCombine',
      this
    );
    CombinedRequisitionComponent.combineProcurePopupRef = popup;
  }


  private CombinedPR(buttonData: CustomButtonEvent) {

    const storedHeaderData = CombinedRequisitionComponent.combineProcureHeaderData;
    const selectedRequisitions = Array.isArray(buttonData?.data)
      ? buttonData.data
      : [];

    if (!selectedRequisitions.length) {
      this.toastr.warning('Select purchase requisitions to combine.');
      return;
    }

    const headerId =
      storedHeaderData?.Id ||
      storedHeaderData?.id;

    if (!headerId) {
      this.toastr.error('Unable to identify the target purchase requisition header id.');
      return;
    }

    const prNos = selectedRequisitions
      .map((record: any) => record?.Number ?? record?.number)
      .filter((number: any) => number !== undefined && number !== null && number !== '');

    if (prNos.length !== selectedRequisitions.length) {
      this.toastr.warning('Selected purchase requisition Number is missing.');
      return;
    }

    this.addItemService.showLoader$.next(true);

    const url = `${this.config.headerApi}(${headerId})/Microsoft.NAV.combinedPR`;

    const payload = {
      prNosJson: JSON.stringify(prNos)
    };

    this.restService.post(url, payload).subscribe({
      next: () => {
        this.toastr.success('Combined line request submitted successfully.');
        this.addItemService.showLoader$.next(false);

        CombinedRequisitionComponent.combineProcurePopupRef?.close({
          action: 'CombinedPR',
          record: prNos
        });

        this.addItemService.reloadHeaderById$.next(headerId);
        this.addItemService.refreshDataDataTable$.next(true);
        CombinedRequisitionComponent.combineProcurePopupRef?.close();
      },
      error: () => {
        this.toastr.error('Failed to submit combined line request.');
        this.addItemService.showLoader$.next(false);
      }
    });
  }

  private getCurrentHeaderData(buttonData: CustomButtonEvent) {
    return buttonData.headerData || buttonData.data || {};
  }

  private refreshCurrentRequisition(buttonData: CustomButtonEvent) {
    const header = this.getCurrentHeaderData(buttonData);
    const headerId = header?.Id ?? buttonData.data?.Id;

    if (headerId !== undefined && headerId !== null) {
      this.addItemService.reloadHeaderById$.next(headerId);
    }

    this.addItemService.refreshDataDataTable$.next(true);
  }

  private async executeHeaderAction(buttonData: CustomButtonEvent, actionName: string, payload: any, successMessage: string): Promise<any> {
    const header = this.getCurrentHeaderData(buttonData);
    const headerId = header?.[this.config.idProp!] ?? buttonData.data?.[this.config.idProp!];

    if (headerId === undefined || headerId === null) {
      this.toastr.error('Unable to identify the current requisition.');
      return null;
    }

    const url = `${this.config.headerApi}(${headerId})/Microsoft.NAV.${actionName}`;

    this.addItemService.showLoader$.next(true);

    try {
      const response: any = await firstValueFrom(this.restService.post(url, payload ?? {}));
      this.toastr.success(successMessage);
      this.refreshCurrentRequisition(buttonData);
      return response;
    } catch (error) {
      this.toastr.error('Unable to complete the requested procurement action.');
      return null;
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }

  private hasProcurementReviewStarted(buttonData: CustomButtonEvent) {
    const header = this.getCurrentHeaderData(buttonData);
    const procurementStatus = this.normalizeStatus(header.procurementStatus);

    return !!procurementStatus && procurementStatus !== 'open' && procurementStatus !== 'draft';
  }

  private async startProcurementReview(buttonData: CustomButtonEvent) {
    const header = this.getCurrentHeaderData(buttonData);

    if (header.orderCreated || this.normalizeStatus(header.poCreationStatus) === 'po created') {
      this.toastr.warning('Purchase order has already been created for this requisition.');
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Start Procurement Review',
      message: 'Start procurement review for this requisition?',
      yesButtonText: 'Start Review',
      noButtonText: 'Cancel'
    });

    if (!confirmed) {
      return;
    }

    await this.executeHeaderAction(buttonData, 'StartProcurementReview', {}, 'Procurement review started.');
  }

  private async setProcurementMethod(buttonData: CustomButtonEvent) {
    if (!this.hasProcurementReviewStarted(buttonData)) {
      this.toastr.warning('Start procurement review first.');
      return;
    }

    const result = await this.dialogService.showMessageBox({
      title: 'Set Procurement Method',
      text: 'Select the procurement method for this requisition.',
      input: 'select',
      inputOptions: this.procurementMethodOptions,
      inputPlaceholder: 'Select procurement method',
      showCancelButton: true,
      confirmButtonText: 'Apply',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => value ? null : 'Select a procurement method.'
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    await this.executeHeaderAction(
      buttonData,
      'SetProcurementMethod',
      { procurementMethod: result.value },
      'Procurement method updated.'
    );
  }

  private async markVendorSelected(buttonData: CustomButtonEvent) {
    const header = this.getCurrentHeaderData(buttonData);
    const method = this.getProcurementMethod(header);

    if (!this.hasProcurementReviewStarted(buttonData)) {
      this.toastr.warning('Start procurement review first.');
      return;
    }

    if (!method) {
      this.toastr.warning('Set procurement method first.');
      return;
    }

    if (method === 'RFQ') {
      this.toastr.info('For RFQ, select the winning vendor inside Invite Vendors after quote comparison.');
      return;
    }

    if (method === 'Bid Waiver' && !this.isBidWaiverComplete(header)) {
      this.toastr.warning('Complete waiver reason, justification, and vendor before marking vendor selected.');
      return;
    }

    const selectedVendorNo = header.selectedVendorNo || header.vendorNo;
    const selectedVendorName = header.selectedVendorName || header.vendorName;

    if (!selectedVendorNo || !selectedVendorName) {
      this.toastr.warning('Please select a vendor first.');
      return;
    }

    await this.executeHeaderAction(
      buttonData,
      'MarkVendorSelected',
      {
        selectedVendorNo,
        selectedVendorName
      },
      'Vendor marked as selected.'
    );
  }

  private async convertPurchaseRequisitionToQuote(buttonData: CustomButtonEvent) {
    const header = this.getCurrentHeaderData(buttonData);
    const method = this.getProcurementMethod(header);

    if (!this.hasProcurementReviewStarted(buttonData)) {
      this.toastr.warning('Start procurement review first.');
      return;
    }

    if (method === 'RFQ') {
      this.toastr.info('For RFQ, convert the selected winning vendor inside Invite Vendors.');
      return;
    }

    if (!this.hasSelectedVendor(header)) {
      this.toastr.warning('Select and mark vendor before converting to quote.');
      return;
    }

    if (method === 'Direct Purchase') {
      this.toastr.info('Direct Purchase converts directly to order.');
      return;
    }

    if (method === 'Bid Waiver' && !this.isBidWaiverComplete(header)) {
      this.toastr.warning('Complete waiver reason, justification, and vendor before quote conversion.');
      return;
    }

    await this.executeHeaderAction(
      buttonData,
      'convertPurchaseRequisitionToQuote',
      {},
      'Purchase requisition converted to quote.'
    );
  }

  private async convertPurchaseRequisitionToOrder(buttonData: CustomButtonEvent) {
    const header = this.getCurrentHeaderData(buttonData);
    const method = this.getProcurementMethod(header);

    if (header.orderCreated || header.purchaseOrderNo || header.poCreationStatus === 'PO Created') {
      this.toastr.warning('Purchase order already exists for this requisition.');
      return;
    }

    if (!this.hasProcurementReviewStarted(buttonData)) {
      this.toastr.warning('Start procurement review first.');
      return;
    }

    if (method === 'RFQ') {
      this.toastr.info('RFQ must convert the selected vendor to quote first.');
      return;
    }

    if (method === 'Vendor Selection') {
      this.toastr.info('Vendor Selection should convert to quote first.');
      return;
    }

    if (!this.hasSelectedVendor(header)) {
      this.toastr.warning('Select and mark vendor before converting to order.');
      return;
    }

    if (method === 'Bid Waiver' && !this.isBidWaiverComplete(header)) {
      this.toastr.warning('Complete waiver reason, justification, and vendor before order conversion.');
      return;
    }

    const response = await this.executeHeaderAction(
      buttonData,
      'ConvertPurchaseRequisitionToOrder',
      {},
      'Purchase requisition converted to order.'
    );

    const poNumber = response?.purchaseOrderNo || response?.value?.purchaseOrderNo || response?.value?.PurchaseOrderNo;

    if (poNumber) {
      this.toastr.success(`Purchase order ${poNumber} created successfully.`);
    }
  }

  private isPrApprovalAction(buttonLabel: string) {
    return buttonLabel === 'SendApprovalRequest'
      || buttonLabel === 'CancelApprovalRequest'
      || buttonLabel === 'SubmitWorkflow'
      || buttonLabel === 'CancelWorkflow';
  }

  updateUserId(buttonData: CustomButtonEvent, approve: boolean) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getUserId';
    const payload = {
      userid2: this.sessionService.UserId,
      docNo: buttonData.data.Number,
      resCentre: this.sessionService.DefaultResponsibilityCenter,
      comp: this.sessionService.CompanyName,
      compId: this.sessionService.Company,
    };
    this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
      if (approve) {
        this.checkGLLinesBudget(buttonData);
      } else {
        this.cancelApprovalRequest(buttonData);
      }
    });
  }

  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Requisition'";
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
      let receivers: string[] = [];
      let approvalId: string;
      approvalId = response.value[0].ApproverID;
      if (typeof data.DocumentDate !== 'string') {
        data.RequisitionDate = this.utility.convertDateObjToString(data.RequisitionDate, true);
      }
      if (documentAction == 'CancelApprovalRequest') {
        approvalId = this.PendingApproversID;
        receivers.push(this.PendingApproversEmailId);
      }
      else {
        response.value.forEach((record: any) => {
          if (record.EMail && record.EMail !== '') {
            receivers.push(record.EMail);
          }
        });
      }
      this.emailNotifyService.sendNotification(senders, receivers, 'Requisition', data[this.config.headerApiOrderByField!], documentAction, data.RequisitionDate, '', false, false, approvalId, this.sessionService.UserId, data.Number);
    });
  }

  checkGLLinesBudget(buttonData: CustomButtonEvent) {
    if (buttonData.headerData && buttonData.headerData.BudgetName) {
      const gAccountsRecords = buttonData.lineData!.filter(x => x.PurchaseRequisitionType === 'G/L Account').map(x => x.Number);
      const gAccounts = [...new Set(gAccountsRecords)];
      if (gAccounts.length > 0) {
        const requisitionDate = this.utility.convertDateObjToString({
          year: buttonData.headerData.RequisitionDate.year,
          month: buttonData.headerData.RequisitionDate.month,
          day: 1
        }, true);
        const url: string = `/glbudgetentries?$filter=BudgetName eq '${buttonData.headerData.BudgetName}'`;
        this.restService.get(url).subscribe((res: any) => {
          if (res.value.length > 0) {
            const resultedGAccounts = res.value.filter((x: any) => gAccounts.includes(x.glaccno));
            const glRecords = <string[]>resultedGAccounts.map((x: any) => x.glaccno);
            const resultedGAccountNos = [...new Set(glRecords)];
            if (resultedGAccountNos.length !== gAccounts.length) {
              this.toastr.warning('Some of the GL Accounts Budget details are not found');
              this.addItemService.showLoader$.next(false);
            } else {
              let overBudgetAccounts: string[] = [];
              for (let i = 0; i < gAccounts.length; i++) {
                const currentBudgetTotal = buttonData.lineData!.filter(x => x.PurchaseRequisitionType === 'G/L Account' && x.Number === gAccounts[i]).map(x => +x.Amount).reduce((a, b) => a + b, 0);
                const gAccount = resultedGAccounts.filter((x: any) => x.glaccno === gAccounts[i])[0];
                if (gAccount) {
                  if (gAccount.ConsumedBudget + currentBudgetTotal > gAccount.TotalBudget) {
                    overBudgetAccounts.push(gAccounts[i]);
                  }
                }
              }

              if (overBudgetAccounts.length === 0) {
                this.SendWorkflowRequest(buttonData);
              } else {
                this.toastr.warning(`The G/L accounts ${overBudgetAccounts.join(',')} exceeded the budgets`);
                this.addItemService.showLoader$.next(false);
              }
            }
          } else {
            this.toastr.warning('No Budget details found for the given GL Accounts / Purchase Requisition Date');
            this.addItemService.showLoader$.next(false);
          }
        });
      } else {
        this.SendWorkflowRequest(buttonData);
      }
    } else {
      this.SendWorkflowRequest(buttonData);

    }
  }

  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendPurchaseRequisitionApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Pending Approval', eventEmit: true });
      this.getPrPreparer(buttonData);
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      this.updatePendingApprovalID(buttonData.data);
    });
  }

  SendWorkflowRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.PortalSendPRForApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Workflow Request!');
      this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Pending Approval', eventEmit: true });
      this.getPrPreparer(buttonData);
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendWorkflowRequest');
      this.updatePendingApprovalID(buttonData.data);
    });
  }

  updatePendingApprovalID(data: any) {
    let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.Number + "'"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        const ifMatchKey = "*";
        const query = '(' + data.Id + ')';
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId };
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        this.restService.patch("/purchaseRequisitionHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
          this.addItemService.showLoader$.next(false);
        });
      }
    });
  }

  cancelApprovalRequest1(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelPurchaseRequsitionApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel Request!');
      this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Open', eventEmit: true });
      this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
    });
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.PortalCancelPRForApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel Request!');
      this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Open', eventEmit: true });
      this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
    });
  }

  downloadPdf(buttonData: CustomButtonEvent) {
    const url: string = '/salesInvoices(71cc69fb-e506-ec11-86bc-000d3ac8b198)/pdfDocument(71cc69fb-e506-ec11-86bc-000d3ac8b198)/content';
    this.restService.downloadFile(url).subscribe((response: any) => {
      this.toastr.success('File downloaded successfully!');
    });
  }

  getPrPreparer(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getPrPreparer';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      // this.addItemService.enableOrDisableAllControls$.next(false);
    });
  }
  SetVendor(data: EventDataModel) {
    if (!data.data) {
      this.formDataService.updateControlData$.next({ control: 'selectedVendorNo', data: null });
      this.formDataService.updateControlData$.next({ control: 'selectedVendorName', data: null });
      this.formDataService.updateControlData$.next({ control: 'vendorName', data: null });
      this.refreshRfqVendorLines();
      return;
    }

    this.addItemService.showLoader$.next(true);

    this.restService.get(`/vendorsAPI?$filter=number eq '${data.data}'`).subscribe({
      next: (response: any) => {
        const vendor = response?.value?.[0];

        this.formDataService.updateControlData$.next({ control: 'selectedVendorNo', data: data.data });
        this.formDataService.updateControlData$.next({ control: 'selectedVendorName', data: vendor?.displayName ?? null });
        this.formDataService.updateControlData$.next({ control: 'vendorName', data: vendor?.displayName ?? null });
        this.refreshRfqVendorLines();
        this.addItemService.showLoader$.next(false);
      },
      error: () => {
        this.toastr.error('Failed to load vendor details.');
        this.addItemService.showLoader$.next(false);
      }
    });
  }

  private getSelectedRfqRows(buttonData: CustomButtonEvent, indexes: number[]): any[] {
    const lineData = buttonData?.lineData || [];

    if (!lineData.length || !indexes?.length) {
      return [];
    }

    return indexes
      .map((index) => lineData[index])
      .filter((row: any) => !!row);
  }

  private async getSelectedRfqIndexes(): Promise<number[]> {
    const selectedIndexes = await firstValueFrom(this.selectedItemService.selectedLines$.pipe(take(1)));
    if (selectedIndexes?.length) {
      return selectedIndexes;
    }

    return firstValueFrom(this.selectedItemService.selectedLinesForSubPopup$.pipe(take(1)));
  }

  private refreshRfqVendorLines(): void {
    this.addItemService.popupRefreshLineData$.next(true);
    this.addItemService.subPopupRefreshLineData$.next(true);
  }

  private refreshRfqVendorPopup(buttonData?: CustomButtonEvent): void {
    const header = this.getCurrentHeaderData(buttonData || {} as CustomButtonEvent);
    const headerId = header?.Id ?? buttonData?.data?.Id;

    if (headerId !== undefined && headerId !== null) {
      this.addItemService.reloadHeaderById$.next(headerId);
    }

    this.refreshRfqVendorLines();
  }

  private getWinningVendorRows(buttonData: CustomButtonEvent): any[] {
    return (buttonData?.lineData || []).filter((row: any) => row?.isSelected);
  }

  private async processVendorRows(
    rows: any[],
    buildUrl: (row: any) => string,
    onInvalidRow: (row: any) => string | null,
    onFailure: (row: any) => string,
  ): Promise<{ successCount: number; failedCount: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      const invalidReason = onInvalidRow(row);
      if (invalidReason) {
        this.toastr.warning(invalidReason);
        failedCount += 1;
        continue;
      }

      try {
        await this.delay(200);
        await firstValueFrom(this.restService.post(buildUrl(row), {}));
        successCount += 1;
      } catch {
        this.toastr.error(onFailure(row));
        failedCount += 1;
      }
    }

    return { successCount, failedCount };
  }


  async sendInviteEmail(buttonData: CustomButtonEvent) {
    const selectedIndexes = await this.getSelectedRfqIndexes();

    if (!selectedIndexes?.length) {
      this.toastr.warning("Select vendor rows to send RFQ invites.");
      return;
    }

    const selectedRows = this.getSelectedRfqRows(buttonData, selectedIndexes)
      .filter((row: any) => (row?.vendorNo || row?.vendorName) && !row?.isInvited);

    if (!selectedRows.length) {
      this.toastr.warning('No pending vendor rows are ready for invitation.');
      return;
    }

    this.addItemService.showLoader$.next(true);

    const result = await this.processVendorRows(
      selectedRows,
      (row) => `${this.getRfqVendorLineApi()}(${row.systemId})/Microsoft.NAV.sendInviteEmail`,
      (row) => {
        if (!row?.systemId) {
          return `Vendor ${row?.vendorName || row?.vendorNo || 'row'} must be saved before sending an invite.`;
        }

        if (!row?.vendorNo) {
          return 'Vendor number is required before sending an invite.';
        }

        if (!row?.vendorEmail) {
          return `Vendor ${row?.vendorName || row?.vendorNo} is missing an email address.`;
        }

        return null;
      },
      (row) => `Failed to send RFQ invite for ${row?.vendorName || row?.vendorNo || 'vendor'}.`
    );

    if (result.successCount > 0) {
      this.toastr.success(`${result.successCount} RFQ invite(s) sent successfully.`);
      this.refreshRfqVendorPopup(buttonData);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }

    if (result.successCount === 0 && result.failedCount > 0) {
      this.toastr.warning('No RFQ invites were sent. Review the selected vendor rows.');
    }

    this.addItemService.showLoader$.next(false);
  }


  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async ConvertToQuote(buttonData: CustomButtonEvent) {
    if (buttonData?.headerData?.orderCreated) {
      this.toastr.warning('This requisition already has a purchase order.');
      return;
    }

    if (!buttonData?.lineData?.length) {
      this.toastr.warning('No RFQ vendor lines found.');
      return;
    }

    const selectedVendors = this.getWinningVendorRows(buttonData);
    if (selectedVendors.length === 0) {
      this.toastr.warning('Select one winning vendor before converting to quote.');
      return;
    }

    if (selectedVendors.length > 1) {
      this.toastr.warning('Only one RFQ winner can be converted at a time.');
      return;
    }

    const convertibleVendors = selectedVendors.filter(
      (row: any) => !row.poCreated && !row.quoteCreated
    );

    if (convertibleVendors.length === 0) {
      this.toastr.warning('The selected winner is already processed.');
      return;
    }

    this.addItemService.showLoader$.next(true);

    const result = await this.processVendorRows(
      convertibleVendors,
      (row) => `${this.getRfqVendorLineApi()}(${row.systemId})/Microsoft.NAV.convertToQuote`,
      (row) => {
        if (!row?.systemId) {
          return `Vendor ${row?.vendorName || row?.vendorNo || 'winner'} must be saved before conversion.`;
        }

        if (Number(row?.quotedAmount || 0) <= 0) {
          return `Vendor ${row?.vendorName || row?.vendorNo || 'winner'} needs a quoted amount before quote conversion.`;
        }

        return null;
      },
      (row) => `Failed to convert ${row?.vendorName || row?.vendorNo || 'winner'} to quote.`
    );

    if (result.successCount > 0) {
      this.toastr.success(`Winning vendor converted to quote successfully.`);
      this.refreshRfqVendorPopup(buttonData);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }

    if (result.successCount === 0 && result.failedCount > 0) {
      this.toastr.warning('Quote conversion did not complete. Review the winning vendor row.');
    }

    this.addItemService.showLoader$.next(false);
  }




  async ConvertToOrder(buttonData: CustomButtonEvent) {

    if (buttonData?.headerData?.quoteCreated) {
      this.toastr.warning('This requisition already has a purchase quote.');
      return;
    }

    if (!buttonData?.lineData?.length) {
      this.toastr.warning('No RFQ vendor lines found.');
      return;
    }

    const selectedVendors = this.getWinningVendorRows(buttonData);
    if (selectedVendors.length === 0) {
      this.toastr.warning('Select one winning vendor before converting to order.');
      return;
    }

    if (selectedVendors.length > 1) {
      this.toastr.warning('Only one RFQ winner can be converted at a time.');
      return;
    }

    const convertibleVendors = selectedVendors.filter(
      (row: any) => !row.poCreated && !row.quoteCreated
    );

    if (convertibleVendors.length === 0) {
      this.toastr.warning('The selected winner is already processed.');
      return;
    }

    this.addItemService.showLoader$.next(true);

    const result = await this.processVendorRows(
      convertibleVendors,
      (row) => `${this.getRfqVendorLineApi()}(${row.systemId})/Microsoft.NAV.convertToOrder`,
      (row) => {
        if (!row?.systemId) {
          return `Vendor ${row?.vendorName || row?.vendorNo || 'winner'} must be saved before conversion.`;
        }

        if (Number(row?.quotedAmount || 0) <= 0) {
          return `Vendor ${row?.vendorName || row?.vendorNo || 'winner'} needs a quoted amount before order conversion.`;
        }

        return null;
      },
      (row) => `Failed to convert ${row?.vendorName || row?.vendorNo || 'winner'} to order.`
    );

    if (result.successCount > 0) {
      this.toastr.success('Winning vendor converted to order successfully.');
      this.refreshRfqVendorPopup(buttonData);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }

    if (result.successCount === 0 && result.failedCount > 0) {
      this.toastr.warning('Order conversion did not complete. Review the winning vendor row.');
    }

    this.addItemService.showLoader$.next(false);
  }



}

