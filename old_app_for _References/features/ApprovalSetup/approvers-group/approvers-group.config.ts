import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const ApproversGroupHeadedr: HeaderDataConfig = {
    idProp: 'Id',
    api: '/approvalGroups',
    title: "Approver's Group",
    sections: [
        {
            title: 'Group Information',
            controls: [
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'Code',
                        name: 'Group ID'
                        // required: true,
                        // disabled: true
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'Description',
                        name: 'Description'
                        // required: true,
                        // disabled: true
                    }
                ]
            ]
        }
    ]
}

ApproversGroupHeadedr.controls = (ApproversGroupHeadedr.sections ?? []).flatMap(section => section.controls);


