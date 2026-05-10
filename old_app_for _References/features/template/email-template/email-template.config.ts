import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const EmailTemplateHeader: HeaderDataConfig = {
    idProp: 'systemId',
    api: '/customEmailTemplates',
    title: 'EmailTemplate',
    textEditor:true,
    sections: [
        {
            title: 'General Info',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'templateID', name: 'Template ID', required: true },
                    {
                        type: FormFieldType.DropDown,
                        label: 'documentType',
                        name: 'Document Type',
                        items: [
                            {
                                value: 'Requisition',
                                name: 'Purchase Requisition',
                            },
                            {
                                value: 'Quote',
                                name: 'Purchase Quote'
                            },
                            {
                                value: 'Order',
                                name: 'Purchase Order',
                            },
                            {
                                value: 'Invoice',
                                name: 'Purchase Invoice'
                            },
                            {
                                value: 'Petty Cash',
                                name: 'Petty Cash',
                            },
                            {
                                value: 'Sales Invoice',
                                name: 'Sales Invoice',
                            },
                            {
                                value: 'Budget',
                                name: 'Budget Request',
                            },
                            {
                                value: 'BW Requisition',
                                name: 'BW Requisition',
                            },
                            {
                                value: 'Employee Claim',
                                name: 'Employee Claim',
                            },
                            {
                                value: 'Finance Claim',
                                name: 'Finance Claim',
                            },
                            {
                                value: 'Claim Payment',
                                name: 'Claim Payment',
                            },
                        ],
                        bindLabel: 'name',
                        bindValue: 'value'
                    }
                ], [
                    {
                        type: FormFieldType.DropDown,
                        label: 'actionType',
                        name: 'Action Type',
                        items: [
                            {
                                value: 'Submitted',
                                name: 'Submitted',
                            },
                            {
                                value: 'Approved',
                                name: 'Approved'
                            },
                            {
                                value: 'Rejected',
                                name: 'Rejected'
                            },
                            {
                                value: 'Delegated',
                                name: 'Delegated',
                            },
                            {
                                value: 'Cancelled',
                                name: 'Cancelled'
                            },
                            {
                                value: 'Reminder',
                                name: 'Reminder'
                            },
                              {
                                value: 'Invite',
                                name: 'Invite'
                            },
                        ],
                        bindLabel: 'name',
                        bindValue: 'value'
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'templateTarget',
                        name: 'Template Target',
                        items: [
                            {
                                value: 'Approver',
                                name: 'Approver',
                            },
                            {
                                value: 'Requester',
                                name: 'Requester'
                            },
                             {
                                value: 'Vendor',
                                name: 'Vendor'
                            },
                            {
                                value: 'Other',
                                name: 'Other'
                            },
                        ],
                        bindLabel: 'name',
                        bindValue: 'value'
                    }

                ], [{ type: FormFieldType.Checkbox, label: 'isActive', name: 'Action' },]
            ]
        }
    ],
    removeUnicodeCharFields: ['documentType']

};

EmailTemplateHeader.controls = (EmailTemplateHeader.sections ?? []).flatMap(section => section.controls);

