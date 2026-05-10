import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const PortalSetupConfig: HeaderDataConfig = {
    id: 'systemId',
    idProp: 'systemId',
    api: '/portalSetups',
    title: 'Portal Setup',
    sections: [
        {
            title: 'General Information',
            controls: [
                [{
                    type: FormFieldType.Number,
                    label: 'purchInvoiceAutoQty',
                    name: 'Purchase Invoice Auto Quantity',
                    decimal: true
                }, {
                    type: FormFieldType.Checkbox,
                    label: 'bcAttachment',
                    name: 'BC Attachment',
                },
                ],
                [{
                    type: FormFieldType.Checkbox,
                    label: 'recurrNonRecurrWorkflow',
                    name: 'Recurring / Non-Recurring Workflow',
                }, {
                    type: FormFieldType.Checkbox,
                    label: 'portalReviewEnable',
                    name: 'Portal Review Enable',
                }],
                 [{
                    type: FormFieldType.Checkbox,
                    label: 'purchInvoiceAutoPrepayment',
                    name: 'Purchase Invoice Auto Prepayment',
                }, {
                    type: FormFieldType.Checkbox,
                    label: 'purchInvoiceAutoAllocation',
                    name: 'Purchase Invoice Auto Allocation',
                }],

            ]
        }
    ]
};

PortalSetupConfig.controls = (PortalSetupConfig.sections ?? []).flatMap(section => section.controls);


