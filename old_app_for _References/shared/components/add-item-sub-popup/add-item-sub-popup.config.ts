import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const AddItemSubPopupsConfigHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/purchaseRequisitionHeaders',
    title: 'Purchase Requisition',
    autoGenerateField: 'Number',

    controls: [
        [{ type: FormFieldType.TextBox, label: 'Number', name: 'Purchase Requisition No1', },
        { type: FormFieldType.TextBox, label: 'ApprovalStatus', name: 'Approval Status', }],

        [{ type: FormFieldType.DateTime, label: 'RequisitionDate', name: 'Requisition Date', },
        { type: FormFieldType.TextBox, label: 'DocumentType', name: 'Document Type', }],

        [{ type: FormFieldType.TextBox, label: 'BudgetName', name: 'Budget Name', }]
    ]
}




export const AddItemSubPopupsConfig: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'Number',
    lineFKProp: 'PurchaseRequisitionNumber',
    api: '/purchseRequisitionLines',
    includeHeaderId: true,
    controls: [
        {
            type: FormFieldType.DateTime,
            label: 'Number',
            name: 'No',

        },
    ]
}

