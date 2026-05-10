import { Component } from '@angular/core';

import { SubmitedClaimJournalHeader, SubmitedClaimJournalLine } from './submited-clam-journal.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-submitted-claim-journal',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class SubmittedClaimJournalComponent {

  config: DataTableConfig = {
    title: ' Submitted Claim Journal',
    idProp: 'Id',
    headerApi: '/claimEntriesHeaders',
    pageName: 'SUBMITTED CLAIM JOURNAL',
    showCreate: false,
    showDelete: false,
    showEdit: false,
    // headerApiOrderByField: 'DocumentNo',
    filters: [
      {
        field: 'Status',
        operator: 'eq',
        value: "'Submitted'"
      }
    ],
    // headers: [
    //     {
    //         name: 'Batch Name',
    //         prop: 'BatchName'
    //     },
    //     {
    //         name: 'Document Type',
    //         prop: 'DocumentType'
    //     },
    //     {
    //         name: 'Dimension Claim',
    //         prop: 'DimensionClaim'
    //     },
    //     {
    //         name: 'Document No',
    //         prop: 'DocumentNo'
    //     },
    //     {
    //         name: 'Account Type',
    //         prop: 'AccountType'
    //     },
    //     {
    //         name: 'Description',
    //         prop: 'Description'
    //     },
    //     {
    //         name: 'Status',
    //         prop: 'Status'
    //     }
    // ],
    headers: [{
      name: 'Document No',
      prop: 'DocumentNo',
      isPrimaryLink: true
    },
    {
      name: 'Document Type',
      prop: 'DocumentType'
    },
    {
      name: 'Posting Date',
      prop: 'PostingDate'
    },
    {
      name: 'Total Amount',
      prop: 'TotalAmount'
    },
    {
      name: 'Status',
      prop: 'Status'
    },
    {
      name: 'Remark',
      prop: 'Remark',
    }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Submitted Claim Journal',
      recordId: "DocumentNo",
      recordTitle: "DocumentType",
      headerConfig: SubmitedClaimJournalHeader,
      lineConfig: SubmitedClaimJournalLine,
      informationSectionConfig: {
        documentNoProp: 'DocumentNo',
        documentType: 'Petty Cash',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.JournalClaim
      }
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Petty Claim Journal',
      name: 'Petty Claim Journal',
      icon: 'bi bi-arrow-90deg-right',
      route: '/journal/claim',
    },
    {
      label: 'Submitted Petty Claim Journal',
      name: 'Submitted Petty Claim Journal',
      icon: 'bi bi-arrow-90deg-right',
      route: '/journal/submitted-claim',
      isEnable: false
    },
  ];

}
