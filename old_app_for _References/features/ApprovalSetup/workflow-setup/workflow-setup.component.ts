import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { DataTableConfig } from "../../../core/models/shared/dataTableConfig";
import { SubPopupWorkflowSetupLine, WorkflowAmtSetupLine, WorkflowSetupHeader } from "./workflow-setup.config";
import { EventDataModel, SectionType } from "../../../core/models/shared/eventDataModel";
import { RestService } from "../../../core/services/rest.service";
import { FormDataService } from "../../../core/services/shared/form-data.service";
import { AddItemService } from "../../../core/services/shared/add-item.service";
import { FormFieldService } from "../../../core/services/shared/form-field.service";
import { FormDataModel } from "../../../core/models/shared/formDataModel";
import { SelectedItemService } from "../../../core/services/shared/selected-item.service";
import { Router } from "@angular/router";
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
    selector: 'app-workflow-setup',
    template: '<app-data-table *ngIf="config" [config]="config"  (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (leaveEvent)="leaveEvent($event)"></app-data-table>'
})
export class WorkflowSetupComponent implements OnInit {
    chartAccountData: any;
    portalUsers: any;
    approvalGroups: any;
    portalUsers1: any;
    approvalGroups1: any;
    recurringNonRecurringWorkflow!: boolean;
    isWorkflowAmountSteps!: boolean


    constructor(private restService: RestService, private formDataService: FormDataService, private addItemService: AddItemService, private formFielService: FormFieldService, private selectedItemService: SelectedItemService, private router: Router, private cdr: ChangeDetectorRef, private toastr: ToastrService,
    ) { }

    config: DataTableConfig | null = {
        title: 'Workflow Setup',
        idProp: 'id',
        headerApi: '/workflowHeaders',
        pageName: 'WORKFLOW SETUP',
        headerApiOrderByField: 'code',
        showCopy: false,
        headers: [{
            name: 'Code',
            prop: 'code',
            isPrimaryLink: true
        }, {
            name: 'Document Type',
            prop: 'documentType'
        }, {
            name: 'Enabled',
            prop: 'isEnabled',
            isBoolean: true
        },
        { name: 'Invoice Type', prop: 'invoiceType' }, {
            name: 'variation Order',
            prop: 'variationOrder',
            isBoolean: true
        },
        {
            name: 'Review Type',
            prop: 'reviewType',
        }],
        selctionType: 'single',
        addItemConfig: {
            title: 'Workflow Setup',
            recordId: "code",
            recordTitle: "code",
            headerConfig: WorkflowSetupHeader,
            lineConfig: WorkflowAmtSetupLine,
            subPopupHeaderConfig: WorkflowSetupHeader,
            subPopupLineConfig: SubPopupWorkflowSetupLine,
            hideSubPopupHeader: true,
        },
        removeUnicodeCharFields: ['documentType']
    };






    ngOnInit() {
        this.restService.get('/portalSetups').subscribe({
            next: (response: any) => {
                const firstData = response?.value[0];
                this.recurringNonRecurringWorkflow = firstData.recurrNonRecurrWorkflow;
                this.isWorkflowAmountSteps = firstData.recurrNonRecurrWorkflow;
            },
            error: () => {
                console.log('Unable to find the item');
            },
        });
    }




    popupLoaded(data: any) {

        // if (data.header.invoiceType === "Default") {
        //     this.formDataService.hideControlsList$.next(['requestAmountApprovalLimit', 'unlimitedRequestApproval']);
        // }

        if (data.header.documentType == 'Employee Claim') {
            let claimType = [
                { value: 'Default', name: 'Default' },
                { value: 'Due Claim', name: 'Due Claim' }
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: claimType, displayFormat: ' [name]', bindValue: 'value', });
        } else if (data.header.documentType == 'Invoice') {
            let invoiceType = [
                { value: 'Default', name: 'Default' },
                { value: 'Recurring', name: 'Recurring' },
                { value: 'Non-Recurring', name: 'Non-Recurring', }
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: invoiceType, displayFormat: ' [name]', bindValue: 'value', });
        } else if (data.header.documentType == 'Order') {
            let orderType = [
                { value: 'Default', name: 'Default' },
                { value: 'Variation Order', name: 'Variation Order' }
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: orderType, displayFormat: ' [name]', bindValue: 'value', });
        } else {
            let PROJECT = [
                { value: 'Default', name: 'Default' },
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: PROJECT, displayFormat: ' [name]', bindValue: 'value', });
        }


        this.addItemService.disableAllControlsExceptSomeForSubPopup$.next([
            "Line_sequenceNo",
            "Line_approverType",
            "Line_approverId",
            "Line_requestAmountApprovalLimit",
            "Line_unlimitedRequestApproval",
            "Line_note",
            "Line_gmd",
            "Line_igp",
            "Line_workflowDocRequired",
            "Line_department",
        ]);

        const lineData = data.line;
        if (!lineData) return;

        const loadPortalUsers = () => {
            return this.restService.get('/portalUsers').toPromise().then((response: any) => {
                this.portalUsers1 = response.value.map((u: any) => ({
                    ...u,
                    Code: u.UserId,
                    displayValue: u.UserId
                }));
                return this.portalUsers1;
            });
        };

        const loadApprovalGroups = () => {
            return this.restService.get('/approvalGroups').toPromise().then((response: any) => {
                this.approvalGroups1 = response.value.map((g: any) => ({
                    ...g,
                    displayValue: g.Code
                }));
                return this.approvalGroups1;
            });
        };

        Promise.all([
            this.portalUsers1 ? Promise.resolve(this.portalUsers1) : loadPortalUsers(),
            this.approvalGroups1 ? Promise.resolve(this.approvalGroups1) : loadApprovalGroups()
        ]).then(([portalUsers, approvalGroups]) => {

            lineData.forEach((line: any, rowIndex: number) => {

                if (line.initiatorType === "User") {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'workflowUserID',
                        items: portalUsers,
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex
                    });

                    setTimeout(() => {
                        this.formDataService.updateLineControlData$.next({
                            control: 'workflowUserID',
                            data: line.workflowUserID,
                            rowIndex
                        });
                    }, 100);
                }

                if (line.initiatorType === "Group") {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'workflowUserID',
                        items: approvalGroups,
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex
                    });

                    setTimeout(() => {
                        this.formDataService.updateLineControlData$.next({
                            control: 'workflowUserID',
                            data: line.workflowUserID,
                            rowIndex
                        });
                    }, 100);
                }

                if (line.approverType === "User") {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'approverId',
                        items: portalUsers,
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex
                    });

                    setTimeout(() => {
                        this.formDataService.updateLineControlData$.next({
                            control: 'approverId',
                            data: line.approverId,
                            rowIndex
                        });
                    }, 100);
                }

                if (line.approverType === "Group") {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'approverId',
                        items: approvalGroups,
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex
                    });

                    setTimeout(() => {
                        this.formDataService.updateLineControlData$.next({
                            control: 'approverId',
                            data: line.approverId,
                            rowIndex
                        });
                    }, 100);
                }

                if (line.approvalType === 'Sequential') {
                    this.addItemService.showOnSequentialButton$.next({ show: true, rowIndex });
                    this.addItemService.showOnParallelButton$.next({ show: false, rowIndex });
                } else if (line.approvalType === 'Parallel') {
                    this.addItemService.showOnParallelButton$.next({ show: true, rowIndex });
                    this.addItemService.showOnSequentialButton$.next({ show: false, rowIndex });
                }
            });
        });
    }






    changeEvent(data: EventDataModel) {
        if (data.section == SectionType.Line) {
            switch (data.control) {
                case 'initiatorType':
                    this.changeInitiatorType(data);
                    break;
                case 'approverType':
                    this.changeApproverType(data);
                    break;
                case 'ApproverID':
                    this.changeEmail(data);
                    break;
            }
        }

        switch (data.control) {
            case 'sequenceNo':
                this.updateWorkflowData(data);
                break;
            case 'documentType':
                this.documentType(data);
                break;
            // case 'invoiceType':
            //     this.updateInvoiceType(data);
            //     break
        }
    }

    changeEmail(data: EventDataModel) {
        this.restService.get('/portalUsers').subscribe((response: any) => {
            if (response) {
                setTimeout(() => {
                    this.chartAccountData = response.value;
                    const matchedUser = this.chartAccountData.find((user: any) => user.UserId == data.data);
                    this.formDataService.updateLineControlData$.next({ control: 'EMail', data: matchedUser?.Email, rowIndex: data.rowIndex, eventEmit: true });
                }, 100)
            }
        });
    }


    addLineDocumentNumber(data: EventDataModel) {
        let doc = data.headerData.documentType;
        //this.formDataService.updateLineControlData$.next({ control: 'documentType', data: doc, rowIndex: data.rowIndex, eventEmit: true });
        this.addItemService.patchLineData$.next({
            rowIndex: data.rowIndex!, data: {
                documentType: doc
            }, disableControls: false
        });
    }


    changeInitiatorType(data: EventDataModel) {
        switch (data.data) {
            case 'User':
                this.formDataService.updateLineControlData$.next({
                    control: 'workflowUserID',
                    data: '',
                    rowIndex: data.rowIndex,
                });

                if (this.portalUsers1) {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'workflowUserID',
                        items: this.portalUsers1,             // ✅ use correct list
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex: data.rowIndex,
                    });
                } else {
                    this.addItemService.showLoader$.next(true);
                    this.restService.get('/portalUsers').subscribe((response: any) => {
                        // ✅ Normalize user data
                        this.portalUsers1 = response.value.map((u: any) => ({
                            ...u,
                            Code: u.UserId,
                            displayValue: u.UserId,
                        }));
                        this.addItemService.showLoader$.next(false);
                        this.formFielService.updateDropdownItem$.next({
                            label: 'workflowUserID',
                            items: this.portalUsers1,
                            displayFormat: '[displayValue]',
                            bindValue: 'Code',
                            bindLabel: 'displayValue',
                            rowIndex: data.rowIndex,
                        });
                    });
                }
                break;

            case 'Group':
                this.formDataService.updateLineControlData$.next({
                    control: 'workflowUserID',
                    data: '',
                    rowIndex: data.rowIndex,
                });

                if (this.approvalGroups1) {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'workflowUserID',
                        items: this.approvalGroups1,          // ✅ use correct list
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex: data.rowIndex,
                    });
                } else {
                    this.addItemService.showLoader$.next(true);
                    this.restService.get('/approvalGroups').subscribe((response: any) => {
                        // ✅ Normalize group data
                        this.approvalGroups1 = response.value.map((g: any) => ({
                            ...g,
                            displayValue: g.Code,
                        }));
                        this.addItemService.showLoader$.next(false);
                        this.formFielService.updateDropdownItem$.next({
                            label: 'workflowUserID',
                            items: this.approvalGroups1,
                            displayFormat: '[displayValue]',
                            bindValue: 'Code',
                            bindLabel: 'displayValue',
                            rowIndex: data.rowIndex,
                        });
                    });
                }
                break;
        }
    }


    changeApproverType(data: EventDataModel) {
        switch (data.data) {
            case 'User':
                this.formDataService.updateLineControlData$.next({
                    control: 'approverId',
                    data: '',
                    rowIndex: data.rowIndex,
                });

                if (this.portalUsers1) {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'approverId',
                        items: this.portalUsers1,              // ✅ correct array
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex: data.rowIndex,
                    });
                } else {
                    this.addItemService.showLoader$.next(true);
                    this.restService.get('/portalUsers').subscribe((response: any) => {
                        this.portalUsers1 = response.value.map((u: any) => ({
                            ...u,
                            Code: u.UserId,
                            displayValue: u.UserId,
                        }));
                        this.addItemService.showLoader$.next(false);
                        this.formFielService.updateDropdownItem$.next({
                            label: 'approverId',
                            items: this.portalUsers1,
                            displayFormat: '[displayValue]',
                            bindValue: 'Code',
                            bindLabel: 'displayValue',
                            rowIndex: data.rowIndex,
                        });
                    });
                }
                break;

            case 'Group':
                this.formDataService.updateLineControlData$.next({
                    control: 'approverId',
                    data: '',
                    rowIndex: data.rowIndex,
                });

                if (this.approvalGroups1) {
                    this.formFielService.updateDropdownItem$.next({
                        label: 'approverId',
                        items: this.approvalGroups1,
                        displayFormat: '[displayValue]',
                        bindValue: 'Code',
                        bindLabel: 'displayValue',
                        rowIndex: data.rowIndex,
                    });
                } else {
                    this.addItemService.showLoader$.next(true);
                    this.restService.get('/approvalGroups').subscribe((response: any) => {
                        this.approvalGroups1 = response.value.map((g: any) => ({
                            ...g,
                            displayValue: g.Code,
                        }));
                        this.addItemService.showLoader$.next(false);
                        this.formFielService.updateDropdownItem$.next({
                            label: 'approverId',
                            items: this.approvalGroups1,
                            displayFormat: '[displayValue]',
                            bindValue: 'Code',
                            bindLabel: 'displayValue',
                            rowIndex: data.rowIndex,
                        });
                    });
                }
                break;
        }
    }



    updateWorkflowData(data: FormDataModel) {
        const payload = this.selectedItemService.popupData;
        if (!payload) {
            return;
        }


        const { approvalType, initiatorType, workflowUserID, codeNo } = payload;

        this.formDataService.updateLineControlDataForSubPopup$.next({
            control: 'approvalType',
            data: approvalType,
            rowIndex: data.rowIndex,
            eventEmit: true,
        });

        this.formDataService.updateLineControlDataForSubPopup$.next({
            control: 'initiatorType',
            data: initiatorType,
            rowIndex: data.rowIndex,
            eventEmit: true,
        });

        this.formDataService.updateLineControlDataForSubPopup$.next({
            control: 'workflowUserId',
            data: workflowUserID,
            rowIndex: data.rowIndex,
            eventEmit: true,
        });

        const checkApi = `/workflowLines?$filter=codeNo eq '${codeNo}' and workflowUserID eq '${workflowUserID}' and approvalType eq '${approvalType}'`;

        this.restService.get(checkApi).subscribe({
            next: (checkRes: any) => {
                const existing = checkRes?.value || [];

                if (existing.length > 0) {
                    return;
                }
            },
            error: (err) => {
            }
        });
    }


    leaveEvent(data: FormDataModel) {
        if (data.section == SectionType.Line) {
            if (data.control === 'sequenceNo') {
            }
        }
    }


    updateInvoiceType(data: EventDataModel) {
        if (this.recurringNonRecurringWorkflow) {
            console.log("def data=", data);
            if (data.data == "Default") {
                this.toastr.warning("Wrong Document Type selected. Please not select 'Default' document type.");
                this.formDataService.updateControlData$.next({
                    control: 'invoiceType',
                    data: 'Recurring',
                    eventEmit: true
                });
            }
        } else {
            if (data.data !== "Default") {
                this.toastr.warning("Wrong Document Type selected. Please select 'Default' document type.");
                this.formDataService.updateControlData$.next({
                    control: 'invoiceType',
                    data: 'Default',
                    eventEmit: true
                });
            }
        }
    }


    documentType(data: EventDataModel) {
        if (data.data == 'Employee Claim') {
            let claimType = [
                { value: 'Default', name: 'Default' },
                { value: 'Due Claim', name: 'Due Claim' }
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: claimType, displayFormat: ' [name]', bindValue: 'value', });
        } else if (data.data == 'Invoice') {
            let invoiceType = [
                { value: 'Default', name: 'Default' },
                { value: 'Recurring', name: 'Recurring' },
                { value: 'Non-Recurring', name: 'Non-Recurring', }
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: invoiceType, displayFormat: ' [name]', bindValue: 'value', });
        } else if (data.data == 'Order') {
            let orderType = [
                { value: 'Default', name: 'Default' },
                { value: 'Variation Order', name: 'Variation Order' }
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: orderType, displayFormat: ' [name]', bindValue: 'value', });
        } else {
            let PROJECT = [
                { value: 'Default', name: 'Default' },
            ]
            this.formFielService.updateDropdownItem$.next({ label: 'invoiceType', items: PROJECT, displayFormat: ' [name]', bindValue: 'value', });
        }

    }



}