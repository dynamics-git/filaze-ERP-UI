import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { HeaderDataConfig } from '../../../core/models/shared/header-data.config';

export const EmployeeMasterHeaderConfig: HeaderDataConfig = {
    idProp: 'systemId',
    api: '/employees',
    title: 'Employee',
    patchUserId: false,
    sections: [
        {
            title: 'General Setup',
            controls: [
                [{
                    type: FormFieldType.TextBox,
                    label: 'no',
                    name: 'Employee ID',
                    readonly: true
                },
                {
                    type: FormFieldType.TextBox,
                    label: 'firstName',
                    name: 'First Name',
                    required:true
                },

                ],
                [{
                    type: FormFieldType.TextBox,
                    label: 'lastName',
                    name: 'Last Name',
                },
                {
                    type: FormFieldType.DropDown,
                    label: 'staffGroupId',
                    name: 'Staff Group ID',
                    apiUrl: '/staffGroups',
                    bindValue: 'groupId',
                    displayFormat: '[groupId]'
                },

                ],
                [{
                    type: FormFieldType.DropDown,
                    label: 'roleId',
                    name: 'Role ID',
                    apiUrl: '/employeeRoles',
                    bindValue: 'roleId',
                    displayFormat: '[roleId]'
                },
                {
                    type: FormFieldType.DropDown,
                    label: 'departmentId',
                    name: 'Department ID',
                    apiUrl: '/employeeDepartments',
                    bindValue: 'departmentId',
                    displayFormat: '[departmentId]'
                },

                ],
                [{
                    type: FormFieldType.DropDown,
                    label: 'countryRegionCode',
                    name: 'Country Code',
                    apiUrl: '/countryRegionCodes',
                    bindValue: 'Code',
                    displayFormat: '[Code]'
                },
                {
                    type: FormFieldType.DropDown,
                    label: 'employeePostingGroup',
                    name: 'Employee Posting Group',
                    apiUrl: '/empPostingGroups',
                    bindValue: 'code',
                    displayFormat: '[code]'
                }
                ]
            ]
        }
    ]
};

EmployeeMasterHeaderConfig.controls =
    (EmployeeMasterHeaderConfig.sections ?? []).flatMap(
        section => section.controls
    );
