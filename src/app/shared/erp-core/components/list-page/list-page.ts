import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpCommandConfig, ErpStandardCommandConfig } from '../../models/command-config.model';
import { ErpPageConfig, ErpPageToolsConfig, ErpPageViewConfig } from '../../models/page-config.model';
import { ErpCommandBarComponent } from '../command-bar/command-bar';
import { ErpDataSurfaceComponent } from '../data-surface/data-surface';
import { ErpFactboxHostComponent } from '../factbox-host/factbox-host';

export type ErpListPageConfig = ErpPageConfig & {
  standardActions?: ErpStandardCommandConfig;
};

@Component({
  selector: 'erp-list-page',
  standalone: true,
  imports: [ErpCommandBarComponent, ErpDataSurfaceComponent, ErpFactboxHostComponent],
  templateUrl: './list-page.html',
  styleUrl: './list-page.scss'
})
export class ErpListPageComponent {
  @Input() config?: ErpListPageConfig;
  @Input() data: unknown[] = [];
  @Input() selectedRecord?: unknown;
  @Output() rowSelected = new EventEmitter<unknown>();
  @Output() primaryAction = new EventEmitter<unknown>();
  @Output() selectionChanged = new EventEmitter<unknown>();
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  get commands(): ErpCommandConfig[] {
    return this.config?.commands ?? [];
  }

  get standardActions(): ErpStandardCommandConfig {
    return this.config?.standardActions ?? {
      new: true,
      delete: true,
      refresh: true
    };
  }

  get views(): ErpPageViewConfig[] {
    return this.config?.views ?? [];
  }

  get tools(): ErpPageToolsConfig {
    return this.config?.tools ?? {};
  }

  get hasTools(): boolean {
    return this.tools.filter === true || this.tools.export === true || this.tools.columns === true;
  }

  get selectedCount(): number {
    return this.selectedRecord ? 1 : 0;
  }

  get searchPlaceholder(): string {
    const title = this.config?.title?.toLowerCase() ?? 'records';
    return `Search ${title}...`;
  }

  isActiveView(view: ErpPageViewConfig): boolean {
    return view.id === (this.config?.activeViewId ?? this.views[0]?.id);
  }

  selectRow(row: unknown): void {
    this.selectionChanged.emit(row);
    this.rowSelected.emit(row);
  }

  openPrimary(row: unknown): void {
    this.primaryAction.emit(row);
  }

  selectView(view: ErpPageViewConfig): void {
    if (view.disabled) {
      return;
    }

    this.command.emit({ actionKey: 'viewChanged', payload: view });
  }

  runTool(actionKey: 'filter' | 'export' | 'columns'): void {
    this.command.emit({ actionKey });
  }

  emitCommand(event: { actionKey: string; payload?: unknown }): void {
    this.command.emit(event);
  }
}
