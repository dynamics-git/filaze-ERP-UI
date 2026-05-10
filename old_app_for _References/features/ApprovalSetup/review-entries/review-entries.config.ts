import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const ReviewEntryHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/documentReviewEntries',
    title: 'Review Entries',
 sections: [
  {
    title: 'Document Information',
    controls: [
      [
        {
          type: FormFieldType.TextBox,
          label: 'DocumentType',
          name: 'Document Type',
          readonly: true
        },
        {
          type: FormFieldType.TextBox,
          label: 'DocumentNo',
          name: 'Document No',
          readonly: true
        }
      ]
    ]
  }
]
};

ReviewEntryHeader.controls = (ReviewEntryHeader.sections ?? []).flatMap(section => section.controls);

