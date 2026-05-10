import { FormFieldType } from "../../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../../core/models/shared/line-data.config";

export const DimensionRulesLines: LineDataConfig = {
    title: 'Dimension Rules',
    pageName: 'Dimension Rules',
    idProp: 'systemId',
    api: '/dimensionRules',
    showDelete: false,
    showCreate: false,
    showExcelExport: true,
    defaultLines: 0,
    isDirectApi: true,
    buttons: [
        {
            label: 'applyDimensionRule',
            name: 'Apply Entry',
            icon: 'bi bi-check2-circle'
        }
    ],

    controls: [
        {
            type: FormFieldType.TextBox,
            label: 'dimension1',
            name: 'Dimension 1',
        },
        {
            type: FormFieldType.TextBox,
            label: 'dimension2',
            name: 'Dimension 2',
        },
        {
            type: FormFieldType.TextBox,
            label: 'dimension3',
            name: 'Dimension 3',
        },
        {
            type: FormFieldType.TextBox,
            label: 'dimension4',
            name: 'Dimension 4',
        },
        {
            type: FormFieldType.TextBox,
            label: 'dimension5',
            name: 'Dimension 5',
        },
        {
            type: FormFieldType.TextBox,
            label: 'dimension6',
            name: 'Dimension 6',
        },
        {
            type: FormFieldType.TextBox,
            label: 'dimension7',
            name: 'Dimension 7',
        },
        {
            type: FormFieldType.TextBox,
            label: 'dimension8',
            name: 'Dimension 8',
        },
    ]
};
