import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";


export const DocumentReviewUserSetupLineConfig: LineDataConfig = {
    title: 'Document Review User Setup',
    idProp: 'Id',
    api: '/documentReviewSetups',
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
            label: 'ReviewType',
            name: 'Review Type',
            required: true,
            items: [
                {
                    value: 'GRN Review',
                    name: 'GRN Review',
                }, 
                {
                    value: 'Invoice Review',
                    name: 'Invoice Review',
                },

            ],
            bindLabel: 'name',
            bindValue: 'value'
        },
        {
            type: FormFieldType.DropDown,
            label: 'DocumentType',
            name: 'Document Type',
            required: true,
            items: [
                {
                    value: 'Order',
                    name: 'Purchase Order',
                }, 
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
            type: FormFieldType.Number,
            label: 'PurchaseAmountApprovalLimit',
            name: 'Amount Approval Limit',
            // decimal: true,
            required: true
        },

    ]
}