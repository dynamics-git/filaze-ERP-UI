import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';

export const EmployeeClaimTypeLineConfig: LineDataConfig = {
  title: 'Claim Types',
  idProp: 'systemId',
  api: '/employeeClaimTypes',
  showCreate: true,
  showDelete: true,
  controls: [
    {
      type: FormFieldType.TextBox,
      label: 'valueCode',
      name: 'Value Code',
      required: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'code',
      name: 'Code',
      required: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'description',
      name: 'Description'
    }
  ]
};
