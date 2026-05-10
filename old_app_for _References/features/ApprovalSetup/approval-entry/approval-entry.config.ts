import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const ApprovalEntryHeader: HeaderDataConfig = {
  idProp: 'Id',
  api: '/approvalEntries',
  title: 'Approval Entries',
  sections: [
    {
      title: 'General Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'documentType',
            name: 'Document Type',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'documentNo',
            name: 'Document No',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'approvalType',
            name: 'Approval Type',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'status',
            name: 'Status',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'approverId',
            name: 'Approver',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'senderId',
            name: 'Sender',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'dateTimeSentForApproval',
            name: 'Sent For Approval',
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'lastDateTimeModified',
            name: 'Last Modified',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.Number,
            label: 'amount',
            name: 'Amount',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'currencyCode',
            name: 'Currency',
            readonly: true
          }
        ]
      ]
    }
  ],

  removeUnicodeCharFields: [
    'documentType',
    'limitType',
    'approvalType'
  ]
};

ApprovalEntryHeader.controls = (ApprovalEntryHeader.sections ?? []).flatMap(section => section.controls);



