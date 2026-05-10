import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const ClaimJournalLineConfig: LineDataConfig = {
    idProp: "Id",
    api: '/claimEntries',
    controls: [
        {
            type: FormFieldType.TextBox,
            label: "BatchName",
            name: "Batch Name",
            initialValue: 'PCLAIM',
            readonly: true
        },
        {
            type: FormFieldType.DateTime,
            label: "PostingDate",
            name: "Posting Date",
            required: true,
            dateOnly: true
        },
        {
            type: FormFieldType.TextBox,
            label: "DocumentType",
            name: "Document Type",
            initialValue: 'Payment',
            readonly: true
        },
        {
            type: FormFieldType.TextBox,
            label: "DimensionClaim",
            name: "Dimension Claim"
        },
        {
            type: FormFieldType.TextBox,
            label: "RefNo",
            name: "Ref No"
        },
        // {
        //     type: FormFieldType.TextBox,
        //     label: "DocumentNo",
        //     name: "Document No"
        // },
        {
            type: FormFieldType.TextBox,
            label: "AccountType",
            name: "Account Type",
            initialValue: 'GL Code',
            readonly: true
        },
        {
            type: FormFieldType.DropDown,
            label: "AccountNo",
            name: "Account No",
            apiUrl: '/glAccounts',
            displayFormat: '[No] - [Name]',
            bindValue: 'No'
        },
        {
            type: FormFieldType.TextBox,
            label: "Description",
            name: "Description",
            isDescription: true,
            maxlength: 100
        },
        {
            type: FormFieldType.Number,
            label: "Amount",
            name: "Amount"
        },
        {
            type: FormFieldType.TextBox,
            label: "Status",
            name: "Status",
            readonly: true
        }
    ]
};