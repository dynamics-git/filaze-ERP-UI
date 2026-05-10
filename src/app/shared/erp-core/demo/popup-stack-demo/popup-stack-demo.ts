import { Component, inject } from '@angular/core';
import { ErpPopupHostComponent } from '../../components/popup-host/popup-host';
import { ErpPopupConfig } from '../../models/popup-config.model';
import { PopupStackService } from '../../services/popup-stack.service';

@Component({
  selector: 'erp-popup-stack-demo',
  standalone: true,
  imports: [ErpPopupHostComponent],
  templateUrl: './popup-stack-demo.html',
  styleUrl: './popup-stack-demo.scss'
})
export class ErpPopupStackDemoComponent {
  private readonly popupStack = inject(PopupStackService);

  openHeaderPopup(allowNested = false): void {
    this.popupStack.open({
      id: 'header-popup',
      title: 'Header Popup',
      size: 'md',
      mode: 'modal',
      allowNested,
      closeOnBackdrop: false,
      data: {
        body: 'Temporary header popup for validating nested ERP popup behavior.',
        actions: [
          {
            label: 'Open Line Popup',
            actionKey: 'openLine'
          }
        ]
      }
    });
  }

  openLinePopup(allowNested = false): void {
    this.popupStack.open({
      id: `line-popup-${Date.now()}`,
      title: 'Line Popup',
      size: 'md',
      mode: 'modal',
      allowNested,
      closeOnBackdrop: false,
      data: {
        body: 'Temporary line popup layered above the previous popup.',
        actions: [
          {
            label: 'Open Lookup Popup',
            actionKey: 'openLookup'
          }
        ]
      }
    });
  }

  openLookupPopup(allowNested = false): void {
    this.popupStack.open({
      id: `lookup-popup-${Date.now()}`,
      title: 'Lookup Popup',
      size: 'sm',
      mode: 'modal',
      allowNested,
      closeOnBackdrop: false,
      data: {
        body: 'Temporary lookup popup at the top of the stack.'
      }
    });
  }

  closeTop(): void {
    this.popupStack.closeTop();
  }

  closeAll(): void {
    this.popupStack.closeAll();
  }

  handlePopupAction(event: { actionKey: string; popup: ErpPopupConfig }): void {
    console.log('ERP popup stack demo action', event);

    if (event.actionKey === 'openLine') {
      this.openLinePopup(true);
    }

    if (event.actionKey === 'openLookup') {
      this.openLookupPopup(true);
    }
  }
}
