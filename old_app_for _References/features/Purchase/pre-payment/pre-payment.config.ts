import { DrawerDataConfig } from "../../../core/models/shared/drawer-data.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";


export const RedistributePrePaymentHeader: DrawerDataConfig = {
    title: 'Prepayment',
    api: '/portalInvPrePayments',
    idProp: 'systemId',
    isDrawerCloseAfterSave: false,
    buttons: [
        { label: 'applyPrepayment', name: 'Apply Prepayment', icon: 'bi bi-check-circle' },
        { label: 'deletePrepayment', name: 'Delete Prepayment', icon: 'bi bi-trash' }
    ],
    sections: [
        {
            title: 'Information',
            controls: [
                [
                    { type: FormFieldType.Number, label: 'originalAmountToPrepayment', name: 'Original Amount To Prepayment', decimal: true, readonly: true },
                ],
                [
                    { type: FormFieldType.Number, label: 'percentage', name: 'Percentage', decimal: true },
                    { type: FormFieldType.Number, label: 'amount', name: 'Amount', decimal: true },
                ]
            ]
        },
    ],
};

RedistributePrePaymentHeader.controls = (RedistributePrePaymentHeader.sections ?? []).flatMap(section => section.controls);


export const RedistributePrePaymentLine: LineDataConfig = {
    idProp: 'systemId',
    api: '',
    defaultLines: 0,
    isDirectApi: true,
    headerPKProp: 'purchaseLineId',
    lineFKProp: 'purchaseLineId',
    showCreate: false,
    showDelete: false,
    controls: [
        {
            type: FormFieldType.Number,
            label: 'sourceLineNo',
            name: 'Source Line No',
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'percentage',
            name: 'Percentage',
            decimal: true,
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'amount',
            name: 'Amount',
            decimal: true,
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'remainingAmount',
            name: 'Remaining Amount',
            decimal: true,
            readonly: true,
        },
    ],
};

