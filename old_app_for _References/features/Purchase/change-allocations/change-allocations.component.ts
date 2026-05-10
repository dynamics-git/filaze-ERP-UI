import { Component } from '@angular/core';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { ChangeAllocationLine } from './change-allocations.config';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { RestService } from '../../../core/services/rest.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';

@Component({
  standalone: false,
  selector: 'app-change-allocations',
  template: `
    <app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>`
})
export class ChangeAllocationsComponent {
  popupRef!: any;
  DimensionCode!: any;
  tableDataId: any;
  constructor(private formDataService: FormDataService,
    private restService: RestService,
    private toastr: ToastrService,
    private dialogService: UnifiedDialogService,
    private addItemService: AddItemService
  ) { }



  remainingAmount!: number;
  destinationValue!: any[];
  hadChanges: boolean = false;

  config: DataTableConfig = {

    addItemConfig: {
      title: 'Changes Allocations',
      recordId: "Number",
      hasNoHeaderApi: true,
      isDirectApi: true,
      lineConfig: ChangeAllocationLine,
      getPopupCloseResponse: true
    },
    removeUnicodeCharFields: ['Status']
  };



  async popupLoaded(data: any) {
    const newInstance = data._instance ?? data.popupRef;
    const isNewPopup = newInstance !== this.popupRef; // new open vs getLineData() refresh
    if (isNewPopup) {
      this.hadChanges = false;
    }
    this.tableDataId = data.header.purchaseLineId;
    this.popupRef = newInstance;
    const original = Number(data.header.originalAmountToAllocations ?? 0);
    let totalLineAmount = 0;

    data.line.forEach((element: any) => {
      totalLineAmount += Number(element.amount ?? 0);
    });

    // Use server's computed remainingAmount if returned, else calculate manually
    const serverRemaining = data.line.length > 0 && data.line[0].remainingAmount !== undefined
      ? Number(data.line[0].remainingAmount)
      : null;
    const remaining = serverRemaining !== null ? serverRemaining : original - totalLineAmount;
    this.remainingAmount = remaining;
    data.header.remainingAmountToAllocations = remaining;

    setTimeout(() => {
      this.formDataService.updateControlData$.next({
        control: 'remainingAmountToAllocations',
        data: remaining
      });
      this.updateTotalHeadcount(data.line);
      this.applyInitialHeadcountFieldState(data.line);
      this.toggleHeadcountOnLoad(data);
    }, 50);

    const firstLineValue = data.line?.[0]?.allocationCode;
    if (firstLineValue) {
      data.header.allocationAccountSetup = firstLineValue;

      setTimeout(() => {
        this.formDataService.updateControlData$.next({
          control: 'allocationAccountSetup',
          data: firstLineValue
        });
      }, 50);
    }

    const glSetupRes: any = await firstValueFrom(
      this.restService.get('/glSetups')
    );
    const glSetup = glSetupRes?.value?.[0];
    this.DimensionCode = glSetup?.shortcutDimension1Code;

    // Use live itemConfig from openModulePopup when available, fallback to own config
    const liveLineControls = (data._itemConfig ?? this.config?.addItemConfig)?.lineConfig?.controls;

    const ctrl = liveLineControls?.find((c: any) => c.label === 'shortcutDimension1Value');
    if (ctrl) {
      ctrl.apiUrl = `/dimensionsValues?$filter=DimensionCode eq '${this.DimensionCode}'`;
    }

    const destinationValue = liveLineControls?.find((c: any) => c.label === 'shortcutDimension1Value');
    if (destinationValue) {
      destinationValue.name = this.DimensionCode ? `${this.DimensionCode}` : 'Destination Value';
    }
  }


  changeEvent(data: EventDataModel) {
    this.hadChanges = true;
    if (data.section === SectionType.Header) {
      if (data.control === 'allocationAccountSetup') {
        data.headerData.allocationAccountSetup = data.data;
        this.toggleHeadcountByAllocationSetup(data);
        this.calculateAmountAfterHeadcountReset(data);
      }
    }

    if (data.section === SectionType.Line) {
      switch (data.control) {
        case 'amount':
          this.changeAmount(data);
          this.calculatePercentage(data);
          break;

        case 'percentage':
          this.calculateAmountFromPercentage(data);
          break;
        case 'headcount':
          this.calculateAmountFromHeadcount(data);
          this.toggleAmountPercentageByHeadcount(data);
          break;
      }
    }
  }

  calculatePercentage(data: any) {
    const original = Number(data.headerData.originalAmountToAllocations ?? 0);
    if (!original) return;
    const rowIndex = data.rowIndex;
    const amount = Number(data.data);
    const percentage = (amount / original) * 100;
    setTimeout(() => {
      this.formDataService.updateLineControlData$.next({
        control: 'percentage',
        data: Number(percentage.toFixed(2)),
        rowIndex
      });
    }, 100)
  }


  calculateAmountFromPercentage(data: any) {
    const original = Number(data.headerData.originalAmountToAllocations ?? 0);
    if (!original) return;
    const rowIndex = data.rowIndex;
    const percentage = Number(data.data);
    const finalAmount = Number(((percentage / 100) * original).toFixed(2));
    this.formDataService.updateLineControlData$.next({
      control: 'amount',
      data: finalAmount,
      rowIndex
    });
    data.linesData[rowIndex].amount = finalAmount;
    let totalLineAmount = 0;
    data.linesData.forEach((element: any) => {
      totalLineAmount += Number(element.amount ?? 0);
    });
    const remaining = original - totalLineAmount;
    data.headerData.remainingAmountToAllocations = remaining;
    this.remainingAmount = remaining;
    this.formDataService.updateControlData$.next({
      control: 'remainingAmountToAllocations',
      data: remaining
    });
  }




  changeAmount(data: any) {
    const original = Number(data.headerData.originalAmountToAllocations ?? 0);
    let totalLineAmount = 0;
    data.linesData.forEach((element: any) => {
      totalLineAmount += Number(element.amount ?? 0);
    });
    const remaining = original - totalLineAmount;
    data.headerData.remainingAmountToAllocations = remaining;
    this.remainingAmount = remaining;
    setTimeout(() => {
      this.formDataService.updateControlData$.next({
        control: 'remainingAmountToAllocations',
        data: remaining
      });
    }, 50);
  }



  async validateClose(): Promise<boolean> {
    const hasItem = await this.checkItemInPILine();
    if (!hasItem) return true;

    if (this.remainingAmount === 0) return true;

    (document.activeElement as HTMLElement)?.blur();

    const confirmed = await this.dialogService.confirm({
      message:
        `You have incomplete allocation.\n` +
        `Remaining Amount not 0.\n` +
        `Do you want to clear all allocations and close the page?`,
      yesButtonText: 'Yes',
      noButtonText: 'No',
      showAsNotification: false,
      modalOptions: {
        windowClass: 'modal-dialog-confirm',
        backdrop: 'static',
        keyboard: false
      }
    });

    if (confirmed) {
      await this.deleteAllRecord();
    }

    return confirmed;
  }

  async deleteAllRecord() {
    try {
      this.addItemService.showLoader$.next(true);

      const listRes: any = await firstValueFrom(
        this.restService.get(
          `/purchaseInvoiceLines(${this.tableDataId})/purchInvAllocations`
        )
      );
      const linesData = listRes?.value || [];
      if (!linesData.length) {
        return;
      }
      const firstLine = linesData[0];
      const systemId = firstLine?.systemId;
      if (!systemId) {
        return;
      }
      const api = `/purchInvAllocations(${systemId})/Microsoft.NAV.resetAllocations`;

      await firstValueFrom(this.restService.post(api, {}));
      this.hadChanges = true;

    } catch (err) {
      console.error(err);
      this.toastr.error("Failed to delete all allocations.");
    }

    this.addItemService.showLoader$.next(false);
  }


  checkItemInPILine(): Promise<boolean> {
    return new Promise(resolve => {
      this.restService
        .get(`/purchaseInvoiceLines(${this.tableDataId})/purchInvAllocations`)
        .subscribe((res: any) => {
          const data = res?.value || [];
          const hasData = data.length > 0;
          resolve(hasData);
        });
    });
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'calHeadcount') {
      const allocationAccountSetup = buttonData.headerData?.allocationAccountSetup;
      if (!allocationAccountSetup) {
        this.toastr.warning('Please select Allocation Account Setup');
        return;
      }
      this.addItemService.showLoader$.next(true);
      const url = `(${this.tableDataId})/Microsoft.NAV.CalculateHeadcount`;
      this.restService.post('/purchaseInvoiceLines' + url, { allocationCode: allocationAccountSetup })
        .subscribe({
          next: () => {
            this.hadChanges = true;
            this.toastr.success('Headcount calculated successfully');
            // getLineData() without skipPopupLoaded — re-triggers popupLoaded with fresh
            // server data (including updated amounts and remainingAmount)
            this.popupRef?.getLineData?.();
            this.addItemService.showLoader$.next(false);
          },
          error: () => {
            this.addItemService.showLoader$.next(false);
          }
        });
    }
  }

  updateTotalHeadcount(lines: any[]) {
    let totalHeadcount = 0;

    (lines || []).forEach((line: any) => {
      totalHeadcount += Number(line.headcount ?? 0);
    });

    this.formDataService.updateControlData$.next({
      control: 'totalHeadcount',
      data: totalHeadcount
    });
  }

  calculateAmountFromHeadcount(data: any) {
    const originalAmount = Number(data.headerData.originalAmountToAllocations ?? 0);
    if (!originalAmount) return;

    const lines = data.linesData || [];
    const rowIndex = data.rowIndex;

    let totalHeadcount = 0;
    lines.forEach((line: any) => {
      totalHeadcount += Number(line.headcount ?? 0);
    });

    this.formDataService.updateControlData$.next({
      control: 'totalHeadcount',
      data: totalHeadcount
    });

    if (!totalHeadcount || totalHeadcount <= 0) {
      lines.forEach((_: any, index: number) => {
        this.formDataService.updateLineControlData$.next({
          control: 'amount',
          data: 0,
          rowIndex: index
        });

        this.formDataService.updateLineControlData$.next({
          control: 'percentage',
          data: 0,
          rowIndex: index
        });

        lines[index].amount = 0;
        lines[index].percentage = 0;
      });

      this.formDataService.updateControlData$.next({
        control: 'remainingAmountToAllocations',
        data: originalAmount
      });

      this.remainingAmount = originalAmount;
      return;
    }

    let totalAllocatedAmount = 0;

    lines.forEach((line: any, index: number) => {
      const headcount = Number(line.headcount ?? 0);
      const amount = Number(((headcount / totalHeadcount) * originalAmount).toFixed(2));
      const percentage = Number(((amount / originalAmount) * 100).toFixed(2));

      this.formDataService.updateLineControlData$.next({
        control: 'amount',
        data: amount,
        rowIndex: index
      });

      this.formDataService.updateLineControlData$.next({
        control: 'percentage',
        data: percentage,
        rowIndex: index
      });

      lines[index].amount = amount;
      lines[index].percentage = percentage;

      totalAllocatedAmount += amount;
    });

    const remaining = Number((originalAmount - totalAllocatedAmount).toFixed(2));
    this.remainingAmount = remaining;
    data.headerData.remainingAmountToAllocations = remaining;

    this.formDataService.updateControlData$.next({
      control: 'remainingAmountToAllocations',
      data: remaining
    });
  }


  toggleAmountPercentageByHeadcount(data: any) {
    const lines = data.linesData || [];

    lines.forEach((line: any, index: number) => {
      const hasHeadcount = Number(line.headcount ?? 0) > 0;

      if (hasHeadcount) {
        this.formDataService.disableLineControl$.next({
          label: 'amount',
          rowIndex: index
        });

        this.formDataService.disableLineControl$.next({
          label: 'percentage',
          rowIndex: index
        });
      } else {
        this.formDataService.enableLineControl$.next({
          label: 'amount',
          rowIndex: index
        });

        this.formDataService.enableLineControl$.next({
          label: 'percentage',
          rowIndex: index
        });
      }
    });
  }

  applyInitialHeadcountFieldState(lines: any[]) {
    (lines || []).forEach((line: any, index: number) => {
      const hasHeadcount = Number(line.headcount ?? 0) > 0;

      if (hasHeadcount) {
        this.formDataService.disableLineControl$.next({
          label: 'amount',
          rowIndex: index
        });

        this.formDataService.disableLineControl$.next({
          label: 'percentage',
          rowIndex: index
        });
      } else {
        this.formDataService.enableLineControl$.next({
          label: 'amount',
          rowIndex: index
        });

        this.formDataService.enableLineControl$.next({
          label: 'percentage',
          rowIndex: index
        });
      }
    });
  }

  toggleHeadcountByAllocationSetup(data: any) {
    const lines = data.linesData || [];
    const selectedAllocationSetup = data.headerData?.allocationAccountSetup;

    lines.forEach((line: any, index: number) => {
      const lineAllocationValue = line.allocationCode;

      if (selectedAllocationSetup && lineAllocationValue === selectedAllocationSetup) {
        this.formDataService.enableLineControl$.next({
          label: 'headcount',
          rowIndex: index
        });
      } else {
        this.formDataService.disableLineControl$.next({
          label: 'headcount',
          rowIndex: index,
          clearValue: true
        });

        this.formDataService.updateLineControlData$.next({
          control: 'headcount',
          data: 0,
          rowIndex: index
        });

        lines[index].headcount = 0;
      }
    });
  }

  calculateAmountAfterHeadcountReset(data: any) {
    const originalAmount = Number(data.headerData.originalAmountToAllocations ?? 0);
    const lines = data.linesData || [];

    let totalHeadcount = 0;
    lines.forEach((line: any) => {
      totalHeadcount += Number(line.headcount ?? 0);
    });

    this.formDataService.updateControlData$.next({
      control: 'totalHeadcount',
      data: totalHeadcount
    });

    let totalLineAmount = 0;
    lines.forEach((line: any) => {
      totalLineAmount += Number(line.amount ?? 0);
    });

    const remaining = Number((originalAmount - totalLineAmount).toFixed(2));
    this.remainingAmount = remaining;
    data.headerData.remainingAmountToAllocations = remaining;

    this.formDataService.updateControlData$.next({
      control: 'remainingAmountToAllocations',
      data: remaining
    });
  }

  toggleHeadcountOnLoad(data: any) {
    const lines = data.line || [];
    const selectedAllocationSetup = data.header?.allocationAccountSetup;

    lines.forEach((line: any, index: number) => {
      const lineAllocationValue = line.allocationCode;

      if (selectedAllocationSetup && lineAllocationValue === selectedAllocationSetup) {
        this.formDataService.enableLineControl$.next({
          label: 'headcount',
          rowIndex: index
        });
      } else {
        this.formDataService.disableLineControl$.next({
          label: 'headcount',
          rowIndex: index
        });
      }
    });
  }

}

