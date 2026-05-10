import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const ReadytoInvHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/purchaseOrderHeaders',
    title: 'Ready to Invoice',
    showComments: false,
    commentDocumentType: 'Order',
    buttons: [

        {
            label: 'Post',
            name: 'Ready to Invooice Post',
            icon: 'bi bi-save'
        },

    ],
    controls: [
        [
            {
                type: FormFieldType.TextBox,
                label: 'Number',
                name: 'No',
                required: true,
                readonly: true
            },
            {
                type: FormFieldType.DateTime,
                label: 'DueDate',
                name: 'DueDate',
                dateOnly: true,
                defaultSystemDate: true,
                readonly: true
            }
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: 'BuyFromVendorNumber',
                name: 'Vendor No',
                readonly: true
            },
            {
                type: FormFieldType.DateTime,
                label: 'OrderDate',
                name: 'Order Date',
                dateOnly: true,
                defaultSystemDate: true,
                readonly: true
            }
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: 'BuyFromVendorName',
                name: 'Vendor Name',
                readonly: true
            },
            {
                type: FormFieldType.DateTime,
                label: 'RequestedReceiptDate',
                name: 'Requested Receipt Date',
                dateOnly: true,
                readonly: true,
                defaultSystemDate: true

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
                label: 'BuyFromCountryOrRegionCode',
                name: 'Country',
                readonly: true
            },
            {
                type: FormFieldType.TextBox,
                label: 'Status',
                name: 'Status',
                initialValue: 'Open',
                readonly: true
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
                type: FormFieldType.DateTime,
                label: 'DocumentDate',
                name: 'Document Date',
                dateOnly: true,
                defaultSystemDate: true
            }
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: 'BuyFromCity',
                name: 'City',
                readonly: true
            },
            {
                type: FormFieldType.PhoneNumber,
                label: "OrderNumber",
                name: "Order No",
                readonly: true
            }
        ],
        [
            {
                type: FormFieldType.PhoneNumber,
                label: "BuyFromContactNumber",
                name: "Contact No",
                readonly: true
            },
            {
                type: FormFieldType.TextBox,
                label: "VendorOrderNumber",
                name: "Vendor Order No",
                // readonly: true
            }
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: "VendorInvoiceNumber",
                name: "Vendor Invoice No",
                // readonly: true
            },
            {
                type: FormFieldType.TextBox,
                label: "VendorShipmentNumber",
                name: "Vendor Shipment No",
                // readonly: true
            }
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: "QuoteNumber",
                name: "Quote No",
                readonly: true
            }
        ],
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
            },
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: "VendorStatus",
                name: "Vendor Status",
                readonly: true,
            },
            {
                type: FormFieldType.DropDown,
                label: "PaymentTermsCode",
                name: "Payment Terms Code",
                apiUrl: '/paymentTerms',
                bindValue: 'Code',
                displayFormat: '[Code]-[Description]'
            }
        ],
        [
            {
                
                type: FormFieldType.DateTime,
                label: 'ValidityDate',
                name: 'Validity Date',
                dateOnly: true,
                defaultSystemDate: true
            },
            {
                type: FormFieldType.DateTime,
                label: "DeliveryDate",
                name: "Delivery Date",
                dateOnly: true,
                defaultSystemDate: true         }
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: "YourReference",
                name: "Your Reference",
            },
            {
                type: FormFieldType.TextBox,
                label: "PaymentReference",
                name: "Payment Reference",
            }
        ],
        // [
        //     {
        //         type: FormFieldType.TextBox,
        //         label: "ReviewType",
        //         name: "Review Type",
        //     },
        // ],
        [
            {
                type: FormFieldType.TextBox,
                label: "GRNReviewStatus",
                name: "GRN Review Status",
                readonly: true,
            },            {
                type: FormFieldType.TextBox,
                label: "InvoiceReviewStatus",
                name: "Invoice Review Status",
                readonly: true,
            },
        ],
        [
            {
                type: FormFieldType.TextBox,
                label: "GRNReviewerComment",
                name: "GRN Reviewer Comment",
                readonly: true,
            },
            {
                type: FormFieldType.TextBox,
                label: "InvoiceReviewerComment",
                name: "Invoice Reviewer Comment",
                readonly: true,
            }
        ],
        [
            {
                type: FormFieldType.TextArea,
                label: 'Remark',
                name: 'Remark',
                isDescription: true,
                maxlength: 100
            },
            {
                type: FormFieldType.TextArea,
                label: 'PendingApproversID',
                name: 'Pending Approvers ID',
                readonly: true,
            }

        ],
        [
            {
                type: FormFieldType.TextArea,
                label: 'RejectReason',
                name: 'Approvers Comments',
                readonly: true,
            },
            {
                type: FormFieldType.DateTime,
                label: 'PostingDate',
                name: 'Posting Date',
                dateOnly: true,
                defaultSystemDate: true
            },
        ],
        // [
        //     // {
        //     //     type: FormFieldType.TextBox,
        //     //     label: "VariationOrder",
        //     //     name: "Variation Order",
        //     //     items: [{
        //     //         value: 'Purchase Order',
        //     //         name: 'Purchase Order'
        //     //     },{
        //     //         value: 'Variation Order',
        //     //         name: 'Variation Order'
        //     //     },
        //     // ]
        //     //     ,
        //     //     bindLabel: 'name',
        //     //     bindValue: 'value'
        //     // },
        // ],
        [
            {
                type: FormFieldType.DropDown,
                label: 'ApproverGroup',
                name: 'Approver Group',
                apiUrl: '/approvalGroups',
                bindLabel: 'Description',
                bindValue: 'Code'
            },
            // {
            //     type: FormFieldType.DropDown,
            //     label: "LocationCode",
            //     name: "Location Code",
            //     apiUrl: '/locations',
            //     bindValue: 'Code',
            //     displayFormat: '[Code]-[Name]'
            // }
        ],
    ]
};

export const ReadytoInvLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'Number',
    lineFKProp: 'DocumentNo',
    api: '/purchaseOrderLines',
    showCreate: false,
    showDelete: false,
    defaultLines:0,
    // disableLine: true,
    apiPatchProperties: [
        "AmountToInvoice",
        "AmountInvoiced",
        "DirectUnitCost",
    ],
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'Type',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            },
            // {
            //     value: 'Item',
            //     name: 'Item'
            // },{
            //     value: 'Fixed Asset',
            //     name: 'Fixed Asset'
            // },{
            //     value: 'Charge (Item)',
            //     name: 'Charge (Item)'
            // },
            {
                value: ' ',
                name: 'Comment'
            }
        ],
            bindLabel: 'name',
            bindValue: 'value'
        },
        {
            type: FormFieldType.DropDown,
            label: 'No',
            name: 'Number',
            disabled: true
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
            // label: 'UnitOfMeasureCode',
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
            displayFormat: '[Code] - [Name]'
        },
        {
            type: FormFieldType.Number,
            label: 'Quantity',
            name: 'Quantity',
            decimal: true,
        },
        {
            type: FormFieldType.Number,
            label: 'OriginalCost',
            name: 'Original Cost/Unit',
            decimal: true,
        },
        {
            type: FormFieldType.Number,
            label: 'Tax',
            name: 'Tax/Unit',
            decimal: true,
        },
        {
            type: FormFieldType.Number,
            label: 'DirectUnitCost',
            name: 'Unit Price',
            decimal: true,
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'LineDiscountAmount',
            name: 'Line Discount Amount',
            decimal: true,
        },
        {
            type: FormFieldType.Number,
            label: 'QtyToReceive',
            name: 'Qty. to Receive',
            decimal: true
        },
        {
            type: FormFieldType.Number,
            label: 'QuantityReceived',
            name: 'Quantity Received',
            decimal: true,
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'QtyToInvoice',
            name: 'Qty. to Invoice',
            decimal: true,
            // readonly: true
        },
        {
            type: FormFieldType.Number,
            label: 'QuantityInvoiced',
            name: 'Quantity Invoiced',
            decimal: true,
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'LineAmount',
            name: 'PO Amount',
            decimal: true,
            readonly: true
        },
        {
            type: FormFieldType.Number,
            label: 'AmountToInvoice',
            name: 'Amount To Invoice',
            decimal: true,
            readonly: true
        },
        {
            type: FormFieldType.Number,
            label: 'AmountInvoiced',
            name: 'Amount Invoiced',
            decimal: true,
            readonly: true
        },

    ],
    removeUnicodeCharFields: ['Type']
}
export const ReadytoInvCalculation: CalculationSectionConfig = {
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
            },
            {
                type: FormFieldType.Number,
                label: 'totalAmountToInvoice',
                name: 'Total Amount To Invoice',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
                alignRight: true
            },
            {
                type: FormFieldType.Number,
                label: 'totalAmountInvoiced',
                name: 'Total Amount Invoiced',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
                alignRight: true
            }

        ]
    ]
}