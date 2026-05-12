import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpFactPanelSectionConfig } from '../../models/entry-dialog-config.model';

@Component({
  selector: 'erp-fact-panel-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fact-panel-renderer.html',
  styleUrl: './fact-panel-renderer.scss'
})
export class ErpFactPanelRendererComponent {
  @Input() sections: ErpFactPanelSectionConfig[] = [];
  @Output() action = new EventEmitter<string>();

  runAction(actionKey: string): void {
    if (!actionKey) {
      return;
    }

    this.action.emit(actionKey);
  }
}
