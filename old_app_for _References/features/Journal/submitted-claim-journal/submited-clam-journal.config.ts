import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const SubmitedClaimJournalHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/claimEntriesHeaders',
    title: 'Claim Journal',
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
                    }
                ],
                [
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
                    }
                ],
                [
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
                    }
                ],
                [
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
                    }
                ],
                [
                    {
                        type: FormFieldType.TextArea,
                        label: 'Remark',
                        name: 'Remark',
                        copyResetValue: '',
                        isDescription: true,
                        maxlength: 100,
                        readonly: true
                    }
                ]
            ]
        }
    ],
};
SubmitedClaimJournalHeader.controls = (SubmitedClaimJournalHeader.sections ?? []).flatMap(section => section.controls);


export const SubmitedClaimJournalLine: LineDataConfig = {
    idProp: "Id",
    api: '/claimEntries',
    headerPKProp: 'DocumentNo',
    lineFKProp: 'DocumentNo',
    includeHeaderId: true,
    defaultLines: 1,
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'AccountType',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            }],
            bindLabel: 'name',
            bindValue: 'value',
            // required: true
        },
        {
            type: FormFieldType.DropDown,
            label: "AccountNo",
            name: "Account No",
            apiUrl: '/glAccountClaimEntries',
            displayFormat: '[No] - [Name]',
            bindValue: 'No',
            // required: true
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
            name: 'PROJECT'
        },
        {
            type: FormFieldType.DropDown,
            label: 'ShortcutDimension2Code',
            name: 'DEPARTMENT/COST CNTR'
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
            type: FormFieldType.TextBox,
            label: "DocumentDate",
            name: "Document Date",
            disabled: true,
            // dateOnly: true,
            // defaultSystemDate: true,
        }
    ],
    removeUnicodeCharFields: ['AccountType']
};