import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { ErpDataSurfaceDemoComponent } from './shared/erp-core/demo/data-surface-demo/data-surface-demo';
import { ErpDocumentPageDemoComponent } from './shared/erp-core/demo/document-page-demo/document-page-demo';
import { ErpFactboxDemoComponent } from './shared/erp-core/demo/factbox-demo/factbox-demo';
import { ErpFormDemoComponent } from './shared/erp-core/demo/form-demo/form-demo';
import { ErpLineEditPopupDemoComponent } from './shared/erp-core/demo/line-edit-popup-demo/line-edit-popup-demo';
import { ErpPopupStackDemoComponent } from './shared/erp-core/demo/popup-stack-demo/popup-stack-demo';
import { ErpPurchaseInvoiceDemoComponent } from './shared/erp-core/demo/purchase-invoice-demo/purchase-invoice-demo';
import { ErpShellDemoComponent } from './shared/erp-core/demo/shell-demo/shell-demo';

export const routes: Routes = [
  {
    path: '_erp-data-surface-demo',
    component: ErpDataSurfaceDemoComponent
  },
  {
    path: '_erp-factbox-demo',
    component: ErpFactboxDemoComponent
  },
  {
    path: '_erp-shell-demo',
    component: ErpShellDemoComponent
  },
  {
    path: '_erp-popup-stack-demo',
    component: ErpPopupStackDemoComponent
  },
  {
    path: '_erp-document-page-demo',
    component: ErpDocumentPageDemoComponent
  },
  {
    path: '_erp-purchase-invoice-demo',
    component: ErpPurchaseInvoiceDemoComponent
  },
  {
    path: '_erp-form-demo',
    component: ErpFormDemoComponent
  },
  {
    path: '_erp-line-edit-popup-demo',
    component: ErpLineEditPopupDemoComponent
  },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: DashboardPage }
    ]
  }
];
