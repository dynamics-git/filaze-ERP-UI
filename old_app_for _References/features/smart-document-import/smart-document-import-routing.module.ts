import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SmartImportDraftWorkspaceComponent } from './smart-import-draft-workspace.component';
import { SmartImportDraftsListComponent } from './smart-import-drafts-list.component';
import { SmartDocumentImportComponent } from './smart-document-import.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'import',
    pathMatch: 'full'
  },
  {
    path: 'import',
    component: SmartDocumentImportComponent,
  },
  {
    path: 'drafts',
    component: SmartImportDraftsListComponent,
  },
  {
    path: 'drafts/:systemId',
    component: SmartImportDraftWorkspaceComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SmartDocumentImportRoutingModule { }
