import { Injectable } from '@angular/core';
import { MenuItem } from '../models/menu-item.model';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly items: MenuItem[] = [
    {
      id: 'finance',
      label: 'Finance',
      module: 'Finance',
      icon: 'bi bi-cash-stack'
    },
    {
      id: 'sales',
      label: 'Sales',
      module: 'Sales',
      icon: 'bi bi-cart'
    },
    {
      id: 'purchase',
      label: 'Purchase',
      module: 'Purchase',
      icon: 'bi bi-bag',
      children: [
        {
          id: 'purchase-requisition',
          label: 'Purchase Requisition',
          module: 'Purchase',
          route: '/purchase/requisition',
          icon: 'bi bi-file-earmark-text',
          group: 'Requisitions',
          permissionKey: 'PR'
        },
        {
          id: 'bid-waiver',
          label: 'Bid Waiver',
          module: 'Purchase',
          route: '/purchase/PRBidWaiver',
          icon: 'bi bi-file-earmark-check',
          group: 'Requisitions',
          permissionKey: 'PRBidWaiver'
        },
        {
          id: 'vendor-selection',
          label: 'Vendor Selection',
          module: 'Purchase',
          route: '/purchase/PR-Vender-Selection',
          icon: 'bi bi-shop',
          group: 'Requisitions',
          permissionKey: 'PR-VS'
        },
        {
          id: 'approved-requisitions',
          label: 'Approved Requisitions',
          module: 'Purchase',
          route: '/purchase/approved-pr',
          icon: 'bi bi-check2-square',
          group: 'Requisitions',
          permissionKey: 'APR'
        },
        {
          id: 'purchase-quote',
          label: 'Purchase Quote',
          module: 'Purchase',
          route: '/purchase/quote',
          icon: 'bi bi-chat-square-quote',
          group: 'Purchase',
          permissionKey: 'PQ'
        },
        {
          id: 'purchase-order',
          label: 'Purchase Order',
          module: 'Purchase',
          route: '/purchase/order',
          icon: 'bi bi-cart-check',
          group: 'Purchase',
          permissionKey: 'PO'
        },
        {
          id: 'purchase-invoice',
          label: 'Purchase Invoice',
          module: 'Purchase',
          route: '/purchase-invoice',
          icon: 'bi bi-receipt',
          group: 'Purchase',
          permissionKey: 'PI'
        },
        {
          id: 'purchase-credit-memo',
          label: 'Purchase Credit Memo',
          module: 'Purchase',
          route: '/purchase/purchase-Credit-Memo',
          icon: 'bi bi-receipt-cutoff',
          group: 'Purchase',
          permissionKey: 'PCM'
        },
        {
          id: 'goods-received-note',
          label: 'Goods Received Note',
          module: 'Purchase',
          route: '/purchase/receipt',
          icon: 'bi bi-box-arrow-in-down',
          group: 'Procurement History',
          permissionKey: 'POSTED PURCHASE RECEIPT'
        },
        {
          id: 'posted-purchase-invoices',
          label: 'Posted Purchase Invoices',
          module: 'Purchase',
          route: '/purchase/postedinvoice',
          icon: 'bi bi-journal-check',
          group: 'Procurement History',
          permissionKey: 'POSTED PURCHASE INVOICE'
        }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      module: 'Inventory',
      icon: 'bi bi-box-seam'
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing',
      module: 'Manufacturing',
      icon: 'bi bi-gear-wide-connected'
    },
    {
      id: 'projects',
      label: 'Projects',
      module: 'Projects',
      icon: 'bi bi-kanban'
    },
    {
      id: 'hr',
      label: 'HR',
      module: 'HR',
      icon: 'bi bi-people'
    },
    {
      id: 'admin',
      label: 'Admin',
      module: 'Admin',
      icon: 'bi bi-sliders'
    }
  ];

  constructor(private readonly permissionService: PermissionService) {}

  getModules(): MenuItem[] {
    return this.items.map((item) => ({
      ...item,
      children: this.filterItems(item.children ?? [])
    }));
  }

  getModule(moduleKey: string): MenuItem | undefined {
    const normalizedKey = this.normalize(moduleKey);
    const item = this.items.find((menuItem) => this.normalize(menuItem.module) === normalizedKey || this.normalize(menuItem.id) === normalizedKey);

    if (!item) {
      return undefined;
    }

    return {
      ...item,
      children: this.filterItems(item.children ?? [])
    };
  }

  getModuleItems(moduleKey: string): MenuItem[] {
    return this.getModule(moduleKey)?.children ?? [];
  }

  private filterItems(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => this.permissionService.hasPermission(item.permissionKey))
      .map((item) => {
        const children = item.children ? this.filterItems(item.children) : undefined;

        return {
          ...item,
          children
        };
      });
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
