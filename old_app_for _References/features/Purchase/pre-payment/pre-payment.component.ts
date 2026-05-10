import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { RedistributePrePaymentHeader, RedistributePrePaymentLine } from './pre-payment.config';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { RestService } from '../../../core/services/rest.service';
import { ToastrService } from 'ngx-toastr';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';

@Component({
  standalone: false,
  selector: 'app-pre-payment',
  template: `<app-data-table [config]="config" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>`
})
export class PrepaymentComponent {

  hadChanges: boolean = false;

  private popupRef: any;
  private lineId: any = null;
  private baseAmount: number = 0;
  private sourceLine: any = null;
  private documentNo: string = '';
  private currentPercentage: number = 0;
  private currentAmount: number = 0;

  config: DataTableConfig = {
    addItemConfig: {
      title: 'Prepayment',
      recordId: 'systemId',
      hasNoHeaderApi: true,
      isDirectApi: true,
      headerConfig: RedistributePrePaymentHeader,
      lineConfig: RedistributePrePaymentLine,
      getPopupCloseResponse: false
    }
  };

  constructor(
    private formDataService: FormDataService,
    private restService: RestService,
    private toastr: ToastrService,
    private dialogService: UnifiedDialogService,
    private addItemService: AddItemService,
  ) { }

  async popupLoaded(data: any): Promise<void> {
    const newInstance = data._instance ?? data.popupRef;
    const isNewPopup = newInstance !== this.popupRef; // new open vs getLineData() refresh
    if (isNewPopup) {
      this.hadChanges = false;
      this.currentPercentage = 0;
      this.currentAmount = 0;
    }
    this.popupRef = newInstance;
    this.lineId = data.header?.purchaseLineId;
    this.baseAmount = Number(data.header?.originalAmountToPrepayment ?? 0);
    this.documentNo = data.header?.documentNo ?? '';
    this.sourceLine = data.header?.sourceLine ?? null;

    const sourceLineNo = data.header?.sourceLineNo ?? null;
    if (!this.documentNo || sourceLineNo === null || sourceLineNo === undefined) return;

    try {
      this.addItemService.showLoader$.next(true);
      const url =
        `/portalInvPrePayments?$filter=documentNo eq '${this.documentNo}' and ` +
        `documentType eq 'Invoice' and sourceLineNo eq ${sourceLineNo}`;
      const res: any = await firstValueFrom(this.restService.get(url));
      const existing = res?.value?.[0];
      if (existing) {
        this.currentPercentage = existing.percentage ?? 0;
        this.currentAmount = existing.amount ?? 0;
        setTimeout(() => {
          this.formDataService.updateControlData$.next({ control: 'percentage', data: existing.percentage ?? 0 });
          this.formDataService.updateControlData$.next({ control: 'amount', data: existing.amount ?? 0 });
        }, 100);
        this.popupRef.lineData = res.value;
        this.popupRef.generateItemsFormArray(res.value);
        this.popupRef.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load existing prepayment', err);
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }

  changeEvent(data: EventDataModel): void {
    if (data.section === SectionType.Header) {
      if (data.control === 'percentage') {
        const pct = Number((data as any).data || 0);
        const amount = Number(((this.baseAmount * pct) / 100).toFixed(2));
        this.currentPercentage = pct;
        this.currentAmount = amount;
        this.formDataService.updateControlData$.next({ control: 'amount', data: amount });
      } else if (data.control === 'amount') {
        const amt = Number((data as any).data || 0);
        const pct = this.baseAmount > 0 ? Number(((amt / this.baseAmount) * 100).toFixed(2)) : 0;
        this.currentAmount = amt;
        this.currentPercentage = pct;
        this.formDataService.updateControlData$.next({ control: 'percentage', data: pct });
      }
    }
  }

  buttonClickEvent(buttonData: CustomButtonEvent): void {
    if (buttonData.button.label === 'applyPrepayment') {
      this.applyPrepayment(buttonData);
    } else if (buttonData.button.label === 'deletePrepayment') {
      this.deletePrepayment();
    }
  }

  private async applyPrepayment(buttonData: CustomButtonEvent): Promise<void> {
    const percentage = this.currentPercentage;
    const amount = this.currentAmount;

    if (percentage <= 0 && amount <= 0) {
      this.toastr.warning('Please enter a valid percentage or amount.');
      return;
    }

    try {
      this.addItemService.showLoader$.next(true);

      const existingRes: any = await firstValueFrom(
        this.restService.get(`/purchaseInvoiceLines(${this.lineId})/portalInvPrePayments`)
      );
      const existing = existingRes?.value?.[0];
      if (existing?.systemId) {
        await firstValueFrom(this.restService.delete(`/portalInvPrePayments(${existing.systemId})`));
      }

      const payload = {
        percentage,
        amount,
        genBusPostingGroup: this.sourceLine?.genBusPostingGroup,
        genProdPostingGroup: this.sourceLine?.genProdPostingGroup,
      };
      await firstValueFrom(
        this.restService.post(`/purchaseInvoiceLines(${this.lineId})/portalInvPrePayments`, payload)
      );

      this.hadChanges = true;
      this.toastr.success('Prepayment applied successfully.');

      const previewRes: any = await firstValueFrom(
        this.restService.get(`/purchaseInvoiceLines(${this.lineId})/portalInvPrePayments`)
      );
      const previewLines = previewRes?.value || [];
      this.popupRef.lineData = previewLines;
      this.popupRef.generateItemsFormArray(previewLines);
      this.popupRef.cdr.detectChanges();
    } catch (err) {
      console.error(err);
      this.toastr.error('Failed to apply prepayment.');
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }

  private async deletePrepayment(): Promise<void> {
    const ok = await this.dialogService.confirmDelete();
    if (!ok) return;

    try {
      this.addItemService.showLoader$.next(true);

      const existingRes: any = await firstValueFrom(
        this.restService.get(`/purchaseInvoiceLines(${this.lineId})/portalInvPrePayments`)
      );
      const existing = existingRes?.value?.[0];
      if (existing?.systemId) {
        await firstValueFrom(this.restService.delete(`/portalInvPrePayments(${existing.systemId})`));
        this.hadChanges = true;
        this.toastr.success('Prepayment deleted.');
      } else {
        this.toastr.info('No prepayment to delete.');
      }

      this.formDataService.updateControlData$.next({ control: 'percentage', data: 0 });
      this.formDataService.updateControlData$.next({ control: 'amount', data: 0 });
      this.popupRef.lineData = [];
      this.popupRef.generateItemsFormArray([]);
      this.popupRef.cdr.detectChanges();
    } catch (err) {
      console.error(err);
      this.toastr.error('Failed to delete prepayment.');
    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }

}