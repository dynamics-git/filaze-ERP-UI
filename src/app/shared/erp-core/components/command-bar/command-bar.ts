import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommandConfig, StandardCommandConfig } from '../../models/command-config.model';

@Component({
  selector: 'erp-command-bar',
  standalone: true,
  templateUrl: './command-bar.html',
  styleUrl: './command-bar.scss'
})
export class CommandBarComponent {
  @Input() standardActions: StandardCommandConfig = {
    new: true,
    delete: true,
    refresh: true
  };
  @Input() commands: CommandConfig[] = [];
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  get visibleCommands(): CommandConfig[] {
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

  runCommand(item: CommandConfig): void {
    if (item.disabled) {
      return;
    }

    this.command.emit({ actionKey: item.actionKey });
  }
}
