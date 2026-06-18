import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from '../../core/models/menu-item.model';
import { MenuService } from '../../core/services/menu.service';

type MenuGroupView = {
  label: string;
  items: MenuItem[];
};

@Component({
  selector: 'app-module-menu-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-menu-panel.html',
  styleUrl: './module-menu-panel.scss'
})
export class ModuleMenuPanel {
  @Input() moduleKey = '';
  @Output() navigate = new EventEmitter<MenuItem>();

  constructor(private readonly menuService: MenuService) {}

  get module(): MenuItem | undefined {
    return this.menuService.getModule(this.moduleKey);
  }

  get groups(): MenuGroupView[] {
    const groups = new Map<string, MenuItem[]>();

    this.menuService.getModuleItems(this.moduleKey).forEach((item) => {
      const group = item.group || 'General';
      groups.set(group, [...(groups.get(group) ?? []), item]);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items
    }));
  }

  onNavigate(item: MenuItem): void {
    if (!item.pageId?.trim()) {
      return;
    }

    this.navigate.emit(item);
  }
}
