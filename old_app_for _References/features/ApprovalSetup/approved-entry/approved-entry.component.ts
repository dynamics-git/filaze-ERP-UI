import { Component, } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { SessionService } from '../../../core/services/session.service';
import { FilterField } from '../../../core/models/shared/filter.model';
import { ApprovedEntryHeader } from './approved-entry.config';

@Component({
  standalone: false,
  selector: 'app-approved-entry',
  template: '<app-data-table [config]="config" ></app-data-table>'
})
export class ApprovedEntryComponent {
  config: DataTableConfig = {
    title: 'Approval Entries',
    idProp: 'id',
    headerApi: '/approvalEntries',
    pageName: 'APPROVAL ENTRIES',
    showCreate: false,
    showDelete: false,
    filters: [
      {
        field: '(Status',
        operator: 'eq',
        value: "'Approved' or Status eq 'Rejected')"
      },
      {
        field: 'ApproverID',
        operator: 'eq',
        value: `'${this.sessionService.UserId}'`
      },
      {
        field: '(documentType',
        operator: 'eq',
        value: `'Invoice' or documentType eq 'Employee Claim')`
      },
    ],
    headers: [{ prop: 'entryNo', name: 'Entry No', isPrimaryLink: true },
    // { prop: 'documentNo', name: 'Document No.', isPrimaryLink: true },
    { prop: 'documentType', name: 'Document Type' },
    {
      name: 'Document No',
      prop: 'documentNo',
    },
    { prop: 'sequenceNo', name: 'Sequence No' },
    { prop: 'senderId', name: 'Sender ID' },
    { prop: 'approverId', name: 'Approve ID' },
    { prop: 'status', name: 'Status' },
    { prop: 'dateTimeSentForApproval', name: 'Send Date', isDate: true },
    { prop: 'lastDateTimeModified', name: 'Action Date', isDate: true },
    { prop: 'amount', name: 'Amount' },
    { prop: 'limitType', name: 'Limit Type' },
    { prop: 'delegateTo', name: 'Delegate' },
    { prop: 'submissionNo', name: 'Submission No' },
    { prop: 'actionComment', name: 'Comment' },
    ],
    addItemConfig: {
      title: 'Approval Entries',
      recordId: 'entryNo',
      recordTitle: 'documentType',
      headerConfig: ApprovedEntryHeader,
    },
    selctionType: 'single',
    removeUnicodeCharFields: ['DocumentType']
  };


  filterOptions: FilterField[] = [

    {
      field: 'documentType',
      label: 'Document Type',
      type: 'dropdown',
      options: [
        {
          value: 'Requisition',
          label: 'Purchase Requisition',
        },
        {
          value: 'Quote',
          label: 'Purchase Quote'
        },
        {
          value: 'Order',
          label: 'Purchase Order',
        },
        {
          value: 'Invoice',
          label: 'Invoice'
        },
        {
          value: 'Petty Cash',
          label: 'Petty Cash',
        },
        {
          value: 'Sales Invoice',
          label: 'Sales Invoice',
        },
        {
          value: 'Budget',
          label: 'Budget Request',
        },
        {
          value: 'BW Requisition',
          label: 'BW Requisition',
        },
        {
          value: 'Employee Claim',
          label: 'Employee Claim',
        },
        {
          value: 'Finance Claim',
          label: 'Finance Claim',
        },
        {
          value: 'Claim Payment',
          label: 'Claim Payment',
        },
      ],
    },
    {
      field: 'DocumentNo',
      label: 'Document No',
      type: 'text'
    },
    {
      field: 'status',
      label: 'Status',
      type: 'dropdown',
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
      ]
    },
    {
      field: 'senderId',
      label: 'Sender Id',
      type: 'text'
    },
    {
      field: 'approverId',
      label: 'Approver Id',
      type: 'text'
    },
    // {
    //   field: 'dateTimeSentForApproval',
    //   label: 'Send Date',
    //   type: 'date'
    // }
  ];

  constructor(private fb: FormBuilder,
    private sessionService: SessionService,
  ) {
  }

}


