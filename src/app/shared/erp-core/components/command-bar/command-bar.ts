import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpCommandConfig, ErpStandardCommandConfig } from '../../models/command-config.model';

@Component({
  selector: 'erp-command-bar',
  standalone: true,
  templateUrl: './command-bar.html',
  styleUrl: './command-bar.scss'
})
export class ErpCommandBarComponent {
  @Input() standardActions: ErpStandardCommandConfig = {
    new: true,
    delete: true,
    refresh: true
  };
  @Input() commands: ErpCommandConfig[] = [];
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  get visibleCommands(): ErpCommandConfig[] {
    return this.commands.filter((item) => !item.hidden);
  }

  get hasStandardActions(): boolean {
    return this.standardActions.new !== false ||
      this.standardActions.delete !== false ||
      this.standardActions.refresh !== false;
  }

  runStandardAction(actionKey: 'new' | 'delete' | 'refresh'): void {
    this.command.emit({ actionKey });
  }

  runCommand(item: ErpCommandConfig): void {
    if (item.disabled || item.type === 'divider') {
      return;
    }

    this.command.emit({ actionKey: item.actionKey ?? item.id });
  }
}
