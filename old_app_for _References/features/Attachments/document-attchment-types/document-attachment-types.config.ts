import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const DocumentAttchmentTypeHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/portalDocAttachmentTypes',
    title: 'Document Attachment Types',
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
        },
        {
          type: FormFieldType.TextBox,
          label: 'Description',
          name: 'Description'
        }
      ]
    ]
  }
]
};
DocumentAttchmentTypeHeader.controls = (DocumentAttchmentTypeHeader.sections ?? []).flatMap(section => section.controls);