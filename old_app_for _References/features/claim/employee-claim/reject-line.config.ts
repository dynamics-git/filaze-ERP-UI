import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const rejectLineConfig: LineDataConfig = {
    idProp: 'systemId',
    headerPKProp: 'claimNo',
    lineFKProp: 'claimNo',
    includeHeaderId: false,
    api: '',
    isDirectApi: true,
    defaultLines: 0,
    showCreate: false,
    showDelete: false,
    showExcelExport: false,
    buttons: [
        {
            label: 'applyRejectLine',
            name: 'Apply Reject Line',
            icon: 'bi bi-check-square'
        },
    ],
    controls: [

        {
            type: FormFieldType.DropDown,
            label: 'expenseType',
            name: 'Expense Type',
            required: true,
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'receiptNo',
            name: 'Receipt No',
            readonly: true,
        },
        {
            type: FormFieldType.DateTime,
            label: 'receiptDate',
            name: 'Receipt Date',
            dateOnly: true,
            // defaultSystemDate: true,
            systemUpdate: true,
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'receiptIssueBy',
            name: 'Receipt Issue By',
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'approvalStatus',
            name: 'Approval Status',
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'batchStatus',
            name: 'Batch Status',
            readonly: true,
            hidden: true,

        },
        {
            type: FormFieldType.TextBox,
            label: 'description',
            name: 'Description',
            readonly: true,
        },
        {
            type: FormFieldType.Checkbox,
            label: 'dueClaim',
            name: 'Due Claim',
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'dueClaimReason',
            name: 'Due Claim Reason',
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'fromLocation',
            name: 'From Location',
            readonly: true,

        },
        {
            type: FormFieldType.TextBox,
            label: 'toLocation',
            name: 'To Location',
            readonly: true,

        },
        {
            type: FormFieldType.Number,
            label: 'km',
            name: 'KM',
            decimal: true,
            readonly: true,
        },
        {
            type: FormFieldType.DropDown,
            label: 'typeOfTransportation',
            name: 'Type of Transportation',
            items: [
                {
                    value: '',
                    name: ''
                },
                {
                    value: 'Motorcycle',
                    name: 'Motorcycle'
                }, {
                    value: 'Vehicle',
                    name: 'Car'
                }

            ],
            bindLabel: 'name',
            bindValue: 'value',
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'motorcycleMileageRate',
            name: 'Motorcycle Mileage Rate (RM/KM)',
            readonly: true,

            decimal: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'carMileageRate',
            name: 'Car Mileage Rate (RM/KM)',
            readonly: true,

            decimal: true,
        },
        {
            type: FormFieldType.DropDown,
            label: 'paymentMethod',
            name: 'Payment Method',
            apiUrl: '/paymentMethods?$filter=showInPortal eq true',
            bindLabel: 'code',
            bindValue: 'code',
            readonly: true,

        },
        {
            type: FormFieldType.TextBox,
            label: 'cardNo',
            name: 'Pay Card No',
            readonly: true,

        },
        {
            type: FormFieldType.Number,
            label: 'amount',
            name: 'Amount',
            decimal: true,
            readonly: true,
        },
        // {
        //     type: FormFieldType.Number,
        //     label: 'amount',
        //     name: 'Amount',
        //     decimal: true,
        //     isNotVisiableSubPopup: true,
        //     readonly: true
        // },
        { type: FormFieldType.Checkbox, label: 'return', name: 'Reject', readonly: true },
        { type: FormFieldType.TextBox, label: 'returnReason', name: 'Reject Reason', readonly: true },
        // {
        //     type: FormFieldType.Checkbox,
        //     label: 'attachment',
        //     name: 'Attachment',
        //     readonly: true,
        //     isNotVisiableSubPopup: true
        // },
        // {
        //     type: FormFieldType.TextBox,
        //     label: 'clientName',
        //     name: 'Client Name',
        //     
        // },
        {
            type: FormFieldType.TextBox,
            label: 'job',
            name: 'Job',
            readonly: true,
        },

        {
            type: FormFieldType.Checkbox,
            label: 'Chargeable',
            name: 'Chargeable?',
            spacialClass: 'checkbox-col',
            readonly: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'clientName',
            name: 'Chargeable Client Name',
            readonly: true,
        },

    ],
    removeUnicodeCharFields: ['approvalStatus', 'batchStatus', 'returnReason']
}