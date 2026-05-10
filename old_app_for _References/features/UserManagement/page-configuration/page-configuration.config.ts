import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const AddPageConfigurationConfig: HeaderDataConfig = {
  idProp: 'Id',
  api: '/pageConfigurations',
  title: 'Page Configuration',
  sections: [
    {
      title: 'Page Information',
      controls: [
        [{
            type: FormFieldType.TextBox,
            label: 'Page',
            name: 'Page',
            required: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'title',
            name: 'Title',
          },
          
          {
            type: FormFieldType.TextBox,
            label: 'PageUrl',
            name: 'Page Url'
          }
        ]
      ]
    }
  ]
};
AddPageConfigurationConfig.controls = (AddPageConfigurationConfig.sections ?? []).flatMap(section => section.controls);