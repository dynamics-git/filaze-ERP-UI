import { AsyncPipe, NgStyle } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ErpPopupConfig } from '../../models/popup-config.model';
import { PopupStackService } from '../../services/popup-stack.service';

type ErpPopupHostAction = {
  label: string;
  actionKey: string;
};

type ErpPopupHostData = {
  body?: string;
  actions?: ErpPopupHostAction[];
};

@Component({
  selector: 'erp-popup-host',
  standalone: true,
  imports: [AsyncPipe, NgStyle],
  templateUrl: './popup-host.html',
  styleUrl: './popup-host.scss'
})
export class ErpPopupHostComponent {
  private readonly popupStack = inject(PopupStackService);

  @Output() popupAction = new EventEmitter<{ actionKey: string; popup: ErpPopupConfig }>();

  readonly stack$ = this.popupStack.stack$;

  close(id?: string): void {
    this.popupStack.close(id);
  }

  closeTop(): void {
    this.popupStack.closeTop();
  }

  closeAll(): void {
    this.popupStack.closeAll();
  }

  getPopupBody(popup: ErpPopupConfig): string {
    return this.getPopupData(popup).body ?? '';
  }

  getPopupActions(popup: ErpPopupConfig): ErpPopupHostAction[] {
    return this.getPopupData(popup).actions ?? [];
  }

  getPopupStyle(index: number): Record<string, string | number> {
    return {
      'z-index': 1000 + index * 10,
      transform: `translate(${index * 18}px, ${index * 14}px)`
    };
  }

  emitPopupAction(actionKey: string, popup: ErpPopupConfig): void {
    this.popupAction.emit({ actionKey, popup });
  }

  private getPopupData(popup: ErpPopupConfig): ErpPopupHostData {
    if (!this.isRecord(popup.data)) {
      return {};
    }

    return popup.data as ErpPopupHostData;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
