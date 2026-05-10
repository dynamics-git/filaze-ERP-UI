import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const ButtonPermissionLine: LineDataConfig = {
    idProp: 'Id',
    api: '/buttonPermissions',
    defaultLines: 0,
    isDirectApi: true,
    showDelete: true,
    showCreate: false,
    controls: [
        {
            type: FormFieldType.TextBox,
            label: 'pageID',
            name: 'Page ID',
            required: true,
            readonly: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'roleID',
            name: 'Role ID',
            required: true,
            readonly: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'fieldName',
            name: 'Field Name',
            required: true,
            readonly: true
        },
         {
            type: FormFieldType.TextBox,
            label: 'sourceType',
            name: 'Source Type',
            readonly: true
        },
        {
            type: FormFieldType.Checkbox,
            label: 'IsEnable',
            name: 'Enable',
        },
        {
            type: FormFieldType.Checkbox,
            label: 'IsVisible',
            name: 'Hide',
        },
    ],
}