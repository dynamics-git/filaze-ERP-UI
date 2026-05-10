import { Component } from '@angular/core';
import { DocumentAttchmentTypeHeader } from './document-attachment-types.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-document-attchment-types',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class DocumentAttchmentTypesComponent {

  config: DataTableConfig = {
    title: 'Document Attachment Types',
    idProp: 'Id',
    headerApi: '/portalDocAttachmentTypes',
    pageName: 'DocumentAttachmentTypes',
    headerApiOrderByField: 'Code',
    filterByUserCompanyResCenter: true,
    headers: [
      {
        name: 'Code',
        prop: 'Code',
        isPrimaryLink: true
      },
      {
        name: 'Description',
        prop: 'Description'
      }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Document Attachment Type',
      recordId: "Code",
      recordTitle: "Code",
      headerConfig: DocumentAttchmentTypeHeader
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Document Attachment Types',
      name: 'Document Attachment Types',
      icon: 'bi bi-arrow-90deg-right',
      route: '/attachments/types',
      isEnable: false
    },
    {
      label: 'Document Attachment',
      name: 'Document Attachment',
      icon: 'bi bi-arrow-90deg-right',
      route: '/attachments/documents',
    },
  ];

}
