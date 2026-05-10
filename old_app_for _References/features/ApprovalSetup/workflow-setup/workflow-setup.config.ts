import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const WorkflowSetupHeader: HeaderDataConfig = {
    idProp: 'id',
    api: '/workflowHeaders',
    title: 'Workflow Setup',
    sections: [
        {
            title: 'General Info',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'code', name: 'Code', showRequiredSymbol: true },
                    { type: FormFieldType.Checkbox, label: 'isEnabled', name: 'Enabled' }

                ],
                [
                    {
                        type: FormFieldType.DropDown,
                        label: 'documentType',
                        name: 'Document Type',
                        showRequiredSymbol: true,
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
                        bindValue: 'value',
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'invoiceType',
                        name: 'Invoice Type',
                        // items: [
                        //     // {
                        //     //     value: 'Default',
                        //     //     name: 'Default'
                        //     // },
                        //     {
                        //         value: 'Recurring',
                        //         name: 'Recurring'
                        //     },
                        //     {
                        //         value: 'Non-Recurring',
                        //         name: 'Non-Recurring',
                        //     }
                        // ],
                        // bindLabel: 'name',
                        // bindValue: 'value',
                        showRequiredSymbol: true,
                        required: true,
                    },

                ],
                [
                    {
                        type: FormFieldType.Number,
                        label: 'escalationDays',
                        name: 'Escalation Days',
                    },
                    {
                        type: FormFieldType.Checkbox,
                        label: 'variationOrder',
                        name: 'Variation Order',
                    }
                ],
            ]
        }
    ],
    removeUnicodeCharFields: ['documentType']

};

WorkflowSetupHeader.controls = (WorkflowSetupHeader.sections ?? []).flatMap(section => section.controls);


export const WorkflowAmtSetupLine: LineDataConfig = {
    idProp: 'systemId',
    headerPKProp: 'code',
    lineFKProp: 'codeNo',
    api: '/workflowAmtSteps',
    showExcelExport: false,
    includeHeaderId: true,
    showLineRegisterEntry: true,
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'initiatorType',
            name: 'Initiator Type',
            items: [
                {
                    value: 'User',
                    name: 'User'
                },
                {
                    value: 'Group',
                    name: 'Group',
                }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            required: true,
        },
        {
            type: FormFieldType.DropDown,
            label: 'workflowUserID',
            name: 'Workflow Users/ Groups',
            required: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'amountRange',
            name: 'Amount Range',
            required: true,
        },
    ],

};


export const SubPopupWorkflowSetupLine: LineDataConfig = {
    idProp: 'id',
    headerPKProp: 'code',
    lineFKProp: 'codeNo',
    subPopupFKProp: 'workflowUserId',
    api: '/workflowLines',
    //api: '/approvalSetups',
    includeHeaderId: true,
    // showCreate: false,
    showDelete: false,
    // showExcelExport: false,
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'documentType',
            name: 'Document Type',
            hidden: true,
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
        },
        {
            type: FormFieldType.DropDown,
            label: 'approvalType',
            name: 'Approval Type',
            required: true,
            items: [
                {
                    value: 'Sequential',
                    name: 'Sequential',
                },
                {
                    value: 'Parallel',
                    name: 'Parallel'
                },
            ],
            bindLabel: 'name',
            bindValue: 'value',
            readonly: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'initiatorType',
            name: 'Initiator Type',
            items: [
                {
                    value: 'User',
                    name: 'User'
                },
                {
                    value: 'Group',
                    name: 'Group',
                }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            readonly: true,
        },
        {
            type: FormFieldType.DropDown,
            label: 'workflowUserId',
            name: 'Workflow Users/ Groups',
            readonly: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'sequenceNo',
            name: 'Sequence No',
            // required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'approverType',
            name: 'Approver Type',
            items: [
                {
                    value: 'User',
                    name: 'User'
                },
                {
                    value: 'Group',
                    name: 'Group',
                }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            // required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'approverId',
            name: 'Approver ID/ Group ID',
            required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'department',
            name: 'Department',
            apiUrl: '/employeeDepartments',
            bindValue: 'departmentId',
            displayFormat: '[departmentId] - [departmentName]'
        },
        {
            type: FormFieldType.Checkbox,
            label: 'gmd',
            name: 'GMD',
        },
        {
            type: FormFieldType.Checkbox,
            label: 'igp',
            name: 'IGP',
        },
        {
            type: FormFieldType.Checkbox,
            label: 'workflowDocRequired',
            name: 'Document Required',
            readonly: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'note',
            name: 'Note'
        }
    ],
    removeUnicodeCharFields: ['documentType']
};