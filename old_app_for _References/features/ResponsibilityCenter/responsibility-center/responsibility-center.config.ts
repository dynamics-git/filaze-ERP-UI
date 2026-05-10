import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const AddResponsibilityCenterConfig: HeaderDataConfig = {
  idProp: 'Id',
  api: '/portalResponsibilityCentres',
  title: 'Responsibility Centers',
  sections: [
    {
      title: 'General Setup',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'Code',
            name: 'Code',
            required: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'Description',
            name: 'Description',
            required: true
          }
        ]
      ]
    }]
};

AddResponsibilityCenterConfig.controls =
  (AddResponsibilityCenterConfig.sections ?? []).flatMap(
    section => section.controls
  );