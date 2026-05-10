import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentAttchmentTypesComponent } from './document-attchment-types/document-attchment-types.component';
import { AttachmentsRoutingModule } from './attachments.routing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DocumentAttchmentComponent } from './document-attachment/document-attachment.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    DocumentAttchmentTypesComponent,
    DocumentAttchmentComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    AttachmentsRoutingModule
  ]
})
export class AttachmentsModule { }
