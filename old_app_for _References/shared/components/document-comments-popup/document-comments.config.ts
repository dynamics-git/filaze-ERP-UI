import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const DocumentCommentsConfig: LineDataConfig = {
    title: 'Comment Sheet',
    idProp: 'Id',
    api: '/portalPurchaseComments',
    controls: [
        {
            type: FormFieldType.DateTime,
            label: 'Date',
            name: 'Date',
            dateOnly: true,
            defaultSystemDate: false
        },
        {
            type: FormFieldType.TextBox,
            label: 'Comment',
            name: 'Comment',
            isDescription: true
        }
    ]
}