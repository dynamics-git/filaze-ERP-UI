import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const PortalReason: HeaderDataConfig = {
    idProp: 'Id',
    api: '/portalReasons',
    title: 'portalReasons',
   sections: [
  {
    title: 'General Information',
    controls: [
      [
        {
          type: FormFieldType.TextBox,
          label: 'Code',
          name: 'Code',
          required: true
          // readonly: true
        },
        {
          type: FormFieldType.TextArea,
          label: 'Description',
          name: 'Description'
        }
      ]
    ]
  }
]
}
PortalReason.controls = (PortalReason.sections ?? []).flatMap(section => section.controls);
