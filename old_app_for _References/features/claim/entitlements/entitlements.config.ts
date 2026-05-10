import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';

export const EntitlementsLineConfig: LineDataConfig = {
  title: 'Entitlements',
  idProp: 'systemId',
  api: '/entitlements',
  showCreate: true,
  showDelete: true,
  controls: [
    {
      type: FormFieldType.TextBox,
      label: 'code',
      name: 'Code',
      required: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'description',
      name: 'Name'
    },
    {
      type: FormFieldType.Number,
      label: 'amount',
      name: 'Amount',
      decimal: true
    }
  ]
};
