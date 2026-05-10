import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';

export const EmployeeRoleLineConfig: LineDataConfig = {
  title: 'Employee Roles',
  idProp: 'systemId',
  api: '/employeeRoles',
  showCreate: true,
  showDelete: true,
  controls: [
    {
      type: FormFieldType.TextBox,
      label: 'roleId',
      name: 'Role ID',
      required: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'roleName',
      name: 'Role Name',
      required: true
    }
  ]
};
