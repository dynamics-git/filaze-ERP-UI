import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { DepartmentLineConfig } from "../department-master/department-master.config";
import { StaffGroupLineConfig } from "../staff-group-master/staff-group-master.config";
import { EmployeeRoleLineConfig } from "../employee-role-master/employee-role-master.config";
import { EntitlementsLineConfig } from "../entitlements/entitlements.config";
import { EmployeeClaimTypeLineConfig } from "../employee-claim-type/employee-claim-type.config";

export const EmployeeClaimSetupConfig: HeaderDataConfig = {
    id: 'systemId',
    idProp: 'systemId',
    api: '/empClaimSetups',
    title: 'Claim Setup',
    buttons: [
        { label: 'Departments',    name: 'Departments',   icon: 'bi bi-building',          lineConfig: DepartmentLineConfig },
        { label: 'Staff Groups',   name: 'Staff Groups',  icon: 'bi bi-people-fill',       lineConfig: StaffGroupLineConfig },
        { label: 'Employee Roles', name: 'Employee Roles',     icon: 'bi bi-person-badge',      lineConfig: EmployeeRoleLineConfig },
        { label: 'Entitlements',   name: 'Entitlements',  icon: 'bi bi-cash-stack',        lineConfig: EntitlementsLineConfig },
        { label: 'Claim Types',    name: 'Claim Types',   icon: 'bi bi-file-earmark-text', lineConfig: EmployeeClaimTypeLineConfig },
    ],
    sections: [
        {
            title: 'General',
            controls: [
                [{
                    type: FormFieldType.DateTime,
                    label: 'startDate',
                    name: 'Start Date',
                    defaultSystemDate: true,
                    dateOnly: true
                }, {
                    type: FormFieldType.DateTime,
                    label: 'endDate',
                    name: 'End Date',
                    defaultSystemDate: false,
                    dateOnly: true
                }],
                [{
                    type: FormFieldType.DropDown,
                    label: 'currencyCode',
                    name: 'Currency Code',
                    apiUrl: '/currencyCodes',
                    bindValue: 'Code',
                    displayFormat: '[Code]',
                }, {
                    type: FormFieldType.DropDown,
                    label: 'limitPeriod',
                    name: 'Limit Period',
                    items: [
                        { value: '', name: '' },
                        { value: 'Monthly', name: 'Monthly' },
                        { value: 'Quarterly', name: 'Quarterly' },
                        { value: 'Yearly', name: 'Yearly' },
                    ],
                    bindLabel: 'name',
                    bindValue: 'value',
                }],
                [{
                    type: FormFieldType.DropDown,
                    name: 'Calender Start Month',
                    label: 'calenderStartMonth',
                    items: [
                        { value: 'January', name: 'January' },
                        { value: 'February', name: 'February' },
                        { value: 'March', name: 'March' },
                        { value: 'April', name: 'April' },
                        { value: 'May', name: 'May' },
                        { value: 'June', name: 'June' },
                        { value: 'July', name: 'July' },
                        { value: 'August', name: 'August' },
                        { value: 'September', name: 'September' },
                        { value: 'October', name: 'October' },
                        { value: 'November', name: 'November' },
                        { value: 'December', name: 'December' },
                    ],
                    bindLabel: 'name',
                    bindValue: 'value',
                }, {
                    type: FormFieldType.DropDown,
                    name: 'Calender End Month',
                    label: 'calenderEndMonth',
                    items: [
                        { value: 'January', name: 'January' },
                        { value: 'February', name: 'February' },
                        { value: 'March', name: 'March' },
                        { value: 'April', name: 'April' },
                        { value: 'May', name: 'May' },
                        { value: 'June', name: 'June' },
                        { value: 'July', name: 'July' },
                        { value: 'August', name: 'August' },
                        { value: 'September', name: 'September' },
                        { value: 'October', name: 'October' },
                        { value: 'November', name: 'November' },
                        { value: 'December', name: 'December' },
                    ],
                    bindLabel: 'name',
                    bindValue: 'value',
                }],
            ]
        },
        {
            title: 'Limits & Rules',
            controls: [
                [{
                    type: FormFieldType.Number,
                    label: 'maxClaimsAmountPerMonth',
                    name: 'Max Claims Amount Per Month / Quarterly / Yearly',
                    decimal: true
                }, {
                    type: FormFieldType.Number,
                    label: 'maxClaimAmountPerLine',
                    name: 'Max Claim Amount Per Line',
                }],
                [{
                    type: FormFieldType.DropDown,
                    label: 'chargeable',
                    name: 'Chargeable',
                    items: [
                        { value: 'Yes', name: 'Yes' },
                        { value: 'No', name: 'No' },
                        { value: 'Optional', name: 'Optional' }
                    ],
                    bindLabel: 'name',
                    bindValue: 'value',
                }, {
                    type: FormFieldType.DropDown,
                    label: 'returnOption',
                    name: 'Return Option',
                    items: [
                        { value: 'Document', name: 'Document' },
                        { value: 'Document Line', name: 'Document Line' },
                        { value: 'Not Applicable', name: 'Not Applicable' }
                    ],
                    bindLabel: 'name',
                    bindValue: 'value',
                }],
                [{
                    type: FormFieldType.TextBox,
                    label: 'maxNoOfReturns',
                    name: 'Maximum No. of Return',
                }, {
                    type: FormFieldType.Checkbox,
                    label: 'enableLimitPeriod',
                    name: 'Enable Limit Period'
                }],
                [{
                    type: FormFieldType.Checkbox,
                    label: 'allowBackdatedClaims',
                    name: 'Allow Backdated Claims'
                }, {
                    type: FormFieldType.Checkbox,
                    label: 'autoPostOnApproval',
                    name: 'Auto Post on Approval'
                }],
                [{
                    type: FormFieldType.Checkbox,
                    label: 'attachmentRequired',
                    name: 'Attachment Required'
                }, {
                    type: FormFieldType.Checkbox,
                    label: 'disableSubmit',
                    name: 'Disable Submit'
                }],
                [{
                    type: FormFieldType.Checkbox,
                    label: 'disableReopen',
                    name: 'Disable Reopen'
                }],
            ]
        },
        {
            title: 'Posting & Journal',
            controls: [
                [{
                    type: FormFieldType.DropDown,
                    label: 'expensesGLAcc',
                    name: 'Expense G/L Account',
                    apiUrl: '/glAccountClaimEntries',
                    bindValue: 'No',
                    displayFormat: '[No] - [Name]'
                }, {
                    type: FormFieldType.DropDown,
                    label: 'defaultPayableAcc',
                    name: 'Default Payable Account No.',
                    apiUrl: '/glAccountClaimEntries',
                    bindValue: 'No',
                    displayFormat: '[No] - [Name]'
                }],
                [{
                    type: FormFieldType.DropDown,
                    label: 'paymentJournalTemplate',
                    name: 'Payment Journal Template',
                    apiUrl: '/genJnlTemplates',
                    bindValue: 'name',
                    displayFormat: '[name]',
                }, {
                    type: FormFieldType.DropDown,
                    label: 'paymentJournalBatch',
                    name: 'Payment Journal Batch',
                }],
            ]
        },
        {
            title: 'No. Series',
            controls: [
                [{
                    type: FormFieldType.DropDown,
                    label: 'empClaimNo',
                    name: 'Employee Claim No. Series',
                    apiUrl: '/noSeries',
                    bindValue: 'code',
                    displayFormat: '[code]',
                }, {
                    type: FormFieldType.DropDown,
                    label: 'reviewBatchNo',
                    name: 'Claim Review Batch No. Series',
                    apiUrl: '/noSeries',
                    bindValue: 'code',
                    displayFormat: '[code]',
                }],
                [{
                    type: FormFieldType.DropDown,
                    label: 'paymentBatchNo',
                    name: 'Claim Payment Batch No. Series',
                    apiUrl: '/noSeries',
                    bindValue: 'code',
                    displayFormat: '[code]',
                }],
            ]
        }
    ]
};

EmployeeClaimSetupConfig.controls = (EmployeeClaimSetupConfig.sections ?? []).flatMap(section => section.controls);
