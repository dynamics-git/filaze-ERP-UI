import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PurchaseInvoiceHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/purchaseInvoiceHeaders',
    autoGenerateField: "Number",
    title: 'Purchase Invoice',
    commandBar: {
        maxPrimaryActions: 3,
        maxVisibleGroups: 3
    },
    buttons: [
        // {
        //     label: 'SendApprovalRequest',
        //     name: 'Send Approval Request',
        //     icon: 'bi bi-envelope'
        // },
        // {
        //     label: 'CancelApprovalRequest',
        //     name: 'Cancel Approval Request',
        //     icon: 'bi bi-envelope'
        // },
        {
            label: 'PortalSendApprovalRequest',
            name: 'Send Approval Request',
            icon: 'bi bi-envelope',
            group: 'Approval',
            isPrimary: true,
            order: 10
        },
        {
            label: 'PortalCancelApprovalRequest',
            name: 'Cancel Request',
            icon: 'bi bi-envelope',
            group: 'Approval',
            order: 20
        },
        {
            label: 'Post',
            name: 'Post',
            icon: 'bi bi-save',
            group: 'Process',
            isPrimary: true,
            order: 30
        },
        {
            label: 'approverAttachment',
            name: 'Approver Attachment',
            icon: 'bi bi-paperclip',
            group: 'More',
            order: 60
        },
        {
            label: 'Approved',
            name: 'Approved',
            icon: 'bi bi-check',
            group: 'Approval',
            order: 40
        },
        {
            label: 'ApprovalReject',
            name: 'Reject',
            icon: 'bi bi-x',
            group: 'Approval',
            order: 50
        },
        // {
        //     label: 'openReq',
        //     name: 'Open Req',
        //     icon: 'bi bi-paperclip'
        // },

    ],
    sections: [
        {
            // title: 'General Information',
            title: 'Overview',
            autoPack: true,
            controls: [
                [
                    {
                        type: FormFieldType.DropDown,
                        label: 'BuyFromVendorNumber',
                        name: 'Vendor No',
                        apiUrl: '/vendorsAPI',
                        bindValue: 'number',
                        displayFormat: '[number] - [displayName]',
                        showRequiredSymbol: true
                    },
                    { type: FormFieldType.DateTime, label: 'DocumentDate', name: 'Document Date', dateOnly: true, defaultSystemDate: true, showRequiredSymbol: true },
                ],
                [
                    // { type: FormFieldType.TextBox, label: 'BuyFromCounty', name: 'Country', },

                    // { type: FormFieldType.TextBox, label: 'Status', name: 'Status', initialValue: 'Open', readonly: true, copyResetValue: 'Open' }
                    { type: FormFieldType.TextBox, label: 'Status', name: 'Status', readonly: true, },
                    {
                        type: FormFieldType.DateTime,
                        label: 'PostingDate',
                        name: 'Posting Date',
                        dateOnly: true,
                        defaultSystemDate: true
                    }
                ],
                [
                    // { type: FormFieldType.TextBox, label: 'YourReference', name: 'Your Reference' },

                    // {
                    //     type: FormFieldType.DropDown,
                    //     label: 'BudgetName',
                    //     name: 'Budget Name',
                    //     apiUrl: '/glbudgetlists',
                    //     displayFormat: '[BudgetName] - [description]',
                    //     bindValue: 'BudgetName'
                    // }
                ],
                [
                    {
                        type: FormFieldType.TextArea,
                        label: 'Remark',
                        name: 'Remark',
                        isDescription: true,
                        maxlength: 100,
                        showRequiredSymbol: true
                    },
                    {
                        type: FormFieldType.DropDown, label: 'esg', name: 'ESG', items: [
                            {
                                value: 'Climate',
                                name: 'Climate'
                            }, {
                                value: 'Cybersecurity',
                                name: 'Cybersecurity'
                            }, {
                                value: 'ESG - Others',
                                name: 'ESG - Others'
                            }, {
                                value: 'Non-ESG',
                                name: 'Non-ESG'
                            },],
                        bindLabel: 'name',
                        bindValue: 'value',
                        showRequiredSymbol: true
                    },
                ],
                [
                    // {
                    //     type: FormFieldType.TextArea,
                    //     label: 'PendingApproversID',
                    //     name: 'Pending Approvers ID',
                    //     readonly: true
                    // },
                    // {
                    //     type: FormFieldType.TextArea,
                    //     label: 'RejectReason',
                    //     name: 'Approvers Comments',
                    //     readonly: true
                    // },

                ], [
                    { type: FormFieldType.TextBox, label: 'VendorInvoiceNumber', name: 'Vendor Invoice No', showRequiredSymbol: true },
                    //{ type: FormFieldType.TextBox, label: 'VendorOrderNumber', name: 'Vendor Order No' }
                    { type: FormFieldType.Checkbox, label: 'igp', name: 'IGP', },
                ],
                [{
                    type: FormFieldType.DropDown, label: 'invoiceFrequency', name: 'Invoice Frequency', items: [
                        // {
                        //     value: 'Default',
                        //     name: 'Default'
                        // },
                        {
                            value: 'Recurring',
                            name: 'Recurring'
                        },
                        {
                            value: 'Non-Recurring',
                            name: 'Non-Recurring'
                        },],
                    bindLabel: 'name',
                    bindValue: 'value',
                    showRequiredSymbol: true
                },
                // { type: FormFieldType.TextBox, label: 'VendorShipmentNumber', name: 'Vendor Shipment No' },
                { type: FormFieldType.Checkbox, label: 'gmd', name: 'GMD', },
                ],
                [{
                    type: FormFieldType.DropDown,
                    label: 'currencyCode',
                    name: 'Currency Code',
                    apiUrl: '/currencyCodes',
                    bindValue: 'Code',
                    displayFormat: '[Code]',
                },
                // {
                //     type: FormFieldType.TextBox,
                //     label: 'ShortcutDimension1Code',
                //     name: 'Department Code',
                //     showRequiredSymbol: true
                // },
                {
                    type: FormFieldType.TextBox,
                    label: 'ApprovalComment',
                    name: 'Approval Comment',
                    readonly: true,
                }
                ],
                [{
                    type: FormFieldType.TextBox,
                    label: 'exchangeRate',
                    name: 'Currency Exchange Rate',
                    readonly: true,
                }],
                // [{
                //     type: FormFieldType.Number,
                //     label: 'prepaymentAmount',
                //     name: 'Prepayment Amount',
                //     decimal: true
                // },]
            ]
        },

    ],
    removeUnicodeCharFields: ['Status']
};

PurchaseInvoiceHeader.controls = (PurchaseInvoiceHeader.sections ?? []).flatMap(section => section.controls);


export const PurchaseInvoiceLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'Number',
    lineFKProp: 'DocumentNo',
    api: '/purchaseInvoiceLines',
    includeHeaderId: true,
    defaultLines: 2,
    showLineAttachments: true,
    isShowUploaderFile: true,

    buttons: [{
        label: 'redistributeAccountAllocations',
        name: 'Redistribute account allocations',
        icon: 'bi bi-menu-button-fill'
    },
    {
        label: 'prePayment',
        name: 'Prepayment',
        icon: 'bi bi-currency-dollar'
    }],
    apiPatchProperties: [
        "LineAmount",
        "AmountLCY",
        "VATProdPostingGroup"
    ], controls: [
        {
            type: FormFieldType.DropDown,
            label: 'documentType',
            name: 'Document Type',
            initialValue: 'Invoice',
            items: [{
                value: 'Invoice',
                name: 'Invoice'
            }],
            bindLabel: 'name',
            bindValue: 'value',
            hidden: true,
            systemUpdate: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'Type',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            },
                // {
                //     value: ' ',
                //     name: 'Comment'
                // }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            required: true,
            showRequiredSymbol: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'No',
            name: 'No',
            required: true,

            showRequiredSymbol: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'Description',
            name: 'Description',
            isDescription: true,
            maxlength: 100,
        },
        // {
        //     type: FormFieldType.DropDown,
        //     label: 'UnitOfMeasure',
        //     name: 'Unit Of Measure',
        //     apiUrl: '/unitOfMeasures',
        //     bindValue: 'Code',
        //     displayFormat: '[Code] - [Description]'
        // },
        // {
        //     type: FormFieldType.DropDown,
        //     label: 'LocationCode',
        //     name: 'Location',
        //     apiUrl: '/locations',
        //     bindValue: 'Code',
        //     displayFormat: '[Code] - [Name]',
        //     // required: true,
        // },
        {
            type: FormFieldType.Number,
            label: 'Quantity',
            name: 'Quantity',
            decimal: true,
            showRequiredSymbol: true,
            initialValue: 1,
            systemUpdate: true,
            // required: true,
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'DirectUnitCost',
            name: 'Unit Cost',
            decimal: true,
            showRequiredSymbol: true,

            // required: true,

        },
        {
            type: FormFieldType.Number,
            label: 'LineDiscountAmount',
            name: 'Line Discount Amount',
            decimal: true,

        },
        {
            type: FormFieldType.DropDown,
            label: 'VATProdPostingGroup',
            name: 'SST Posting Group',
            apiUrl: '/vatProdPostingGroups',
            bindValue: 'code',
            displayFormat: '[code]',
            showRequiredSymbol: true,

        },
        {
            type: FormFieldType.TextBox,
            label: 'vat',
            name: 'SST Percentage',
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'LineAmount',
            name: 'Amount',
            decimal: true,
            showRequiredSymbol: true,
            readonly: true,
            // required: true,
        },
        // {
        //     type: FormFieldType.DropDown,
        //     label: 'CurrencyCode',
        //     name: 'CurrencyCode',
        //     //readonly: true,
        //     disabled: true,
        //     // required: true,
        //     apiUrl: '/currencyCodes',
        //     bindValue: 'Code',
        //     displayFormat: '[Code]',
        // },
        {
            type: FormFieldType.Number,
            label: 'AmountLCY',
            // name: 'Amount LCY',
            name: 'Amount MYR',
            decimal: true,
            readonly: true,
            disabled: true,
            // required: true,
        },
        // {
        //     type: FormFieldType.FileUpload,
        //     label: 'Attachment',
        //     name: 'Attachment',
        // },

    ],
    removeUnicodeCharFields: ['documentType', 'Type']
}
export const PurchaseInvoiceCalculation: CalculationSectionConfig = {
    controls: [
        [
            {
                type: FormFieldType.Number,
                label: 'totalAmount',
                name: 'Total Excl. SST',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
            }, {
                type: FormFieldType.Number,
                label: 'amountIncludingVAT',
                name: 'Total Incl. SST',//(add Currency code)
                readonly: true,
                initialValue: '0.00',
                decimal: true,
            }
        ],
        [
            {
                type: FormFieldType.Number,
                label: 'totalSST', //(Total Incl. SST - Total Excl. SST)
                name: 'Total SST',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
            },
            {
                type: FormFieldType.Number,
                label: 'totalInclSST', //if headerData.exchangeRate then local courrency of including SST other wise sum of amountIncludingVAT
                name: 'Total Incl. SST (MYR)',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
            }
        ],
    ]
}
