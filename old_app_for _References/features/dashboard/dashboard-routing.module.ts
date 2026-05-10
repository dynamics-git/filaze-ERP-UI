import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'purchase',
    loadChildren: () => import('./../Purchase/purchase.module').then(m => m.PurchaseModule)
  },
  {
    path: 'sales',
    loadChildren: () => import('./../sales/sales.module').then(m => m.SalesModule)
  },
  {
    path: 'journal',
    loadChildren: () => import('./../Journal/journal.module').then(m => m.JournalModule)
  },
  {
    path: 'vendor',
    loadChildren: () => import('./../Vendor/vendor.module').then(m => m.VendorModule)
  },
  {
    path: 'approval',
    loadChildren: () => import('./../ApprovalSetup/approval-setup.module').then(m => m.ApprovalSetupModule)
  },
  {
    path: 'users',
    loadChildren: () => import('./../UserManagement/user-management.module').then(m => m.UserManagementModule)
  },
  {
    path: 'responsibility',
    loadChildren: () => import('./../ResponsibilityCenter/responsibility-center.module').then(m => m.ResponsibilityCenterModule)
  },
  {
    path: 'attachments',
    loadChildren: () => import('./../Attachments/attachments.module').then(m => m.AttachmentsModule)
  },
  {
    path: 'claim',
    loadChildren: () => import('./../claim/claim.module').then(m => m.ClaimModule)
  },
  {
    path: 'template',
    loadChildren: () => import('./../template/template.module').then(m => m.TemplateModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./../../../app/reports/reports.module').then(m => m.ReportsModule)
  },
  {
    path: 'tms',
    loadChildren: () => import('./../tms/tms.module').then(m => m.TmsModule)
  },
  {
    path: 'smart-document-import',
    loadChildren: () => import('./../smart-document-import/smart-document-import.module').then(m => m.SmartDocumentImportModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
