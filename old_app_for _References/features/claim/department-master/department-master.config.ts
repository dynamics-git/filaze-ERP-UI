import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const DepartmentLineConfig: LineDataConfig = {
  title: 'Departments',
  idProp: 'systemId',
  api: '/employeeDepartments',
  showCreate: true,
  showDelete: true,
  controls: [
    {
      type: FormFieldType.TextBox,
      label: 'departmentId',
      name: 'Department Id',
      required: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'departmentName',
      name: 'Department Name',
      required: true
    }
  ]
};
