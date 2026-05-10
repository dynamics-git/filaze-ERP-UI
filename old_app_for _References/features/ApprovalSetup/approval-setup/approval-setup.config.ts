import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const ApprovalSetupLineConfig: LineDataConfig = {
    title: 'Approval User Setup',
    idProp: 'Id',
    api: '/approvalSetups',
    controls: [
       
        {
            type: FormFieldType.DropDown,
            label: 'UserID',
            name: 'User ID',
            apiUrl: '/portalUsers',
            bindValue: 'UserId',
            bindLabel: 'UserId',
            required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'DocumentType',
            name: 'Document Type',
            required: true,
            items: [
                {
                    value: 'Requisition',
                    name: 'Purchase Requisition',
                }, 
                {
                    value: 'Quote',
                    name: 'Purchase Quote'
                },
                {
                    value: 'Order',
                    name: 'Purchase Order',
                }, 
                {
                    value: 'Invoice',
                    name: 'Purchase Invoice'
                },
                // {
                //     value: 'Credit Memo',
                //     name: 'Credit Memo',
                // },
                // {
                //     value: 'Blanket Order',
                //     name: 'Blanket Order',
                // },
                // {
                //     value: 'Return Order',
                //     name: 'Return Order',
                // },
                // {
                //     value: 'Variation Order',
                //     name: 'Variation Order',
                // },
                {
                    value: 'Petty Cash',
                    name: 'Petty Cash',
                },
                {
                    value: 'Sales Invoice',
                    name: 'Sales Invoice',
                },
                {
                    value: 'Budget',
                    name: 'Budget Request',
                },
                {
                    value: 'BW Requisition',
                    name: 'BW Requisition',
                }
            ],
            bindLabel: 'name',
            bindValue: 'value'
        },
        {
            type: FormFieldType.DropDown,
            label: 'ApproverID',
            name: 'Approver ID',
            apiUrl: '/portalUsers',
            bindValue: 'UserId',
            bindLabel: 'UserId'
        },
        {
            type: FormFieldType.Email,
            label: 'EMail',
            name: 'Email (Required***)',
            required: true,
            autoSave: false
        },
         {
            type: FormFieldType.Checkbox,
            label: 'VariationOrder',
            name: 'Variation Order',
        },
        {
            type: FormFieldType.Number,
            label: 'PurchaseAmountApprovalLimit',
            name: 'Amount Approval Limit',
            // decimal: true,
            required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'GroupID',
            name: 'Approver Group',
            apiUrl: '/approvalGroups',
            bindLabel: 'Description',
            bindValue: 'Code'
        }
    ],
    removeUnicodeCharFields: ['DocumentType']
}