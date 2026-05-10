import { Component, OnInit } from '@angular/core';

import { ArchivedPurchaseOrderHeader, ArchivedPurchaseOrderLine, ArchivedPurchaseOrderCalculation } from '../archived-purchase-order/archived-purchase-order.config';
import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine, ArchivedPurchaseQuoteCalculation } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { PostedPurchaseInvoiceHeader, PostedPurchaseInvoiceLine, PostedPurchaseInvoiceLineCalculation } from './posted-purchase-invoice.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { InvoicePdfService } from '../../../core/services/shared/invoice-pdf.service';
import { RestService } from '../../../core/services/rest.service';

@Component({
  standalone: false,
  selector: 'app-posted-purchase-invoice',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" [MenuButtons]="MenuButtons"  (buttonClickEvent)="buttonClickEvent($event)" ></app-data-table>'
})
export class PostedPurchaseInvoiceComponent {
  totalAmount!: number;

  constructor(
    private addItemService: AddItemService,
    private formDataService: FormDataService,
    private invoicePdf: InvoicePdfService,
    private restService: RestService
  ) {
  }

  config: DataTableConfig = {
    title: 'Posted Purchase Invoice',
    idProp: 'Id',
    headerApi: '/postedPurchInvHeaders',
    pageName: 'POSTED PURCHASE INVOICE',
    showCreate: false,
    headerApiOrderByField: 'No',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    showEdit: false,
    headers: [
      {
        name: 'No',
        prop: 'No',
        isPrimaryLink: true
      },
       {
        name: 'Pre Assigned No',
        prop: 'PreAssignedNo',
      },
      // {
      //   name: 'Requisition No',
      //   prop: 'RequisitionNo',
      //   isPrimaryLink: true,
      //   linkItemConfigs: [
      //     {
      //       itemProp: 'Number',
      //       itemConfig: {
      //         title: 'Purchase Requisition',
      //         recordId: "Number",
      //         recordTitle: "Number",
      //         headerConfig: PurchaseRequisitionHeader,
      //         lineConfig: PurchaseRequisitionLine,
      //         calculationSectionConfig: PurchaseRequisitionCalculation,
      //         informationSectionConfig: {
      //           documentNoProp: 'Number',
      //           documentType: 'Requisition',
      //           documentStatusProp: 'ApprovalStatus',
      //           informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
      //         }
      //       }
      //     }
      //   ]
      // },
      // {
      //   name: 'Quote No',
      //   prop: 'QuoteNo',
      //   isPrimaryLink: true,
      //   linkItemConfigs: [
      //     {
      //       itemProp: 'Number',
      //       itemConfig: {
      //         title: 'Archived Purchase Quote',
      //         recordId: "Number",
      //         recordTitle: "Number",
      //         headerConfig: ArchivedPurchaseQuoteHeader,
      //         lineConfig: ArchivedPurchaseQuoteLine,
      //         // calculationSectionConfig: ArchivedPurchaseQuoteCalculation,
      //         informationSectionConfig: {
      //           documentNoProp: 'Number',
      //           documentType: 'Quote',
      //           documentStatusProp: 'Status',
      //           informationDetailSecctionType: InformationDetailSecctionType.ArchivedPurchaseQuote
      //         }
      //       }
      //     }
      //   ]
      // },
      // {
      //   name: 'Order No',
      //   prop: 'OrderNo',
      //   isPrimaryLink: true,
      //   linkItemConfigs: [
      //     {
      //       itemProp: 'Number',
      //       itemConfig: {
      //         title: 'Archived Purchase Order',
      //         recordId: "Number",
      //         recordTitle: "Number",
      //         headerConfig: ArchivedPurchaseOrderHeader,
      //         lineConfig: ArchivedPurchaseOrderLine,
      //         calculationSectionConfig: ArchivedPurchaseOrderCalculation,
      //         informationSectionConfig: {
      //           documentNoProp: 'Number',
      //           documentType: 'Order',
      //           documentStatusProp: 'Status',
      //           informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrder
      //         }
      //       }
      //     }
      //   ]
      // },
      {
        name: 'Vendor No',
        prop: 'BuyFromVendorNo'
      },
      {
        name: 'Vendor Name',
        prop: 'BuyFromVendorName'
      },
      // {
      //     name: 'Location Code',
      //     prop: 'LocationCode'
      // },
      {
        name: 'Document Date',
        prop: 'DocumentDate'
      },
      // {
      //   name: 'Prepayment Order No',
      //   prop: 'PrepaymentOrderNo'
      // },
      {
        name: 'Remark',
        prop: 'Remark',
      }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Posted Purchase Invoice',
      recordId: "No",
      recordTitle: "BuyFromVendorName",
      headerConfig: PostedPurchaseInvoiceHeader,
      lineConfig: PostedPurchaseInvoiceLine,
      calculationSectionConfig: PostedPurchaseInvoiceLineCalculation,
      informationSectionConfig: {
        documentNoProp: 'PreAssignedNo',
        documentType: 'Invoice',
        documentStatusProp: 'Status',
        allowAttachmentUpload: false,
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseInvoice
      }
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Purchase Order Cancelled',
      name: 'Purchase Order Cancelled',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/order-cancelled',
    },
    {
      label: 'Archived Purchase Order',
      name: 'Archived Purchase Order',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-order',
    },
    {
      label: 'Posted Purchase Invoice',
      name: 'Posted Purchase Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/postedinvoice',
      isEnable: false
    },
    {
      label: 'Posted Purchase Invoice',
      name: 'Posted Purchase Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/prepaymentpostedinvoice'
    },
    {
      label: 'Posted Purchase Credit Memo',
      name: 'Posted Purchase Credit Memo',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/postedpurchase-Credit-Memo'
    },
    {
      label: 'Archived Purchase Quote',
      name: 'Archived Purchase Quote',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-quote'
    },
  ];

  popupLoaded(data: any) {
    this.totalAmount = 0;
    console.log(data);
    const lineData = data.line;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
    this.addItemService.enableOrDisableAllControls$.next(false);

  }


  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'Invoice') {
      const header = buttonData.headerData;
      // const lines = buttonData.lineData ?? [];
      const lines = (buttonData.lineData ?? []).filter(l => l.No && l.No.trim() !== "");

      this.restService.get('/companyInfos').subscribe((companyRes: any) => {
        const companyInfo = companyRes.value?.[0] ?? {};

        this.restService
          .get(`/vendorsAPI?$filter=number eq '${header.PayToVendorNo}'`)
          .subscribe(async (vendorRes: any) => {

            const vendorRaw = vendorRes.value?.[0] ?? {};
            const vendor = this.mapVendorData(vendorRaw);  

            const shipTo = {
              Name: header.ShipToName,
              Address: header.ShipToAddress,
              Address2: header.ShipToAddress2,
              City: header.ShipToCity,
              PostCode: header.ShipToPostCode,
              Country: header.ShipToCounty
            };

            // 4. Remit-To (typically vendor)
            const remitTo = {
              Name: vendor.Name,
              Address: vendor.Address,
              Address2: vendor.Address2,
              City: vendor.City,
              PostCode: vendor.PostCode,
              Country: vendor.Country
            };

            // 5. VAT Summary
            const vatSummary = this.buildVatSummary(lines);

            // 6. Call New PDF Service
            await this.invoicePdf.InvoicePDF(
              header,
              vendor,
              companyInfo,
              lines,
              vatSummary,
              shipTo,
              //remitTo
            );
          });
      });
    }

  }


  private mapVendorData(vendor: any) {
    return {
      Name: vendor.displayName || vendor.name || '(No Vendor Name)',
      Address: vendor.address || '',
      Address2: vendor.address2 || '',
      City: vendor.city || '',
      PostCode: vendor.postCode || '',
      Country: vendor.countryRegionCode || '',
      Contact: vendor.Contact || '',
      Phone: vendor.phoneNumber || '',
      Email: vendor.email || ''
    };
  }



  private buildVatSummary(lines: any[]) {
    const vatMap: any = {};

    lines.forEach(line => {
      const vatId = line.VATIdentifier || line.VATId || "";
      const vatPct = line.VATPercent || line.VAT || 0;

      if (!vatMap[vatId]) {
        vatMap[vatId] = {
          VATIdentifier: vatId,
          VATPercent: vatPct,
          LineAmount: 0,
          InvDiscBaseAmount: 0,
          VATBase: 0,
          VATAmount: 0
        };
      }

      // BC Logic
      const lineAmount = Number(line.LineAmount ?? 0);
      const amount = Number(line.Amount ?? 0);
      const amountIncVat = Number(line.AmountIncludingVAT ?? 0);
      const invDiscAllowed = line.AllowInvoiceDisc ?? false;

      // Line Amount (before VAT)
      vatMap[vatId].LineAmount += lineAmount;

      // Invoice Discount Base Amount (only if Allow Invoice Disc = TRUE)
      if (invDiscAllowed) {
        vatMap[vatId].InvDiscBaseAmount += lineAmount;
      }

      // VAT Base (Amount without VAT)
      vatMap[vatId].VATBase += amount;

      // VAT Amount = Amount Including VAT – Amount
      vatMap[vatId].VATAmount += (amountIncVat - amount);
    });

    return Object.values(vatMap);
  }
}
