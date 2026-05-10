import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { HeaderDataConfig } from '../../../core/models/shared/header-data.config';

export const CountryMasterHeaderConfig: HeaderDataConfig = {
  idProp: 'Id',
  api: '/countryRegionCodes',
  title: 'Country',
  patchUserId: false,
  sections: [
    {
      title: 'General Setup',
      controls: [
        [
          {
            type: FormFieldType.DropDown,
            label: 'Code',
            name: 'Country Code',
            apiUrl: '/countryRegionCodes',
            bindValue: 'Code',
            displayFormat: '[Code]'
          },
          {
            type: FormFieldType.TextBox,
            label: 'Name',
            name: 'Country Name'
          }
        ]
      ]
    }
  ]
};

CountryMasterHeaderConfig.controls =
  (CountryMasterHeaderConfig.sections ?? []).flatMap(
    section => section.controls
  );
