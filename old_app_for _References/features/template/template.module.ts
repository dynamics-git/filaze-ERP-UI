import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TemplateRoutingModule } from './template-routing.module';
import { TemplateAddItemPopupComponent } from './template-add-item-popup/template-add-item-popup.component';
import { TemplateDataTableComponent } from './template-data-table/template-data-table.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmailTemplateComponent } from './email-template/email-template.component';


@NgModule({
  declarations: [
    TemplateAddItemPopupComponent,
    TemplateDataTableComponent,
    EmailTemplateComponent
  ],
  imports: [
    CommonModule,
    TemplateRoutingModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    NgxSkeletonLoaderModule
  ]
})
export class TemplateModule { }
