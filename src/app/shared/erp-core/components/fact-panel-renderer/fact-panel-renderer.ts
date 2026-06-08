import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FactPanelSectionConfig } from '../../models/entry-dialog-config.model';

@Component({
  selector: 'app-fact-panel-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fact-panel-renderer.html',
  styleUrl: './fact-panel-renderer.scss'
})
export class FactPanelRendererComponent {
  @Input() sections: FactPanelSectionConfig[] = [];
  @Output() action = new EventEmitter<string>();

  runAction(actionKey: string): void {
    if (!actionKey) {
      return;
    }

    this.action.emit(actionKey);
  }
}
