import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";


export const ClaimJournalHeader: HeaderDataConfig = {
  idProp: 'Id',
  api: '/claimEntriesHeaders',
  // title: 'Claim Journal',
  title: 'Purchase Journal',
  autoGenerateField: 'DocumentNo',
  buttons: [
    {
      label: 'SendApprovalRequest',
      name: 'Send Approval Request',
      icon: 'bi bi-envelope'
    },
    {
      label: 'CancelApprovalRequest',
      name: 'Cancel Approval Request',
      icon: 'bi bi-envelope'
    },
    {
      label: 'submit',
      name: 'Submit',
      icon: 'bi bi-save'
    },
  ],
  sections: [
    {
      title: 'Document Summary',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'DocumentNo',
            name: 'Document No',
            required: true,
            disabled: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'DocumentType',
            name: 'Document Type',
            required: true,
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'PostingDate',
            name: 'Posting Date',
            dateOnly: true,
            defaultSystemDate: true
          },
          {
            type: FormFieldType.Number,
            label: 'TotalAmount',
            name: 'Total Amount',
            decimal: true,
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'Status',
            name: 'Status',
            readonly: true,
            required: true
          },
          {
            type: FormFieldType.DropDown,
            label: 'BudgetName',
            name: 'Budget Name',
            apiUrl: '/glbudgetlists',
            displayFormat: '[BudgetName] - [description]',
            bindValue: 'BudgetName'
          },
          {
            type: FormFieldType.TextArea,
            label: 'RejectReason',
            name: 'Approvers Comments',
            readonly: true
          },
          {
            type: FormFieldType.TextArea,
            label: 'PendingApproversID',
            name: 'Pending Approvers ID',
            readonly: true
          },
          {
            type: FormFieldType.TextArea,
            label: 'Remark',
            name: 'Remark',
            isDescription: true,
            maxlength: 100,
            copyResetValue: ''
          }
        ]
      ]
    }
  ],
  removeUnicodeCharFields: ['Status']
};

ClaimJournalHeader.controls = (ClaimJournalHeader.sections ?? []).flatMap(section => section.controls);


export const ClaimJournalLine: LineDataConfig = {
  idProp: "Id",
  api: '/claimEntries',
  headerPKProp: 'DocumentNo',
  lineFKProp: 'DocumentNo',
  includeHeaderId: true,
  defaultLines: 1,
  controls: [
    {
      type: FormFieldType.TextBox,
      label: 'AccountType',
      name: 'Type',
      initialValue: 'G/L Account',
      readonly: true,
      required: true,
    },
    {
      type: FormFieldType.DropDown,
      label: "AccountNo",
      name: "Account No",
      apiUrl: '/glAccountClaimEntries',
      displayFormat: '[No] - [Name]',
      bindValue: 'No',
      required: true,
    },
    {
      type: FormFieldType.TextBox,
      label: "Description",
      name: "Description",
      isDescription: true,
      maxlength: 100
    },
    {
      type: FormFieldType.DropDown,
      label: 'ShortcutDimension1Code',
      name: 'PROJECT',
      apiUrl: "/dimensionsValues?$filter=DimensionCode eq 'PROJECT' and DimensionValueType eq 'Standard'",
      bindValue: 'Code',
      displayFormat: '[Code] - [Name]'
    },
    {
      type: FormFieldType.DropDown,
      label: 'ShortcutDimension2Code',
      name: 'DEPARTMENT/COST CNTR',
      apiUrl: "/dimensionsValues?$filter=DimensionCode eq 'DEPARTMENT/COST CNTR' and DimensionValueType eq 'Standard'",
      bindValue: 'Code',
      displayFormat: '[Code] - [Name]'
    },
    {
      type: FormFieldType.DateTime,
      label: 'PostingDate',
      name: 'Posting Date',
      dateOnly: true,
      defaultSystemDate: true,
    },
    {
      type: FormFieldType.TextBox,
      label: "RefNo",
      name: "Ref No"
    },
    {
      type: FormFieldType.Number,
      label: "Amount",
      name: "Amount",
      decimal: true,
      // required: true,
      // autoSave: false,
    },
    {
      type: FormFieldType.DateTime,
      label: "DocumentDate",
      name: "Document Date",
      dateOnly: true,
      defaultSystemDate: true,
    }
  ]
};