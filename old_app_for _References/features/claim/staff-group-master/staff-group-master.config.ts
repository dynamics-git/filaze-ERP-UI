import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';

export const StaffGroupLineConfig: LineDataConfig = {
  title: 'Staff Groups',
  idProp: 'systemId',
  api: '/staffGroups',
  showCreate: true,
  showDelete: true,
  controls: [
    {
      type: FormFieldType.TextBox,
      label: 'groupId',
      name: 'Group Id',
      required: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'groupName',
      name: 'Group Name',
      required: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'description',
      name: 'Description'
    }
  ]
};
