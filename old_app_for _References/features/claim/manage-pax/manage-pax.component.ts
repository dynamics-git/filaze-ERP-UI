
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AttachmentsComponent } from '../../../shared/components/attachments/attachments.component';
import { RestService } from '../../../core/services/rest.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
@Component({
  standalone: false,
    selector: 'app-manage-pax',
    templateUrl: './manage-pax.component.html'
})
export class ManagePaxComponent {
    @Input() amount: number = 0;
    @Input() paxLimit: number = 0;
    @Input() noOfPAX: number = 0;
    @Input() recordLineNo!: number;
    @Input() documentNo!: string;
    @Input() documentType!: string;
    @Input() documentData!: any;
    @Input() itemConfig!: any;
    loading: boolean = false;
    paxValue: number = 0;
    exceedsLimit: boolean = false;
    errorMessage: string = '';
    geAttachments: any[] = [];
    pendingGEFiles: File[] = [];
    constructor(
        public activeModal: NgbActiveModal,
        private modalService: NgbModal,
        private restService: RestService,
        private addItemService: AddItemService
    ) { }
    ngOnInit() {
        this.calculate();
        this.loadGEAttachments();
    }
    calculate() {
        if (!this.noOfPAX || !this.amount) {
            this.paxValue = 0;
            this.exceedsLimit = false;
            return;
        }
        this.paxValue = +(this.amount / this.noOfPAX).toFixed(2);
        this.exceedsLimit = this.paxLimit > 0 && this.paxValue > this.paxLimit;
    }

    confirm() {
        this.loading = true;
        const closeModal = (enabled: boolean) => {
            this.activeModal.close({
                noOfPAX: this.noOfPAX || 0,
                paxValue: this.paxValue || 0,
                paxEnabled: enabled
            });
            this.addItemService.refreshDrawerSubpopupData$.next(true);
            this.loading = false;
        };
        // Helper: delete all GE attachments safely
        const deleteExistingGE = () => {
            if (!this.geAttachments || this.geAttachments.length === 0) {
                return Promise.resolve();
            }
            const deleteCalls = this.geAttachments.map(doc =>
                this.restService
                    .delete(`/portalDocumentAttachments(${doc.Id})`)
                    .toPromise()
                    .catch(() => null) // prevent break on single failure
            );
            this.loading = false;
            return Promise.all(deleteCalls).then(() => {
                this.geAttachments = [];
            });
        };
        // ────────────────────────────────
        // Case 1: PAX = 0 → reset + delete GE
        // ────────────────────────────────
        if (!this.noOfPAX || this.noOfPAX <= 0) {
            deleteExistingGE().then(() => {
                closeModal(false);
            });
            this.loading = false;
            return;
        }
        // ────────────────────────────────
        // Case 2: Exceeds limit → require GE
        // ────────────────────────────────
        if (this.exceedsLimit) {
             this.loading = false;
            const hasPending = this.pendingGEFiles && this.pendingGEFiles.length > 0;
            const hasExisting = this.geAttachments && this.geAttachments.length > 0;
            if (!hasPending && !hasExisting) {
                this.errorMessage = 'GE Form is required before confirming.';
                return;
            }
           
            // If new files selected → upload them
            if (hasPending) {
                this.uploadPendingGEFiles();
                return;
            }
            // If GE already exists → just close
            closeModal(true);

            return;
        }


        // ────────────────────────────────
        // Case 3: Within limit → delete old GE if exists
        // ────────────────────────────────
        deleteExistingGE().then(() => {
            closeModal(this.paxValue > 0);
            this.loading = false;
        });
    }
    cancel() {
        this.pendingGEFiles = [];
        this.activeModal.dismiss();
    }
    uploadGEForm() {
        const modalRef = this.modalService.open(AttachmentsComponent, {
            size: 'lg',
            backdrop: 'static'
        });
        modalRef.componentInstance.documentNo = this.documentNo;
        modalRef.componentInstance.documentType = this.documentType;
        modalRef.componentInstance.recordLineNo = this.recordLineNo;
        modalRef.componentInstance.itemConfig = this.itemConfig;
        modalRef.componentInstance.isGEUpload = true;
        modalRef.componentInstance.inModal = true;
        modalRef.result.then((res: any) => {
            if (res?.action === 'ge-files-selected') {
                this.pendingGEFiles = res.files || [];
            }
        }).catch(() => {
            // dismissed — do nothing
        });
    }
    loadGEAttachments() {
        const filter =
            `/portalDocumentAttachments?$filter=DocumentType eq '${this.documentType}' and No eq '${this.documentNo}' and recordLineNo eq ${this.recordLineNo} and gEForm eq true`;
        this.restService.get(filter).subscribe((res: any) => {
            this.geAttachments = res?.value || [];
        });
    }
    uploadPendingGEFiles() {
        let uploadCount = 0;
        this.pendingGEFiles.forEach((file: File) => {
            const payload = {
                documentType: this.documentType,
                no: this.documentNo,
                fileName: file.name,
                recordLineNo: this.recordLineNo,
                gEForm: true
            };
            this.restService.post(`/portalDocumentAttachments`, payload)
                .subscribe({
                    next: (res: any) => {
                        const attachmentId = res?.Id;
                        if (!attachmentId) {
                            this.errorMessage = 'Attachment creation failed.';
                            return;
                        }
                        const endpoint = `/portalDocumentAttachments(${attachmentId})/content`;
                        this.restService.patchBinary(endpoint, file)
                            .subscribe({
                                next: () => {
                                    uploadCount++;
                                    if (uploadCount === this.pendingGEFiles.length) {
                                        // After all uploaded → close modal
                                        this.activeModal.close({
                                            noOfPAX: this.noOfPAX,
                                            paxValue: this.paxValue,
                                            paxEnabled: true
                                        });
                                        this.addItemService.refreshDrawerSubpopupData$.next(true);
                                        this.loading = false;
                                    }
                                },
                                error: () => {
                                    this.errorMessage = 'File upload failed.';
                                }
                            });
                    },
                    error: () => {
                        this.errorMessage = 'Attachment metadata creation failed.';
                    }
                });
        });
    }
    deleteGEAttachment(doc: any, index: number) {
        this.restService.delete(`/portalDocumentAttachments(${doc.Id})`)
            .subscribe(() => {
                this.geAttachments.splice(index, 1);
            });
    }
    removePendingFile(index: number) {
        this.pendingGEFiles.splice(index, 1);
    }
}
