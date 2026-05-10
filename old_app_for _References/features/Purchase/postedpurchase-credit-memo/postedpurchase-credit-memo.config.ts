import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PostedPurchaseCreditMemoeHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/postedPurchCrMemoHeaders',
    autoGenerateField: "Number",
    title: 'Posted Purchase Credit Memo',
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
        // {
        //     label: 'PostAsCM',
        //     name: 'Post As Credit Memo',
        //     icon: 'bi bi-save'
        // }
    ],
    sections: [
        {
            title: 'Vendor Information',
            controls: [
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'Number',
                        name: 'Number',
                        required: true,
                        readonly: true
                    },
                    {
                        type: FormFieldType.DateTime,
                        label: 'DocumentDate',
                        name: 'Document Date',
                        dateOnly: true,
                        defaultSystemDate: true
                    }
                ], [
                    {
                        type: FormFieldType.DropDown,
                        label: 'BuyFromVendorNumber',
                        name: 'Vendor No',
                        apiUrl: '/vendorsAPI',
                        bindValue: 'number',
                        displayFormat: '[number] - [displayName]'
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'BuyFromVendorName',
                        name: 'Vendor Name',
                        readonly: true
                    }
                ],
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'BuyFromAddress',
                        name: 'Address',
                        readonly: true
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'PurchaserCode',
                        name: 'Purchaser Code',
                        apiUrl: '/salespersonPurchasers',
                        bindValue: 'Code',
                        displayFormat: '[Code]-[Name]'
                    }
                ],
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'BuyFromCounty',
                        name: 'Country',
                        readonly: true
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'Status',
                        name: 'Status',
                        initialValue: 'Open',
                        readonly: true,
                        copyResetValue: 'Open'
                    }
                ],
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'BuyFromPostCode',
                        name: 'Post Code',
                        readonly: true
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'BuyFromCity',
                        name: 'City',
                        readonly: true
                    }
                ],
                [
                    {
                        type: FormFieldType.PhoneNumber,
                        label: 'BuyFromContactNumber',
                        name: 'Contact No',
                        readonly: true
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'OrderNumber',
                        name: 'Order No'
                    }
                ]
            ]
        },
        {
            title: 'Vendor Documents',
            controls: [
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'VendorInvoiceNumber',
                        name: 'Vendor Invoice No'
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'VendorOrderNumber',
                        name: 'Vendor Order No'
                    }
                ],
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'vendorCrMemoNo',
                        name: 'Vendor Credit Memo No',
                        readonly: true
                    }
                ],
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'VendorShipmentNumber',
                        name: 'Vendor Shipment No'
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'PaymentTermsCode',
                        name: 'Payment Terms Code',
                        apiUrl: '/paymentTerms',
                        bindValue: 'Code',
                        displayFormat: '[Code]-[Description]'
                    }
                ]
            ]
        },
        {
            title: 'Classification',
            controls: [
                [
                    {
                        type: FormFieldType.DropDown,
                        label: 'ShortcutDimension1Code',
                        name: 'PROJECT'
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'ShortcutDimension2Code',
                        name: 'DEPARTMENT/COST CNTR'
                    }
                ]
            ]
        },
        {
            title: 'References',
            controls: [
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'YourReference',
                        name: 'Your Reference'
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'BudgetName',
                        name: 'Budget Name',
                        apiUrl: '/glbudgetlists',
                        displayFormat: '[BudgetName] - [description]',
                        bindValue: 'BudgetName'
                    }
                ]
            ]
        },
        {
            title: 'Additional Info',
            controls: [
                [
                    {
                        type: FormFieldType.TextArea,
                        label: 'Remark',
                        name: 'Remark',
                        isDescription: true,
                        maxlength: 100
                    },
                    {
                        type: FormFieldType.DateTime,
                        label: 'PostingDate',
                        name: 'PostingDate',
                        dateOnly: true,
                        defaultSystemDate: true
                    }
                ]
            ]
        }
    ]
};
PostedPurchaseCreditMemoeHeader.controls = (PostedPurchaseCreditMemoeHeader.sections ?? []).flatMap(section => section.controls);


export const PostedPurchaseCreditMemoLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'Number',
    lineFKProp: 'DocumentNo',
    api: '/postedPurchCrMemoLines',
    includeHeaderId: true,
    defaultLines: 1,
    apiPatchProperties: [
        "AmountLCY",
        "LineAmount",
        "CurrencyCode",
        "LineAmount",
    ],
    controls: [
        // {
        //     type: FormFieldType.DropDown,
        //     label: 'documentType',
        //     name: 'Documeny Type',
        //     initialValue: 'Credit Memo',
        //     items: [{
        //         value: 'Credit Memo',
        //         name: 'Credit Memo'
        //     }],
        //     bindLabel: 'name',
        //     bindValue: 'value',
        // },
        {
            type: FormFieldType.DropDown,
            label: 'Type',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            },
            {
                value: ' ',
                name: 'Comment'
            }],
            bindLabel: 'name',
            bindValue: 'value',
            required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'No',
            name: 'No',
            required: true,
            autoSave: false
        },
        {
            type: FormFieldType.TextBox,
            label: 'Description',
            name: 'Description',
            isDescription: true,
            maxlength: 100
        },
        {
            type: FormFieldType.DropDown,
            label: 'UnitOfMeasure',
            name: 'Unit Of Measure',
            apiUrl: '/unitOfMeasures',
            bindValue: 'Code',
            displayFormat: '[Code] - [Description]'
        },
        {
            type: FormFieldType.DropDown,
            label: 'LocationCode',
            name: 'Location',
            apiUrl: '/locations',
            bindValue: 'Code',
            displayFormat: '[Code] - [Name]',
            // required: true,
        },
        {
            type: FormFieldType.Number,
            label: 'Quantity',
            name: 'Quantity',
            decimal: true,
            // required: true,

        },
        {
            type: FormFieldType.Number,
            label: 'DirectUnitCost',
            name: 'Unit Cost',
            decimal: true,
            // required: true,

        },
        {
            type: FormFieldType.Number,
            label: 'LineDiscountAmount',
            name: 'Line Discount Amount',
            decimal: true,
        },
        {
            type: FormFieldType.Number,
            label: 'LineAmount',
            name: 'Amount',
            decimal: true,
            readonly: true,
            // required: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'CurrencyCode',
            name: 'CurrencyCode',
            readonly: true,
            disabled: true,
            // required: true,
        },
        {
            type: FormFieldType.Number,
            label: 'AmountLCY',
            name: 'Amount LCY',
            decimal: true,
            readonly: true,
            disabled: true,
            // required: true,
        },

    ],
    removeUnicodeCharFields: ['Type']
}
export const PostedPurchaseCreditMemoCalculation: CalculationSectionConfig = {
    controls: [
        [
            {
                type: FormFieldType.Number,
                label: 'totalAmount',
                name: 'Total Amount',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
                alignRight: true
            }
        ]
    ]
}