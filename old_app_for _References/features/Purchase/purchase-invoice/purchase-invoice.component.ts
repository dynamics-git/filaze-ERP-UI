import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { PurchaseInvoiceCalculation, PurchaseInvoiceHeader, PurchaseInvoiceLine } from './purchase-invoice.config';
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
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { firstValueFrom, take } from 'rxjs';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';

import { CustomSharedService } from '../../../core/services/shared/custom-shared.service';
import { AttachmentsComponent } from '../../../shared/components/attachments/attachments.component';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { PURCHASE_INVOICE_LINE_SUMMARY, PurchaseInvoiceSummary } from '../../../shared/components/summary/summary.config';

import { SelectedRowIndexService } from '../../../core/services/shared/selected-row-index.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { ChangeAllocationsComponent } from '../change-allocations/change-allocations.component';
import { PrepaymentComponent } from '../pre-payment/pre-payment.component';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { AddDimensionsLines } from '../../../shared/components/add-dimension/add-dimension.config';
import { AddDimensionComponent } from '../../../shared/components/add-dimension/add-dimension.component';

@Component({
  standalone: false,
  selector: 'app-posted-purchase-invoice',
  template: `
    <app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (leaveEvent)="leaveEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"  [MenuButtons]="MenuButtons">
    </app-data-table>
    `
})
export class PurchaseInvoiceComponent {

  config: DataTableConfig = {
    title: 'Purchase Invoice',
    idProp: 'Id',
    headerApi: '/purchaseInvoiceHeaders',
    pageName: 'PI',
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    showDelete: true,
    showCreate: true,
    headers: [
      {
        name: 'Number',
        prop: 'Number',
        isPrimaryLink: true
      },

      {
        name: 'Vendor No',
        prop: 'BuyFromVendorNumber'
      },
      {
        name: 'Vendor Name',
        prop: 'BuyFromVendorName'
      },
      {
        name: 'Posting Date',
        prop: 'PostingDate'
      },
      {
        name: 'Document Date',
        prop: 'DocumentDate'
      },
      {
        name: 'Status',
        prop: 'Status'
      },
      {
        name: 'Pending Approvers ID',
        prop: 'PendingApproversID',
      },
      {
        name: 'Remark',
        prop: 'Remark',
      },
      {
        name: 'Vendor Invoice Number',
        prop: 'VendorInvoiceNumber',
      },

      {
        name: 'Amount',
        prop: 'amount',
      },
      {
        name: 'Portal Responsibility Centre',
        prop: 'PortalResponsibilityCentre',
      },

    ],

    filterConfig: [
      {
        field: 'Status',
        label: 'Status',
        type: 'dropdown',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'Released', label: 'Released' },
          { value: 'Pending Approval', label: 'Pending Approval' }
        ]
      },

    ],

    selctionType: 'single',
    addItemConfig: {
      title: 'Purchase Invoice',
      recordId: "Number",
      recordTitle: "BuyFromVendorName",
      headerConfig: PurchaseInvoiceHeader,
      lineConfig: PurchaseInvoiceLine,
      subLineSections: [
        {
          key: 'dimensions',
          title: 'Dimension',
          component: AddDimensionComponent,
          config: AddDimensionsLines,
          position: 'beforeMainLines'
        }
      ],
      calculationSectionConfig: PurchaseInvoiceCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Invoice',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseInvoice,
        summaryFields: PurchaseInvoiceSummary,
        SummaryFieldConfigLine: PURCHASE_INVOICE_LINE_SUMMARY
      },
      validateOnLineDelete: async (lines: any[]) => {
        const allocationLine = lines.find(l => l?.hasAllocation === true);
        if (allocationLine) {
          return {
            allowed: false,
            message: `This line has an allocation. Please remove the allocation before deleting.`
          };
        }
        const prepaymentLine = lines.find(l => l?.hasPrepayment === true);
        if (prepaymentLine) {
          return {
            allowed: false,
            message: `This line has a prepayment. Please remove the prepayment before deleting.`
          };
        }
        return { allowed: true };
      }
    },
    factBoxConfig: {
      boxType: FactBoxType.PurchaseInvoice
    },

    removeUnicodeCharFields: ['Status']
  };

  MenuButtons: Menubuttons[] = [
  ];

  chartAccountData!: any[];
  allocationAccountData!: any[];
  itemData!: any[];
  fixedAssetData!: any[];
  HeaderData: any;
  totalAmount: number = 0;
  amountIncludingVAT: number = 0;
  totalSST: number = 0;
  totalInclSST: number = 0;
  comments: any[] = [];
  loading!: boolean;
  PendingApproversID!: string;
  PendingApproversEmailId!: string;
  approvalEntriesResponse!: any
  private previousCurrencyCode: string | null = null;
  private pendingCurrencyEvent!: EventDataModel;

  private cachedApiLines: any[] = [];

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private modal: NgbModal,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility,
    private selectedItemService: SelectedItemService,
    private universalPopupService: UniversalPopupService,
    private customSharedService: CustomSharedService,
    private dialogService: UnifiedDialogService,
    private selectedRowIndexService: SelectedRowIndexService,
    public changeAllocations: ChangeAllocationsComponent,
    public prePaymentDelegate: PrepaymentComponent
  ) {
  }

  popupLoaded(data: any) {
    if (data.header.Status === 'Open') {
      this.formDataService.disableControlsList$.next(['igp', 'gmd']);
    }
    if (data.header.Status === 'Released') {
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.formDataService.enableControl$.next('VendorInvoiceNumber');
    }
    if (!data.header.Number) {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }
    ////////12-10-21
    if (data.header.Status == 'Pending Approval') {
      if (data.linkItemType == 'Invoice') {
        this.checkForApprovalEntry(data.header, data.linkItemType);
      } else {
        this.addItemService.disableAllControlsExceptSome$.next(['Remark']);
      }
      let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "'"
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
          this.PendingApproversID = response.value[0].ApproverID;
          this.PendingApproversEmailId = response.value[0].ApproverEmailId;
          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + data.header.Id + ')';
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          this.restService.patch("/purchaseInvoiceHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
          });
        }
      });
    }

    ////////12-10-21
    this.HeaderData = data.header;
    const HeaderData = data.header;

    /////ar//dimention///
    this.restService.get("/dimensionsValues").subscribe((response: any) => {
      if (response) {
        // lineData.forEach((line: any, rowIndex: number) => {

        const PRJCT = response.value.filter((m: any) => m.DimensionCode == "PROJECT");
        const PROJECT = PRJCT.filter((m: any) => m.DimensionValueType == "Standard");
        this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimension1Code', items: PROJECT, displayFormat: '[Code] - [Name]', bindValue: 'Code', });
        if (HeaderData.ShortcutDimension1Code) {
          setTimeout(() => {
            this.formDataService.updateControlData$.next({ control: 'ShortcutDimension1Code', data: HeaderData.ShortcutDimension1Code });
            this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension1Code', data: HeaderData.ShortcutDimension1Code, });
          }, 100);
        }

        const DEPART = response.value.filter((m: any) => m.DimensionCode == "DEPARTMENT/COST CNTR");
        const DEPARTMENT = DEPART.filter((m: any) => m.DimensionValueType == "Standard");
        this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimension2Code', items: DEPARTMENT, displayFormat: '[Code] - [Name]', bindValue: 'Code', });
        if (HeaderData.ShortcutDimension2Code) {
          this.formDataService.updateControlData$.next({ control: 'ShortcutDimension2Code', data: HeaderData.ShortcutDimension2Code });
          this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension2Code', data: HeaderData.ShortcutDimension2Code, })
        }
        // const SUBGROUP = response.value.filter(m => m.DimensionCode == "SUBGROUP");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode3', items: SUBGROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const SUBSUBGROUP = response.value.filter(m => m.DimensionCode == "SUB-SUBGROUP");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode4', items: SUBSUBGROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const ENTITY = response.value.filter(m => m.DimensionCode == "ENTITY");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode5', items: ENTITY, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const GROUP = response.value.filter(m => m.DimensionCode == "GROUP");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode6', items: GROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const SEGMENT = response.value.filter(m => m.DimensionCode == "SEGMENT");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode7', items: GROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });
        // });

      }
    });
    /////ar//dimention///
    const lineData = data.line;
    this.cachedApiLines = lineData ?? [];
    this.totalAmount = 0;
    this.totalInclSST = 0;
    this.totalSST = 0;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
        // this.totalInclSST += line['AmountLCY'] ? +line['AmountLCY'] : 0;
        this.totalInclSST += line['amountIncludingVAT'] ? +line['amountIncludingVAT'] : 0;
        switch (line.Type) {
          case 'G/L Account':
            if (this.chartAccountData) {
              this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/glAccounts').subscribe((response: any) => {
                this.chartAccountData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
                }, 100);
              });
            }

            break;
          case 'Item':
            if (this.itemData) {
              this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/Items').subscribe((response: any) => {
                this.itemData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case 'Fixed Asset':
            if (this.fixedAssetData) {
              this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/fixedAssets').subscribe((response: any) => {
                this.fixedAssetData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case 'Allocation Account':
            if (this.allocationAccountData) {
              this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.allocationAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/allocationAccHdrs').subscribe((response: any) => {
                this.allocationAccountData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.allocationAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case ' ':
            this.formDataService.disableLineControlsList$.next([
              { label: 'No', rowIndex: rowIndex, clearValue: true },
              { label: 'UnitOfMeasure', rowIndex: rowIndex, clearValue: true },
              { label: 'LocationCode', rowIndex: rowIndex, clearValue: true },
              { label: 'Quantity', rowIndex: rowIndex, clearValue: true },
              { label: 'DirectUnitCost', rowIndex: rowIndex, clearValue: true },
              { label: 'LineAmount', rowIndex: rowIndex, clearValue: true }
            ]);
            break;
          default:
            this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: rowIndex });
            break;

        }
      });
    }

    if (data?.header?.exchangeRate && data.header.exchangeRate != 0) {
      this.totalInclSST = Number((this.totalInclSST * data.header.exchangeRate).toFixed(2));
    }
    this.totalSST = (data?.header?.amountIncludingVAT ?? 0) - (this.totalAmount ?? 0);
    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: (this.totalAmount ?? 0).toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalInclSST', data: (this.totalInclSST ?? 0).toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'amountIncludingVAT', data: (data?.header?.amountIncludingVAT ?? 0).toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalSST', data: (this.totalSST ?? 0).toFixed(2) });



    const totalSSTControl = this.config.addItemConfig
      ?.calculationSectionConfig
      ?.controls
      ?.flat()
      ?.find((c: any) => c.label === 'amountIncludingVAT');

    if (totalSSTControl) {
      const currency = data?.header?.currencyCode;
      totalSSTControl.name = currency
        ? `Total Incl. SST (${currency})`
        : 'Total Incl. SST';
    }
    this.previousCurrencyCode = data?.header?.currencyCode ?? null;
  }


  checkForApprovalEntry1(data: any) {
    this.addItemService.showLoader$.next(true);
    let senderEmailId = "";
    if (data.header.Status == 'Pending Approval' && data.linkItemType == 'Invoice') {
      let url = "/approvalEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "' and documentType eq '" + data.linkItemType + "'";
      this.restService.get(url).subscribe((res: any) => {
        let response = res.value[0];
        if (response) {
          senderEmailId = response.senderEmailId;
          this.approvalEntriesResponse = response;
          if (senderEmailId !== this.sessionService.Email) {
            //  this.formDataService.enableControlsList$.next(['igp', 'gmd']);
            this.addItemService.disableAllControlsExceptSome$.next(['igp', 'gmd', 'Remark']);
            this.addItemService.isDisableDimensionButton$.next(true);
            this.addItemService.isDisableDimensionInPopup$.next(true);
          }
        }
      });
    }
    this.addItemService.showLoader$.next(false);
  }

  checkForApprovalEntry(header: any, linkItemType: any) {
    this.addItemService.showLoader$.next(true);

    if (header.Status == 'Pending Approval' && linkItemType == 'Invoice') {
      const url =
        "/approvalEntries?$filter=Status eq 'Open' and DocumentNo eq '" +
        header.Number +
        "' and documentType eq '" +
        linkItemType +
        "'";

      this.restService.get(url).subscribe({
        next: (res: any) => {
          //const response = res?.value?.[0];
          const response = res?.value?.find((x: any) => (x.approverId) === this.sessionService.UserId);
          if (!response) {
            this.addItemService.showLoader$.next(false);
            return;
          }

          this.approvalEntriesResponse = response;
          const senderEmailId = response.senderEmailId;

          if (senderEmailId !== this.sessionService.Email) {
            this.addItemService.isDisableDimensionButton$.next(true);
            this.addItemService.isDisableDimensionInPopup$.next(true);

            const approvalOpeUrl = `/approvalOpes(${response.id})`;

            this.restService.get(approvalOpeUrl).subscribe({
              next: (opeRes: any) => {
                const controlsToEnable: string[] = ['Remark'];
                const controlsToDisable: string[] = [];

                if (opeRes?.igp === true) {
                  controlsToEnable.push('igp');
                } else {
                  controlsToDisable.push('igp');
                }

                if (opeRes?.gmd === true) {
                  controlsToEnable.push('gmd');
                } else {
                  controlsToDisable.push('gmd');
                }

                this.addItemService.disableAllControlsExceptSome$.next(controlsToEnable);

                if (controlsToDisable.length) {
                  this.formDataService.disableControlsList$.next(controlsToDisable);
                }

                this.addItemService.showLoader$.next(false);
              },
              error: () => {
                this.toastr.error('Failed to load approval operation settings');
                this.addItemService.showLoader$.next(false);
              }
            });
          } else {
            this.addItemService.showLoader$.next(false);
          }
        },
        error: () => {
          this.toastr.error('Failed to load approval entry');
          this.addItemService.showLoader$.next(false);
        }
      });
    } else if (header.Status == 'Pending Approval' && linkItemType != 'Invoice') {
      this.formDataService.disableControlsList$.next(['igp', 'gmd']);
      this.addItemService.showLoader$.next(false);
    } else {
      this.addItemService.showLoader$.next(false);
    }
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'BuyFromVendorNumber':
          this.formDataService.disableControlsList$.next(['igp', 'gmd']);
          this.vendeordetails(data);
          this.formDataService.updateLineControlData$.next({ control: 'documentType', data: 'Invoice', rowIndex: data.rowIndex })

          break;
        case 'ShortcutDimension1Code':
          setTimeout(() => {
            this.formDataService.updateLineControlsListData$.next([{ control: 'ShortcutDimension1Code', data: data.data, }])
          }, 100);

          break;
        case 'ShortcutDimension2Code':
          setTimeout(() => {
            this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension2Code', data: data.data, })
          }, 100);
          break;
        case 'currencyCode':
          this.pendingCurrencyEvent = data;
          this.addItemService.suspendHeaderAutoSave$.next(true);
          this.confirmCurrencyChange(data);
          break;
        case 'igp':
        case 'gmd':
          setTimeout(() => {
            this.checkForApprovalEntry(data.headerData, data.linkItemType);
          }, 500);
          break;
      }


    }

    if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'Type':
          this.changeType(data);
          break;
        case 'No':
          this.changeItemNo(data);
          break;
        case 'Quantity':
        case 'DirectUnitCost':
          this.calculateAmount(data);
          break;
        case 'VATProdPostingGroup':
          this.calculateAmountForVATProdPostingGroup(data);
          break;
      }
    }
  }

  async CheckAutoQuantity(data: any) {
    const res: any = await firstValueFrom(
      this.restService.get('/portalSetups').pipe(take(1))
    );

    if (!res?.value?.length) return;

    const purchInvoiceAutoQty = res.value[0]?.purchInvoiceAutoQty;

    if (data.data > purchInvoiceAutoQty) {
      this.toastr.warning(
        `Quantity must be less than or equal to ${purchInvoiceAutoQty}`
      );
      setTimeout(() => {
        this.addItemService.patchLineData$.next({
          rowIndex: data.rowIndex!,
          data: { Quantity: 0 },
          disableControls: false
        });
        this.formDataService.updateLineControlData$.next({
          control: 'Quantity',
          data: 0,
          rowIndex: data.rowIndex,
        });
      }, 1000);
      return;
    } else if (data.data <= purchInvoiceAutoQty) {
      this.calculateAmount(data);
    }
  }







  vendeordetails(data: EventDataModel) {
    this.restService.get("/vendorsAPI?$filter=number eq '" + data.data + "'").subscribe((response: any) => {
      if (response) {
        this.formDataService.updateControlData$.next({ control: 'BuyFromVendorName', data: response.value[0].displayName });
        this.formDataService.updateControlData$.next({ control: 'BuyFromCounty', data: response.value[0].address.countryLetterCode });
        this.formDataService.updateControlData$.next({ control: 'BuyFromPostCode', data: response.value[0].address.postalCode });
        this.formDataService.updateControlData$.next({ control: 'BuyFromCity', data: response.value[0].address.city });
        this.formDataService.updateControlData$.next({ control: 'BuyFromContactNumber', data: response.value[0].Contact });
        this.formDataService.updateControlData$.next({ control: 'BuyFromAddress', data: response.value[0].address.street });

      }
    });
  }

  changeType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'No', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: null, rowIndex: data.rowIndex });
    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControlsList$.next([
          { label: 'No', rowIndex: data.rowIndex! },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex! },
          { label: 'LocationCode', rowIndex: data.rowIndex! },
          { label: 'Quantity', rowIndex: data.rowIndex! },
          { label: 'DirectUnitCost', rowIndex: data.rowIndex! },
          { label: 'LineAmount', rowIndex: data.rowIndex! }
        ]);
        if (this.chartAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/glAccounts').subscribe((response: any) => {
            this.chartAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Item':
        this.formDataService.enableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        if (this.itemData) {
          this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/Items').subscribe((response: any) => {
            this.itemData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Fixed Asset':
        this.formDataService.enableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        if (this.fixedAssetData) {
          this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/fixedAssets').subscribe((response: any) => {
            this.fixedAssetData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Allocation Account':
        this.formDataService.enableLineControlsList$.next([
          { label: 'No', rowIndex: data.rowIndex! },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex! },
          { label: 'LocationCode', rowIndex: data.rowIndex! },
          { label: 'Quantity', rowIndex: data.rowIndex! },
          { label: 'DirectUnitCost', rowIndex: data.rowIndex! },
          { label: 'LineAmount', rowIndex: data.rowIndex! }
        ]);
        if (this.allocationAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.allocationAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/allocationAccHdrs').subscribe((response: any) => {
            this.allocationAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.allocationAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case ' ':
        this.formDataService.disableLineControlsList$.next([
          { label: 'No', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LocationCode', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Quantity', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'DirectUnitCost', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LineAmount', rowIndex: data.rowIndex!, clearValue: true }
        ]);
        break;
      default:
        this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        break;
    }

    if (this.HeaderData.ShortcutDimension1Code) {
      this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension1Code', data: this.HeaderData.ShortcutDimension1Code, rowIndex: data.rowIndex })
    }
    if (this.HeaderData.ShortcutDimension2Code) {
      this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension2Code', data: this.HeaderData.ShortcutDimension2Code, rowIndex: data.rowIndex })
    }
    this.formDataService.updateLineControlData$.next({ control: 'documentType', data: 'Invoice', rowIndex: data.rowIndex })

  }

  changeItemNo(data: EventDataModel) {
    const purchaseType = data.activeData.Type;

    switch (purchaseType) {
      case 'G/L Account':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData?.Name ?? '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: data.dropdownData?.Name ?? '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'UnitOfMeasure', data: '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'LocationCode', data: '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'DirectUnitCost', data: 0, rowIndex: data.rowIndex, eventEmit: false });
        this.recalculateInvoiceSummary(data.linesData, data.rowIndex, {
          LineAmount: 0,
          amountIncludingVAT: 0,
          AmountLCY: 0,
          DirectUnitCost: 0,
          Description: data.dropdownData?.Name ?? '',
          GLAccountName: data.dropdownData?.Name ?? '',
          UnitOfMeasure: '',
          LocationCode: ''
        }, data.headerData);
        break;
      case 'Item':
      case 'Fixed Asset':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData?.Description ?? '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: data.dropdownData?.Description ?? '', rowIndex: data.rowIndex, eventEmit: false });
        break;
      case 'Allocation Account':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData?.Name ?? '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: data.dropdownData?.Name ?? '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'UnitOfMeasure', data: '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'LocationCode', data: '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'DirectUnitCost', data: 0, rowIndex: data.rowIndex, eventEmit: false });
        this.recalculateInvoiceSummary(data.linesData, data.rowIndex, {
          LineAmount: 0,
          amountIncludingVAT: 0,
          AmountLCY: 0,
          DirectUnitCost: 0,
          Description: data.dropdownData?.Name ?? '',
          GLAccountName: data.dropdownData?.Name ?? '',
          UnitOfMeasure: '',
          LocationCode: ''
        }, data.headerData);
        break;
      case ' ':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData?.Description ?? '', rowIndex: data.rowIndex, eventEmit: false });
        this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: data.dropdownData?.Description ?? '', rowIndex: data.rowIndex, eventEmit: false });
        break;
    }
  }

  private toInvoiceNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private getEstimatedVatPercent(line: any): number {
    return this.toInvoiceNumber(line?.vat);
  }

  private getEstimatedLineValues(line: any, headerData?: any) {
    const quantity = this.toInvoiceNumber(line?.Quantity || 1) || 1;
    const unitCost = this.toInvoiceNumber(line?.DirectUnitCost);
    const discount = this.toInvoiceNumber(line?.LineDiscountAmount);
    const vatPercent = this.getEstimatedVatPercent(line);

    const lineAmount = Number(Math.max((quantity * unitCost) - discount, 0).toFixed(2));
    const amountIncludingVAT = Number((lineAmount * (1 + (vatPercent / 100))).toFixed(2));
    const exchangeRate = this.toInvoiceNumber(headerData?.exchangeRate);
    const amountLCY = exchangeRate > 0
      ? Number((amountIncludingVAT * exchangeRate).toFixed(2))
      : amountIncludingVAT;

    return { lineAmount, amountIncludingVAT, amountLCY };
  }

  private recalculateInvoiceSummary(linesData: any[] | undefined, rowIndex?: number, override: any = {}, headerData?: any) {
    const lines = Array.isArray(linesData) ? linesData : [];

    this.totalAmount = 0;
    this.amountIncludingVAT = 0;
    this.totalInclSST = 0;

    lines.forEach((line: any, index: number) => {
      const workingLine = index === rowIndex ? { ...line, ...override } : line;
      const estimates = this.getEstimatedLineValues(workingLine, headerData);

      this.totalAmount += estimates.lineAmount;
      this.amountIncludingVAT += estimates.amountIncludingVAT;
      this.totalInclSST += estimates.amountLCY;
    });

    this.totalAmount = Number(this.totalAmount.toFixed(2));
    this.amountIncludingVAT = Number(this.amountIncludingVAT.toFixed(2));
    this.totalInclSST = Number(this.totalInclSST.toFixed(2));
    this.totalSST = Number((this.amountIncludingVAT - this.totalAmount).toFixed(2));

    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalInclSST', data: this.totalInclSST.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'amountIncludingVAT', data: this.amountIncludingVAT.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalSST', data: this.totalSST.toFixed(2) });
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



  calculateAmount(data: EventDataModel) {
    const sourceLine = data.activeData || {};
    const nextLine = {
      ...sourceLine,
      [data.control]: data.data
    };

    const estimates = this.getEstimatedLineValues(nextLine, data.headerData);

    this.formDataService.updateLineControlData$.next({
      control: 'LineAmount',
      data: estimates.lineAmount.toFixed(2),
      rowIndex: data.rowIndex,
      eventEmit: false
    });

    this.formDataService.updateLineControlData$.next({
      control: 'AmountLCY',
      data: estimates.amountLCY.toFixed(2),
      rowIndex: data.rowIndex,
      eventEmit: false
    });

    this.recalculateInvoiceSummary(data.linesData, data.rowIndex, {
      ...nextLine,
      LineAmount: estimates.lineAmount,
      amountIncludingVAT: estimates.amountIncludingVAT,
      AmountLCY: estimates.amountLCY
    }, data.headerData);
  }

  calculateAmountForVATProdPostingGroup(data: EventDataModel) {
    const sourceLine = data.activeData || {};
    const lineId = sourceLine?.Id;

    if (!lineId) {
      return;
    }

    const query = `(${lineId})`;
    const ifMatchKey = '*';

    const patchData = {
      VATProdPostingGroup: data.data,
      DirectUnitCost: sourceLine?.DirectUnitCost,
      LineDiscountAmount: sourceLine?.LineDiscountAmount
    };

    this.restService
      .patch(this.config?.addItemConfig?.lineConfig?.api + query, patchData, ifMatchKey)
      .subscribe((response: any) => {
        this.formDataService.updateLineControlData$.next({
          control: 'VATProdPostingGroup',
          data: response?.VATProdPostingGroup ?? data.data,
          rowIndex: data.rowIndex,
          eventEmit: false
        });

        this.formDataService.updateLineControlData$.next({
          control: 'vat',
          data: this.toInvoiceNumber(response?.vat),
          rowIndex: data.rowIndex,
          eventEmit: false
        });

        this.formDataService.updateLineControlData$.next({
          control: 'LineAmount',
          data: this.toInvoiceNumber(response?.LineAmount).toFixed(2),
          rowIndex: data.rowIndex,
          eventEmit: false
        });

        this.formDataService.updateLineControlData$.next({
          control: 'AmountLCY',
          data: this.toInvoiceNumber(response?.AmountLCY).toFixed(2),
          rowIndex: data.rowIndex,
          eventEmit: false
        });

        this.recalculateInvoiceSummary(
          data.linesData,
          data.rowIndex,
          {
            ...sourceLine,
            ...response,
            VATProdPostingGroup: response?.VATProdPostingGroup ?? data.data,
            vat: this.toInvoiceNumber(response?.vat),
            LineAmount: this.toInvoiceNumber(response?.LineAmount),
            amountIncludingVAT: this.toInvoiceNumber(response?.amountIncludingVAT),
            AmountLCY: this.toInvoiceNumber(response?.AmountLCY)
          },
          data.headerData
        );
      });
  }
  validateHeaderData(header: any) {
    if (header.Remark) {
      return true;
    }
    this.toastr.warning('Remark must have a value');
    return false;
  }

  validateVendorInvoiceNo(buttonData: CustomButtonEvent) {
    this.restService.get(`/postedPurchInvHeaders?$filter=VendorInvoiceNo eq '${buttonData.headerData.VendorInvoiceNumber}'`).subscribe((response: any) => {
      if (response.value && response.value.length > 0) {
        this.toastr.warning(`Vendor Invoice No ${buttonData.headerData.VendorInvoiceNumber} already exists.`);
      } else {
        // if (buttonData.headerData.ShortcutDimension1Code && buttonData.headerData.ShortcutDimension2Code) {
        this.addItemService.showLoader$.next(true);
        this.updateUserId(buttonData, true);
        // } else {
        // this.toastr.warning('Please choose a value for Project and Department dimensions!');
        // }
      }
    });

  }

  async buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'SendApprovalRequest') {
      if (buttonData.data.Status === 'Open') {
        if (buttonData.headerData.VendorInvoiceNumber) {
          if (this.validateHeaderData(buttonData.headerData)) {
            this.validateVendorInvoiceNo(buttonData);
          }
        }
        else {
          this.toastr.warning('Must have Vendor Invoice Number');
        }
      }
      else {
        this.toastr.warning('The PR Status should be Open');
      }
    } else if (buttonData.button.label === 'CancelApprovalRequest') {
      if (buttonData.data.Status === 'Pending Approval') {
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
    // else if (buttonData.button.label === 'Post') {
    //   // if (buttonData.data.Status === 'Released') {

    //   this.addItemService.showLoader$.next(true);

    //   const dimensionSetId = buttonData.data.dimensionSetID;
    //   const dimensionUrl =
    //     `/dimensionSetEntries?$filter=dimensionSetID eq ${dimensionSetId}`;

    //   this.restService.get(dimensionUrl).subscribe((dimRes: any) => {

    //     const count = dimRes?.value?.length || 0;

    //     if (count === 0) {
    //       this.addItemService.showLoader$.next(false);
    //       this.toastr.warning('No dimension set');
    //       return; 
    //     }


    //     const urlInvUserId: string =
    //       '(' + buttonData.data.Id + ')/Microsoft.NAV.getPostInvUserId';

    //     this.addItemService.showLoader$.next(true);

    //     const ifMatchKey = "*"; 
    //     const query = '(' + buttonData.data.Id + ')';
    //     let patchData = { "RefNo": buttonData.data.RefNo + 1 };

    //     this.restService.patch(
    //       this.config.addItemConfig!.headerConfig!.api + query,
    //       patchData,
    //       ifMatchKey
    //     ).subscribe((response: any) => {

    //       const payload = {
    //         userid2: this.sessionService.UserId,
    //         docNo: buttonData.data.Number,
    //         resCentre: this.sessionService.DefaultResponsibilityCenter,
    //         comp: this.sessionService.CompanyName,
    //         compId: this.sessionService.Company,
    //       };

    //       this.restService.post(
    //         this.config.headerApi + urlInvUserId,
    //         payload
    //       ).subscribe((response: any) => {

    //         const url: string =
    //           '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.postAsInvoice';

    //         this.restService.post(
    //           this.config.headerApi + url,
    //           {}
    //         ).subscribe((response: any) => {
    //           this.addItemService.showLoader$.next(false);
    //           this.toastr.success('Successfull Purchase Invoice!');
    //         }, error => {
    //           this.addItemService.showLoader$.next(false);
    //           this.toastr.error('Failed to Post Purchase Invoice!');
    //         });

    //       }, error => {
    //         this.toastr.error('Failed to Post Purchase Order!');
    //         this.addItemService.showLoader$.next(false);
    //       });

    //     }, error => {
    //       this.addItemService.showLoader$.next(false);
    //     });

    //   }, error => {
    //     this.addItemService.showLoader$.next(false);
    //     this.toastr.error('Failed to validate dimension set');
    //   });

    //   ///
    //   // } else {
    //   //   this.toastr.warning('The PR should be approved before you should Post it');
    //   // }
    // }


    else if (buttonData.button.label === 'Post') {
      // if (buttonData.data.Status === 'Released') {
      this.addItemService.showLoader$.next(true);
      ///
      const urlInvUserId: string = '(' + buttonData.data.Id + ')/Microsoft.NAV.getPostInvUserId';
      this.addItemService.showLoader$.next(true);
      const ifMatchKey = "*"; // record["@odata.etag"];
      const query = '(' + buttonData.data.Id + ')';
      let patchData = { "RefNo": buttonData.data.RefNo + 1 }
      this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        const payload = {
          userid2: this.sessionService.UserId,
          docNo: buttonData.data.Number,
          resCentre: this.sessionService.DefaultResponsibilityCenter,
          comp: this.sessionService.CompanyName,
          compId: this.sessionService.Company,
        };
        this.restService.post(this.config.headerApi + urlInvUserId, payload).subscribe((response: any) => {
          const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.postAsInvoice';
          this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
            this.addItemService.showLoader$.next(false);
            this.toastr.success('Successful Posted Purchase Invoice!');
          }, error => {
            this.addItemService.showLoader$.next(false);
            this.toastr.error('Failed to Post Purchase Invoice!');
          });
        }, error => {
          this.toastr.error('Failed to Post Purchase Order!');
          this.addItemService.showLoader$.next(false);
        });

      }, error => {
        this.addItemService.showLoader$.next(false);
      });


      ///
      // } else {
      //   this.toastr.warning('The PR should be approved before you should Post it');
      // }
    }
    // else if (buttonData.button.label === 'PortalSendApprovalRequest') {
    //   if (buttonData.data.Status === 'Open') {
    //     if (buttonData.data.workflowDocCount > 0) {
    //       if (buttonData.headerData.VendorInvoiceNumber) {
    //         if (this.validateHeaderData(buttonData.headerData)) {
    //           this.validateVendorInvoiceNo(buttonData);
    //         }
    //       }
    //       else {
    //         this.toastr.warning('Must have Vendor Invoice Number');
    //       }
    //     } else {
    //       this.toastr.warning('Please upload document attachment before sending for approval.');
    //       return;
    //     }
    //   }
    //   else {
    //     this.toastr.warning('The PR Status should be Open');
    //   }
    // }


    else if (buttonData.button.label === 'PortalSendApprovalRequest') {
      // if (!this.hasApprovalPermission(buttonData)) {
      //   return;
      // }
      if (buttonData.data.Status === 'Open') {

        this.restService.get(this.config.headerApi + '(' + buttonData.data[this.config.idProp!] + ')').subscribe((latestDoc: any) => {
          buttonData.data = latestDoc;

          if (buttonData.data.workflowDocCount > 0) {

            const dimensionSetId = buttonData.data.dimensionSetID;
            const dimensionUrl =
              `/dimensionSetEntries?$filter=dimensionSetID eq ${dimensionSetId}`;

            this.restService.get(dimensionUrl).subscribe(async (dimRes: any) => {

              const count = dimRes?.value?.length || 0;

              if (count === 0) {
                this.toastr.warning('No dimension set');
                return;
              }

              if (buttonData.headerData.VendorInvoiceNumber) {
                if (this.validateHeaderData(buttonData.headerData)) {
                  const confirmed = await this.dialogService.confirm({
                    message: 'Are you sure you want to send approval request?',
                    yesButtonText: 'Yes',
                    noButtonText: 'No'
                  });

                  if (!confirmed) {
                    return;
                  }

                  this.validateVendorInvoiceNo(buttonData);
                }
              } else {
                this.toastr.warning('Must have Vendor Invoice Number');
              }

            }, () => {
              this.toastr.error('Failed to validate dimension set');
            });

          } else {
            this.toastr.warning('Please upload attachment before sending for approval.');
            return;
          }

        }, () => {
          this.toastr.error('Failed to refresh document data');
        });

      } else {
        this.toastr.warning('The PR Status should be Open');
      }
    }
    else if (buttonData.button.label === 'PortalCancelApprovalRequest') {
      // if (!this.hasApprovalPermission(buttonData)) {
      //   return;
      // }
      if (buttonData.data.Status === 'Pending Approval') {
        const confirmed = await this.dialogService.confirm({
          message: 'Are you sure you want to cancel approval request?',
          yesButtonText: 'Yes',
          noButtonText: 'No'
        });

        if (!confirmed) {
          return;
        }
        this.updateUserId(buttonData, false);
        // this.addItemService.showLoader$.next(true);
        // const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForApprovalID';
        // let payload = {
        //   docNo: buttonData.data.Number,
        // }
        // this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
        //   if (response.value == this.sessionService.UserId) {
        //     this.updateUserId(buttonData, false);
        //   }
        //   else {
        //     this.toastr.error('You do not have permission to cancel the document. Only Sender can Cancel the Document.');
        //     this.addItemService.showLoader$.next(false);
        //   }
        // }, error => {
        //   this.addItemService.showLoader$.next(false);
        // });
      }
    } else if (buttonData.button.label === 'redistributeAccountAllocations') {
      this.redistributeAccountAllocations(buttonData);
    } else if (buttonData.button.label === 'prePayment') {
      this.prePayment(buttonData);
    }
    else if (buttonData.button.label === 'generateFromAllocationLine') {
      this.generateFromAllocationLine(buttonData);
    }
    else if (buttonData.button.label === 'approverAttachment') {
      this.openApproverAttachmentPopup(buttonData);
    } else if (buttonData.button.label === 'Approved') {
      this.Approved(this.approvalEntriesResponse)
    } else if (buttonData.button.label === 'ApprovalReject') {
      this.ApprovalReject(this.approvalEntriesResponse)
    } else if (buttonData.button.label == 'openReq') {
      this.universalPopupService.open("purchaseRequisition");
    }
  }

  updateUserId(buttonData: CustomButtonEvent, approve: boolean,) {
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
        // this.sendApprovalRequest(buttonData);
        this.checkGLLinesBudget(buttonData);
      }
      else if (!approve) {
        this.cancelApprovalRequest(buttonData);
      }
      else {
        this.addItemService.showLoader$.next(false);
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Invoice'";
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
      let receivers: string[] = [];
      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }

      let approvalId: string = response.value[0].ApproverID;
      if (documentAction == 'CancelApprovalRequest') {////new cancel logic
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
      this.emailNotifyService.sendNotification(senders, receivers, 'Invoice', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId);
      this.addItemService.showLoader$.next(false);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  checkGLLinesBudget(buttonData: CustomButtonEvent) {
    if (buttonData.headerData && buttonData.headerData.BudgetName) {
      const gAccountsRecords = buttonData.lineData!.filter(x => x.Type === 'G/L Account').map(x => x.No);
      const gAccounts = [...new Set(gAccountsRecords)];
      if (gAccounts.length > 0) {
        // const requisitionDate = this.utility.convertDateObjToString({
        //   year: buttonData.headerData.RequisitionDate.year,
        //   month: buttonData.headerData.RequisitionDate.month,
        //   day: 1
        // }, true);
        const url: string = `/glbudgetentries?$filter=BudgetName eq '${buttonData.headerData.BudgetName}'`;
        this.restService.get(url).subscribe((res: any) => {
          if (res.value.length > 0) {
            const resultedGAccounts = res.value.filter((x: any) => gAccounts.includes(x.glaccno));
            const glRecords = <string[]>resultedGAccounts.map((x: any) => x.glaccno);
            const resultedGAccountNos = [...new Set(glRecords)];
            if (resultedGAccountNos.length !== gAccounts.length) {
              this.addItemService.showLoader$.next(false);
              this.toastr.warning('Some of the GL Accounts Budget details are not found');
            } else {
              let overBudgetAccounts: string[] = [];
              for (let i = 0; i < gAccounts.length; i++) {
                const currentBudgetTotal = buttonData.lineData!.filter(x => x.Type === 'G/L Account' && x.No === gAccounts[i]).map(x => +x.LineAmount).reduce((a, b) => a + b, 0);
                const gAccount = resultedGAccounts.filter((x: any) => x.glaccno === gAccounts[i])[0];
                if (gAccount) {
                  if (gAccount.ConsumedBudget + currentBudgetTotal > gAccount.TotalBudget) {
                    overBudgetAccounts.push(gAccounts[i]);
                  }
                }
              }

              if (overBudgetAccounts.length === 0) {
                this.sendApprovalRequest(buttonData);
              } else {
                this.addItemService.showLoader$.next(false);
                this.toastr.warning(`The G/L accounts ${overBudgetAccounts.join(',')} exceeded the budgets`);
              }
            }
          } else {
            this.addItemService.showLoader$.next(false);
            this.toastr.warning('No Budget details found for the given GL Accounts / Purchase Requisition Date');
          }
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      } else {
        this.sendApprovalRequest(buttonData);
      }
    } else {
      // this.addItemService.showLoader$.next(false);
      // this.toastr.warning('Please select the Budget Name');
      this.sendApprovalRequest(buttonData);//TSA arka_10_1_2023

    }
  }
  sendApprovalRequestOld(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendPurchaseInvoiceApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval', eventEmit: true });
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      this.updatePendingApprovalID(buttonData.data);

    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.portalSendPIForApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      // this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval' });
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      this.updatePendingApprovalID(buttonData.data);
      this.addItemService.reloadHeaderById$.next(buttonData.headerData.Id);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }


  updatePendingApprovalID(data: any) {
    ////////12-10-21

    let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.Number + "'"
    this.restService.get(url).subscribe((response: any) => {
      this.addItemService.showLoader$.next(false);
      if (response) {
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + data.Id + ')';
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId };
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        this.restService.patch("/purchaseInvoiceHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }

  cancelApprovalRequestOld(buttonData: CustomButtonEvent) {
    if (buttonData.data.Status === 'Pending Approval') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelPurchaseInvoiceApproval';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Sent Cancel Request!');
        this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
        this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    if (buttonData.data.Status === 'Pending Approval') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.portalCancelPIApproval';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Sent Cancel Request!');
        // this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open' });
        //  this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
        this.addItemService.reloadHeaderById$.next(buttonData.headerData.Id);
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }


  async redistributeAccountAllocations(buttonData: any) {
    try {
      const line = await this.getLatestSelectedLine(buttonData);

      if (!line) {
        this.toastr.warning('No valid line selected.');
        return;
      }

      if (line.hasPrepayment == true) {
        this.dialogService.alert('custom', {
          title: 'Warning',
          text: 'This line has already been prepayment, so a allocation cannot be created.'
        });
        return;
      }

      if (line.generatedByAllocation) {
        this.toastr.warning('This line was generated by allocation and cannot be allocated again.');
        return;
      }

      if (!line.No) {
        this.toastr.warning(`Line ${line.LineNo} has no No.`);
        return;
      }

      if (!line.LineAmount && !line.amountIncludingVAT) {
        this.toastr.warning(`Line ${line.LineNo} has no Amount.`);
        return;
      }

      const popup = this.universalPopupService.openModulePopup('changeAllocation', {
        headerData: {
          originalAmountToAllocations: line.amountIncludingVAT || line.LineAmount,
          postingDate: buttonData?.headerData?.PostingDate,
          purchaseLineId: line.Id
        },
        lineApiOverrideConfig: {
          api: `/purchaseInvoiceLines(${line.Id})/purchInvAllocations`,
          defaultLines: 2,
          isDirectApi: true,
          idProp: 'systemId',
          headerPKProp: 'purchaseLineId',
          lineFKProp: 'purchaseLineId'
        },
        onLoaded: (data: any) => { this.changeAllocations.popupLoaded(data); },
        onChangeEvent: (data: any) => { this.changeAllocations.changeEvent(data); },
        onButtonClick: (data: any) => { this.changeAllocations.buttonClickEvent(data); },
        suspendAutoSave: true,
        validateOnClose: () => this.changeAllocations.validateClose()
      });

      if (popup) {
        popup.hidden.subscribe(() => {
          // Only refresh parent lines if something actually changed inside the allocation popup
          if (this.changeAllocations.hadChanges) {
            this.addItemService.popupRefreshLineData$.next(true);
          }
          this.selectedItemService.popupUncheckedLineData$.next(true);
        });
      }

    } catch (err) {
      console.error(err);
      this.toastr.error('Unexpected error occurred.');
    }
  }

  async prePayment(buttonData: any) {
    try {
      const line = await this.getLatestSelectedLine(buttonData);

      if (!line) {
        this.toastr.warning('No valid line selected.');
        return;
      }

      if (line.hasAllocation == true) {
        this.dialogService.alert('custom', {
          title: 'Warning',
          text: 'This line has already been allocated, so a prepayment cannot be created.'
        });
        return;
      }

      const lineId = line.Id || line.id;
      const baseAmount = Number(line.amountIncludingVAT || 0);

      const popup = this.universalPopupService.openModulePopup('PrePayment', {
        suspendAutoSave: true,
        headerData: {
          purchaseLineId: lineId,
          originalAmountToPrepayment: baseAmount,
          documentNo: buttonData.headerData?.Number,
          sourceLineNo: line.LineNo ?? line.lineNo ?? null,
          sourceLine: line,
        },
        lineApiOverrideConfig: {
          api: `/purchaseInvoiceLines(${lineId})/portalInvPrePayments`,
          defaultLines: 0,
          isDirectApi: true,
          idProp: 'systemId',
          headerPKProp: 'purchaseLineId',
          lineFKProp: 'purchaseLineId'
        },
        onLoaded: (data: any) => this.prePaymentDelegate.popupLoaded(data),
        onChangeEvent: (data: any) => this.prePaymentDelegate.changeEvent(data),
        onButtonClick: (data: any) => this.prePaymentDelegate.buttonClickEvent(data),
      });

      if (popup) {
        popup.hidden.subscribe(() => {
          if (this.prePaymentDelegate.hadChanges) {
            this.addItemService.popupRefreshLineData$.next(true);
          }
          this.selectedItemService.popupUncheckedLineData$.next(true);
        });
      }

    } catch (err) {
      console.error(err);
      this.toastr.error('Unexpected error occurred.');
    }
  }

  async generateFromAllocationLine(buttonData: any) {

    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );

    if (!selectedIndexes?.length) {
      this.toastr.warning('Please select line(s) first.');
      return;
    }

    const selectedLines = selectedIndexes
      .map((i: number) => buttonData.lineData[i])
      .filter(l => !!l);

    if (!selectedLines.length) {
      this.toastr.warning('No valid lines selected.');
      return;
    }

    try {
      if (selectedLines.length === 1) {
        const line = selectedLines[0];

        if (line.Type !== 'Allocation Account') {
          this.toastr.warning(`Line ${line.LineNo} is not an Allocation Account.`);
          return;
        }

        if (!line.No) {
          this.toastr.warning(`Line ${line.LineNo} has no No.`);
          return;
        }

        if (!line.LineAmount) {
          this.toastr.warning(`Line ${line.LineNo} has no Amount.`);
          return;
        }

        const api = `${this.config.addItemConfig!.lineConfig!.api}(${line.Id})/allocationAccLines`;

        const allocationAccLinesRes: any = await firstValueFrom(
          this.restService.get(api).pipe(take(1))
        );

        const accLines = allocationAccLinesRes?.value || [];

        if (accLines.length === 0) {
          this.toastr.warning(`No allocation distribution found!`);
          return;
        }

        const url = `${this.config.addItemConfig!.lineConfig!.api}(${line.Id})/Microsoft.NAV.generateFromAllocationLine`;

        try {
          await firstValueFrom(this.restService.post(url, {}));
          this.toastr.success('Generate From Allocation process completed.');
        } catch (err) {
          console.error(err);
          this.toastr.error(`Failed to process line ${line.LineNo}.`);
        }

      } else {
        this.toastr.warning("Please select one line!");
        return;
      }

    } catch (err) {
      console.error(err);
      this.toastr.error('Unexpected error during Generate From Allocation process.');
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }

  openApproverAttachmentPopup(buttonData: CustomButtonEvent) {

    const modalRef = this.modal.open(AttachmentsComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.documentNo = buttonData.headerData.Number;
    modalRef.componentInstance.documentType = this.config.addItemConfig!.informationSectionConfig!.documentType;
    modalRef.componentInstance.recordLineNo = 0;
    modalRef.componentInstance.readonly = false;
    modalRef.componentInstance.isWorkflowAttachment = true;
    modalRef.componentInstance.documentApi = `/purchaseInvoiceHeaders(${buttonData.headerData.Id})`;
    modalRef.result.finally(() => {
      // Optional: Refresh table or popup line
      // this.addItemService.popupRefreshLineData$.next(true);
    });
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
      console.error(`Error approving item`, err);
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
      this.toastr.error("Rejection Reason is required.");
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
      console.error("Error rejecting item", err);
      this.toastr.error("Failed to reject item.");
    } finally {
      this.addItemService.refreshData$.next(true);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
      this.addItemService.closePopup$.next(true);
    }
  }



  leaveEvent(data: FormDataModel) {
    if (data.section !== SectionType.Line || data.rowIndex === undefined || data.rowIndex === null) {
      return;
    }

    const control = data.control ?? '';
    const rowIndex = data.rowIndex;
    const activeLine = Array.isArray(data.linesData) ? data.linesData[rowIndex] : data.activeData;

    if (!activeLine) {
      return;
    }

    this.recalculateInvoiceSummary(data.linesData, rowIndex, activeLine, data.headerData);

    if (['No', 'DirectUnitCost', 'LineDiscountAmount', 'VATProdPostingGroup'].includes(control)) {
      const patchData: any = {};

      if (control === 'No') {
        patchData.No = activeLine.No;
        patchData.Description = activeLine.Description;
        patchData.GLAccountName = activeLine.GLAccountName;
        patchData.UnitOfMeasure = activeLine.UnitOfMeasure;
        patchData.LocationCode = activeLine.LocationCode;
      }

      if (control === 'DirectUnitCost' || control === 'LineDiscountAmount' || control === 'VATProdPostingGroup') {
        if (control === 'DirectUnitCost' && this.cachedApiLines[rowIndex]?.hasAllocation === true) {
          this.dialogService.alert('custom', {
            title: 'Warning',
            text: 'This line has account allocations. Reset the allocations before changing the unit cost.'
          });
          const original = this.cachedApiLines[rowIndex];
          const revertData = {
            DirectUnitCost: original.DirectUnitCost,
            LineDiscountAmount: original.LineDiscountAmount,
            VATProdPostingGroup: original.VATProdPostingGroup
          };
          // Immediately snap the form field back (UI only) so no further blur re-triggers this dialog.
          this.addItemService.patchLineFormOnly$.next({ rowIndex, data: revertData });
          // Also queue the API revert to fire after the current in-flight PATCH completes.
          this.addItemService.revertLine(rowIndex, revertData);
          return;
        }

        patchData.DirectUnitCost = activeLine.DirectUnitCost;
        patchData.LineDiscountAmount = activeLine.LineDiscountAmount;
        patchData.VATProdPostingGroup = activeLine.VATProdPostingGroup;
      }

      this.addItemService.patchLineData$.next({
        rowIndex,
        data: patchData,
        disableControls: false
      });
    }
  }


  async confirmCurrencyChange(data: EventDataModel) {
    this.addItemService.showLoader$.next(true);
    const confirmed = await this.openCurrencyConfirm();
    if (!confirmed) {
      this.formDataService.updateControlData$.next({
        control: 'currencyCode',
        data: this.previousCurrencyCode,
      });
      this.addItemService.suspendHeaderAutoSave$.next(false);
      this.addItemService.showLoader$.next(false);
      return;
    }

    this.addItemService.suspendHeaderAutoSave$.next(false);
    this.addItemService.forceLeaveHeaderControl$.next({
      control: 'currencyCode',
      value: data.data
    });
    this.previousCurrencyCode = data.data;
    this.addItemService.headerSaveResponse$
      .pipe(take(1))
      .subscribe((res) => {
        this.addItemService.reloadHeaderById$.next(res.Id);
        this.addItemService.popupRefreshLineData$.next(true);
        this.addItemService.showLoader$.next(false);
      });
  }

  openCurrencyConfirm(): Promise<boolean> {
    return this.dialogService.confirm({
      message: 'If you change Currency Code, the existing purchase lines will be deleted and new purchase lines based on the new information in the header will be created. Do you want to continue?',
      yesButtonText: 'Yes',
      noButtonText: 'No',
      showAsNotification: false
    });
  }

  private async getLatestSelectedLine(buttonData: any): Promise<any | null> {
    const index = await firstValueFrom(
      this.selectedRowIndexService.selectedRowIndex$.pipe(take(1))
    );

    if (index === null || index === undefined || index < 0) {
      this.toastr.warning('Please select one line first.');
      return null;
    }

    const selectedLine = buttonData?.lineData?.[index];

    if (!selectedLine?.Id && !selectedLine?.id) {
      this.toastr.warning('No valid line selected.');
      return null;
    }

    const lineId = selectedLine.Id || selectedLine.id;
    const lineApi = this.config.addItemConfig!.lineConfig!.api;

    const latestLine = await firstValueFrom(
      this.restService.get(`${lineApi}(${lineId})`).pipe(take(1))
    );

    return latestLine || null;
  }


}
