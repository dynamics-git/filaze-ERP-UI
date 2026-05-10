import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const AddDimensionsLines: LineDataConfig = {
    title: 'Dimension',
    pageName: 'Dimension',
    idProp: 'Id',
    api: '/dimensionSetEntries',
    showDelete: true,
    showCreate: true,
    buttons: [
      {
        label: 'dimensionRules',
        name: 'Dimension Rules',
        icon: 'bi bi-gear'
      },
      {
        label: 'selectDimensionRule',
        name: 'Select Rule',
        icon: 'bi bi-check2-square'
      }
    ],

    controls: [
      {
        type: FormFieldType.DropDown,
        label: 'DimensionCode',
        name: 'Dimension Code',
        apiUrl: '/dimensions',
        bindLabel: 'code',
        bindValue: 'code',
        required: true
      },
      {
        type: FormFieldType.DropDown,
        label: 'DimensionValueCode',
        name: 'Dimension Value Code',
        required: true
      },
      {
        type: FormFieldType.TextBox,
        label: 'DimensionValueName',
        name: 'Dimension Value Name',
        readonly: true
      }
    ]
  };
