import { FormField } from "../../../core/models/shared/formField";
import { FormFieldType } from "../../../core/models/shared/formField.enum";

export const AttachmentsControls: FormField[] = [
  {
      label: 'FileUrl',
      name: 'Attachment',
      type: FormFieldType.FileUpload
  },
  {
    label: 'DocumentsAttachmentType',
    name: 'Documents Attachment Type',
    type: FormFieldType.DropDown,
    apiUrl: '/portalDocAttachmentTypes',
    bindValue: 'Code',
    displayFormat: '[Code] - [Description]'
  },
  {
    label: 'FileExtension',
    name: 'File Extension',
    type: FormFieldType.TextBox,
    readonly: true
  },
  {
    label: 'FileType',
    name: 'File Type',
    type: FormFieldType.TextBox,
    readonly: true
  },
  {
    label: 'UserId',
    name: 'User',
    type: FormFieldType.TextBox,
    readonly: true
  },
  {
    label: 'AttachedDate',
    name: 'Attached Date',
    type: FormFieldType.DateTime,
    readonly: true,
    dateOnly: true
  }
];