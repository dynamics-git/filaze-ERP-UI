import { Component } from '@angular/core';
import { EmailTemplateHeader } from './email-template.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';

@Component({
  standalone: false,
  selector: 'app-email-template',
  template: '<app-template-data-table [config]="config" (popupLoaded)="popupLoaded($event)" ></app-template-data-table>'
})
export class EmailTemplateComponent {


  config: DataTableConfig = {
    title: 'Email Template',
    idProp: 'systemId',
    headerApi: '/customEmailTemplates',
    pageName: 'EmailTemplate',
    headerApiOrderByField: 'templateID',
    showCopy: false,
    headers: [{
      name: 'Template ID',
      prop: 'templateID',
      isPrimaryLink: true
    }, {
      name: 'Document Type',
      prop: 'documentType'
    }, {
      name: 'Template Target',
      prop: 'templateTarget'
    },
    {
      name: 'Action Type',
      prop: 'actionType'
    },
    {
      name: 'Active',
      prop: 'isActive'
    }],
    selctionType: 'single',
    addItemConfig: {
      title: 'Email Template',
      recordId: "templateID",
      recordTitle: "templateID",
      headerConfig: EmailTemplateHeader,
    },
    removeUnicodeCharFields: ['documentType']
  };




  popupLoaded(data: any) {
  }
}
