import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const CompanyPermissionLineConfig: LineDataConfig = {
    title: 'Company Permissions',
    idProp: "Id",
    api: '/portalCompanyPermissions',
    controls: [
        {
            type: FormFieldType.DropDown,
            label: "UserId",
            name: "User Id",
            apiUrl: '/portalUsers',
            bindValue: 'UserId',
            displayFormat: '[UserId]',
            bindLabel: 'UserId',
            required: true
        },
        {
            type: FormFieldType.DropDown,
            label: "Company",
            name: "Company",
            apiUrl: '/companies',
            bindValue: 'name',
            bindLabel: 'name'
        },
        {
            type: FormFieldType.Checkbox,
            label: "AccessAllCompany",
            name: "Access All Company"
        }
    ]
};