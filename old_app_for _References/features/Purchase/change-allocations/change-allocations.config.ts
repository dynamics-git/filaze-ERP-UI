import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";


export const ChangeAllocationHeader: HeaderDataConfig = {
    title: '',
    sections: [
        {
            title: 'Information',
            controls: [
                [
                    { type: FormFieldType.Number, label: 'originalAmountToAllocations', name: 'Original Amount To Allocations', required: true, decimal: true, readonly: true },
                    { type: FormFieldType.Number, label: 'remainingAmountToAllocations', name: 'Remaining Amount To Allocations', required: true, decimal: true, readonly: true },
                ],
                [
                    { type: FormFieldType.DropDown, label: 'allocationAccountSetup', name: 'Allocation Account Setup', apiUrl: '/portalAllocSetupHeaders', bindValue: 'code', displayFormat: '[code]' },
                    { type: FormFieldType.Number, label: 'totalHeadcount', name: 'Total Headcount', decimal: true, readonly: true },
                ]
            ]
        },
    ],
    removeUnicodeCharFields: ['originalAmountToAllocations'],
};

ChangeAllocationHeader.controls = (ChangeAllocationHeader.sections ?? []).flatMap(section => section.controls);


export const ChangeAllocationLine: LineDataConfig = {
    idProp: 'systemId',
    api: '',
    defaultLines: 2,
    isDirectApi: true,
    showDelete: true,
    showCreate: true,
    buttons: [{
        label: 'calHeadcount',
        name: 'Cal Headcount',
        icon: 'bi bi-file-text'
    }],
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'shortcutDimension1Value',
            name: 'Destination Value',
            apiUrl: `/dimensionsValues?$filter=DimensionCode eq 'DEPARTMENT'`,
            bindValue: 'Code',
            displayFormat: '[Code]',
            required: true,
        },
        {
            type: FormFieldType.Number,
            label: 'percentage',
            name: 'Percentage',
            required: true,
            decimal: true,
        },
        {
            type: FormFieldType.Number,
            label: 'amount',
            name: 'Amount',
            required: true,
            decimal: true,
        }, {
            type: FormFieldType.Number,
            label: 'headcount',
            name: 'Head Count',
            decimal: true,
        }
    ],
}
