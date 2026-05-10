import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { DocumentAttchmentTypesComponent } from './document-attchment-types/document-attchment-types.component';
import { DocumentAttchmentComponent } from './document-attachment/document-attachment.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'types',
        pathMatch: 'full'
      },
      {
        path: 'types',
        component: DocumentAttchmentTypesComponent
      },
      {
        path: 'documents',
        component: DocumentAttchmentComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttachmentsRoutingModule { }
