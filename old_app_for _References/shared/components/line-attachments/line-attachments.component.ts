import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';

import { FormField } from '../../../core/models/shared/formField';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AddItemService } from '../../../core/services/shared/add-item.service';
import { ItemConfig } from '../../../core/models/shared/item.config';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
@Component({
  standalone: false,
  selector: 'app-line-attachments',
  templateUrl: './line-attachments.component.html',
  styleUrl: './line-attachments.component.scss'
})
export class LineAttachmentsComponent {


  api: string = '/portalDocumentAttachments';
  attachments: any[] = [];
  attachmentslocally: any[] = [];
  //attachmentsControls: FormField[] = AttachmentsControls;
  attachmentsControls: FormField[] = [];
  attachmentFormGroup!: FormGroup;
  update!: boolean;

  selectedFile: File | null = null;
  selectedFiles: File[] = [];
  DocAttachmentTypes: any = [];
  selectedDocType: string = '';
  file: any;
  fileAcceptFromats: any = ".doc,.docx,.pdf,.xls,.xlsx,.jpeg,.png,.ppt,.pptx,.gif,.zip";
  attachmentForm!: FormGroup;
  files: (File | null)[] = [];
  isLoading = false;
  showLineAttachment: boolean = true;
  showLineAttachmentDeletePermission!: boolean;
  BCAttachment!: boolean;
  _documentNo: any = {};

  loader!: boolean;

  @Input() readonly: boolean = false;

  @Input() documentType!: string;
  @Input() documentNo!: string;
  @Input() recordLineNo!: number;
  @Input() documentData!: any;
  @Input() itemConfig!: ItemConfig;
  @Input() isShowUploadButton!: boolean;
  @Input() isGEUpload: boolean = false;
  documentId!: string;


  constructor(private restService: RestService,
    private utility: Utility,
    private toastr: ToastrService,
    public sessionService: SessionService,
    private cdr: ChangeDetectorRef,
    private modal: NgbModal,
    private fb: FormBuilder,
    private addItemService: AddItemService,
    public activeModal: NgbActiveModal,
    private selectedItemService: SelectedItemService,
    private dialogService: UnifiedDialogService
  ) {
  }

  get items(): FormArray {
    return this.attachmentFormGroup?.get('items') as FormArray ?? this.fb.array([]);
  }



  ngOnInit() {

    this.addItemService.refreshDrawerSubpopupData$
      .subscribe(() => {
        this.getAttachments(this.documentNo, this.recordLineNo);
      });

    this.addItemService.popupRefreshLineData$.next(true);
    //this.documentNo = this.documentData[this.itemConfig!.headerConfig!.autoGenerateField!];
    // this.documentNo = this.documentData[this.itemConfig!.informationSectionConfig!.documentNoProp!];   
    console.log("documentNo=", this.documentNo);

    this.documentId = this.documentData[this.itemConfig!.lineConfig!.idProp!];
    this.showLineAttachment = true;

    if (this.isShowUploadButton === undefined || this.isShowUploadButton === null) {
      this.isShowUploadButton = true;
    }

    if (this.itemConfig?.lineConfig?.lineAttachmentDeletePermission === undefined || this.itemConfig?.lineConfig?.lineAttachmentDeletePermission === null) {
      this.showLineAttachmentDeletePermission = true;
    } else {
      this.showLineAttachmentDeletePermission = this.itemConfig?.lineConfig?.lineAttachmentDeletePermission ?? true;
    }

    this.attachmentForm = this.fb.group({
      attachments: this.fb.array([
        this.initDoc()
      ])
    });
    this.fa.valueChanges.subscribe(value => {
    });

    this.restService.get('/portalSetups').subscribe((res: any) => {
      if (res?.value) {
        this.BCAttachment = res.value[0]?.bcAttachment;
        this.getAttachments(this.documentNo, this.recordLineNo);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readonly'] && changes['readonly'].currentValue) {
    }
  }



  getAttachments(documentNo: string, recordLineNo: number) {
    this.loader = true;
    const recordId = this.documentData[this.itemConfig!.lineConfig!.idProp!];
    const getUrl = `${this.api}?$filter=DocumentType eq '${this.documentType}'  and No eq '${this.documentNo}' and recordLineNo eq ${recordLineNo}`;

    this.restService.get(getUrl).subscribe((res: any) => {
      this.loader = false;

      if (res.value && res.value.length > 0) {
        this.attachments = res.value;
      } else {
        this.attachments = [];
      }
      this.cdr.detectChanges();
    }, error => {
      this.loader = false;
      if (this.sessionService.SuperAdmin || !this.readonly) {
        this.attachments = [{}];
      }
      this.cdr.detectChanges();
    });
  }


  getFileType(type: string) {
    if (type === 'application/msword' || type === 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'Word';
    } else if (type === 'application/pdf') {
      return 'PDF';
    } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return 'Excel';
    } else if (type === 'application/powerpoint' || type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return 'PowerPoint';
    } else if (type === 'image/jpeg' || type === 'image/x-png' || type == 'image/gif') {
      return 'Image';
    }

    return 'Other';
  }




  async deleteAttachment(doc: any, rowIndex: number) {
    const confirmed = await this.dialogService.confirm({
      title: 'Confirm',
      message: 'Are you sure you want to delete this item?',
      yesButtonText: 'Yes',
      noButtonText: 'No',
      showAsNotification: false
    });

    if (!confirmed) {
      return;
    }

    this.restService.delete(this.api + '(' + this.attachments[rowIndex].Id + ')').subscribe({
      next: () => {
        this.attachments.splice(rowIndex, 1);
        this.toastr.success('Document deleted successfully.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Failed to delete document');
      }
    });
  }


  openModel() {
    this.showLineAttachment = !this.showLineAttachment;
  }

  closeModel() {
    this.selectedItemService.popupUncheckedLineData$.next(true);
    this.activeModal.close({
      action: 'Close',
      record: null
    });
  }


  dropdownOpenIndex: number | null = null;
  dropdownOpenKey: string | null = null;

  toggleDropdown1(index: number) {
    const key = `inProgress-${index}`;
    this.dropdownOpenKey = this.dropdownOpenKey === key ? null : key;
  }

  toggleDropdown2(index: number) {
    const key = `uploaded-${index}`;
    this.dropdownOpenKey = this.dropdownOpenKey === key ? null : key;
  }


  getDocumentsAttachmentType() {
    this.restService.get('/portalDocAttachmentTypes').subscribe((res: any) => {
      this.DocAttachmentTypes = res.value;
    })
  }

  onSelectChange(): void {
    this.DocAttachmentTypes.find((item: any) => item.Code === this.selectedDocType);
  }


  onFilesSelected1(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
    }
  }
  deleteFromLocal(rowIndex: number) {
    this.attachmentslocally.splice(rowIndex, 1);
  }

  downloadDocument(data: any, index: number) {
    const fileName = data.FileName || 'document';
    const extension = (data.FileExtension || fileName.split('.').pop() || '').toLowerCase();
    const finalName = fileName.endsWith(`.${extension}`) ? fileName : `${fileName}.${extension}`;

    if (data.FileUrl && data.FileUrl.trim() !== "") {
      const documentUrl = this.attachments[index].FileUrl;
      const fileName = this.attachments[index].FileName || 'document';
      const extension = fileName.split('.').pop()?.toLowerCase();

      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf'].includes(extension!)) {
        window.open(documentUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    else if (data["Content@odata.mediaReadLink"]) {
      const bcUrl = data["Content@odata.mediaReadLink"];
      this.restService.getBinary(bcUrl).subscribe({
        next: (fileBlob: Blob) => {
          const url = window.URL.createObjectURL(fileBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = finalName;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error("BC download failed:", err);
          this.toastr.error("Failed to download file from Business Central.");
        }
      });
    }

    else {
      this.toastr.error("No valid file link found for this document.");
    }
  }






  //---------------------------subhankar// 19.05.25----------------

  initDoc() {
    return this.fb.group({
      file: this.fb.control('', Validators.required),
      type: this.fb.control('',),
    });
  }


  get fa(): FormArray {
    return this.attachmentForm.get('attachments') as FormArray;
  }


  addGroup() {
    this.fa.push(this.initDoc());
    this.files.push(null);
  }

  removeGroup(i: number) {
    this.fa.removeAt(i);
    this.files.splice(i, 1);

  }

  // onSubmit(): void {
  //   if (!this.attachmentForm.valid) {
  //     this.toastr.warning(`Please fill up the form correctly!`);
  //     return;
  //   }
  //   const attachments = this.attachmentForm.value.attachments;
  //   if (!attachments || attachments.length === 0) {
  //     this.toastr.error('No file(s) selected for upload');
  //     return;
  //   }

  //   if (this.BCAttachment === true) {
  //     this.loader = true;
  //     let uploadCount = 0;
  //     this.isLoading = true;

  //     attachments.forEach((att: any, index: number) => {
  //       const file: File = att.file;
  //       if (!file) {
  //         this.toastr.error(`Attachment ${index + 1} is missing a file`);
  //         return;
  //       }



  //       const payload = {
  //         documentType: this.documentType,
  //         no: this.documentNo,
  //         fileName: file.name,
  //         recordLineNo: this.recordLineNo,
  //         gEForm: this.isGEUpload === true
  //       };


  //       this.restService.post(`/portalDocumentAttachments`, payload).subscribe({
  //         next: (res: any) => {
  //           const attachmentId = res.Id;
  //           if (!attachmentId) {
  //             this.toastr.error("Attachment ID missing from response.");
  //             return;
  //           }

  //           const endpoint = `/portalDocumentAttachments(${attachmentId})/content`;
  //           this.restService.patchBinary(endpoint, file).subscribe({
  //             next: () => {
  //               uploadCount++;
  //               this.toastr.success(`${file.name} uploaded successfully to Business Central.`);
  //               if (uploadCount === attachments.length) {
  //                 this.loader = false;
  //                 this.isLoading = false;
  //                 this.getAttachments(this.documentNo, this.recordLineNo);
  //                 this.activeModal.close({
  //                   action: 'uploaded',
  //                   record: true
  //                 }); this.addItemService.refreshDrawerSubpopupData$.next(true);
  //               }
  //             },
  //             error: () => {
  //               uploadCount++;
  //               this.toastr.error(`Failed to upload content for ${file.name}`);
  //               if (uploadCount === attachments.length) {
  //                 this.loader = false;
  //                 this.isLoading = false;
  //               }
  //             }
  //           });
  //         },
  //         error: () => {
  //           uploadCount++;
  //           this.toastr.error(`Failed to create attachment metadata for ${file.name}`);
  //           if (uploadCount === attachments.length) {
  //             this.loader = false;
  //             this.isLoading = false;
  //           }
  //         }
  //       });
  //     });
  //   }
  //   else {
  //     let formData = this.attachmentForm.value;
  //     this.isLoading = true;
  //     let uploadCount = 0;

  //     formData.attachments.forEach((item: any, index: number) => {
  //       this.restService.fileUpload(item.file).subscribe({
  //         next: (uploadRes: any) => {
  //           const itemGroup = new FormGroup({
  //             FileExtension: new FormControl(item.file.name.split('.').pop()),
  //             FileType: new FormControl(this.getFileType(item.file.type)),
  //             UserId: new FormControl(this.sessionService.UserId),
  //           });
  //           this.items.setControl(index, itemGroup);

  //           let payload = this.utility.getHeaderControlsData(itemGroup.value, [this.attachmentsControls]);
  //           payload.FileName = item.file.name;
  //           payload.FileUrl = uploadRes?.['@odata.mediaReadLink'] ?? uploadRes.file ?? '';
  //           payload.CreatedBy = this.sessionService.UserId;
  //           payload.UserId = this.sessionService.UserId;
  //           payload.Company = this.sessionService.CompanyName;
  //           payload.CompanyId = this.sessionService.Company;
  //           payload.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenterId;
  //           payload.No = this.documentNo;
  //           payload.DocumentType = this.documentType;
  //           payload.recordLineNo = this.recordLineNo;
  //           payload.DocumentsAttachmentType = item.type;

  //           this.restService.post(this.api, payload).subscribe({
  //             next: () => {
  //               uploadCount++;
  //               this.toastr.success('Document added successfully.');
  //               this.getAttachments(this.documentNo, this.recordLineNo);
  //               if (uploadCount === formData.attachments.length) {
  //                 this.isLoading = false;
  //                 this.closeModel();
  //                 this.addItemService.refreshDrawerSubpopupData$.next(true);
  //               }
  //             },
  //             error: () => {
  //               uploadCount++;
  //               this.toastr.error('Failed to add document');
  //               if (uploadCount === formData.attachments.length) {
  //                 this.isLoading = false;
  //                 this.closeModel();
  //               }
  //             }
  //           });
  //         },
  //         error: () => {
  //           uploadCount++;
  //           this.toastr.error('Failed to upload file');
  //           if (uploadCount === formData.attachments.length) {
  //             this.isLoading = false;
  //             this.closeModel();
  //           }
  //         }
  //       });
  //     });
  //   }
  //   // });
  // }

  onSubmit(): void {

    if (!this.attachmentForm.valid) {
      this.toastr.warning(`Please fill up the form correctly!`);
      return;
    }

    const attachments = this.attachmentForm.value.attachments;

    if (!attachments || attachments.length === 0) {
      this.toastr.error('No file(s) selected for upload');
      return;
    }

    // ============================================================
    // 🔥 GE MODE (Transactional – DO NOT SAVE YET)
    // ============================================================
    if (this.isGEUpload === true) {

      const files = attachments
        .filter((a: any) => a.file)
        .map((a: any) => a.file);

      if (!files || files.length === 0) {
        this.toastr.error('No valid file selected.');
        return;
      }

      // 🚫 DO NOT CALL API
      // Just return files back to ManagePax
      this.activeModal.close({
        action: 'ge-files-selected',
        files: files
      });

      return;
    }

    // ============================================================
    // NORMAL ATTACHMENT LOGIC (UNCHANGED)
    // ============================================================

    if (this.BCAttachment === true) {

      this.loader = true;
      let uploadCount = 0;
      this.isLoading = true;

      attachments.forEach((att: any, index: number) => {

        const file: File = att.file;

        if (!file) {
          this.toastr.error(`Attachment ${index + 1} is missing a file`);
          return;
        }

        const payload = {
          documentType: this.documentType,
          no: this.documentNo,
          fileName: file.name,
          recordLineNo: this.recordLineNo,
          gEForm: false // GE handled separately now
        };

        this.restService.post(`/portalDocumentAttachments`, payload).subscribe({
          next: (res: any) => {

            const attachmentId = res.Id;

            if (!attachmentId) {
              this.toastr.error("Attachment ID missing from response.");
              return;
            }

            const endpoint = `/portalDocumentAttachments(${attachmentId})/content`;

            this.restService.patchBinary(endpoint, file).subscribe({
              next: () => {

                uploadCount++;

                this.toastr.success(`${file.name} uploaded successfully.`);

                if (uploadCount === attachments.length) {

                  this.loader = false;
                  this.isLoading = false;

                  this.getAttachments(this.documentNo, this.recordLineNo);

                  this.activeModal.close({
                    action: 'uploaded',
                    record: true
                  });

                  this.addItemService.refreshDrawerSubpopupData$.next(true);
                }
              },
              error: () => {

                uploadCount++;

                this.toastr.error(`Failed to upload content for ${file.name}`);

                if (uploadCount === attachments.length) {
                  this.loader = false;
                  this.isLoading = false;
                }
              }
            });
          },
          error: () => {

            uploadCount++;

            this.toastr.error(`Failed to create attachment metadata for ${file.name}`);

            if (uploadCount === attachments.length) {
              this.loader = false;
              this.isLoading = false;
            }
          }
        });
      });

    } else {

      // ⬇️ YOUR ORIGINAL NON-BC LOGIC — COMPLETELY UNCHANGED ⬇️

      let formData = this.attachmentForm.value;
      this.isLoading = true;
      let uploadCount = 0;

      formData.attachments.forEach((item: any, index: number) => {

        this.restService.fileUpload(item.file).subscribe({
          next: (uploadRes: any) => {

            const itemGroup = new FormGroup({
              FileExtension: new FormControl(item.file.name.split('.').pop()),
              FileType: new FormControl(this.getFileType(item.file.type)),
              UserId: new FormControl(this.sessionService.UserId),
            });

            this.items.setControl(index, itemGroup);

            let payload = this.utility.getHeaderControlsData(itemGroup.value, [this.attachmentsControls]);

            payload.FileName = item.file.name;
            payload.FileUrl = uploadRes?.['@odata.mediaReadLink'] ?? uploadRes.file ?? '';
            payload.CreatedBy = this.sessionService.UserId;
            payload.UserId = this.sessionService.UserId;
            payload.Company = this.sessionService.CompanyName;
            payload.CompanyId = this.sessionService.Company;
            payload.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenterId;
            payload.No = this.documentNo;
            payload.DocumentType = this.documentType;
            payload.recordLineNo = this.recordLineNo;
            payload.DocumentsAttachmentType = item.type;

            this.restService.post(this.api, payload).subscribe({
              next: () => {

                uploadCount++;
                this.toastr.success('Document added successfully.');

                this.getAttachments(this.documentNo, this.recordLineNo);

                if (uploadCount === formData.attachments.length) {

                  this.isLoading = false;
                  this.closeModel();
                  this.addItemService.refreshDrawerSubpopupData$.next(true);
                }
              },
              error: () => {

                uploadCount++;
                this.toastr.error('Failed to add document');

                if (uploadCount === formData.attachments.length) {
                  this.isLoading = false;
                  this.closeModel();
                }
              }
            });
          },
          error: () => {

            uploadCount++;
            this.toastr.error('Failed to upload file');

            if (uploadCount === formData.attachments.length) {
              this.isLoading = false;
              this.closeModel();
            }
          }
        });
      });
    }
  }




  onFileChange(event: any, index: number): void {
    const file = event.target.files?.[0] || null;

    if (file) {
      this.fa.at(index).patchValue({ file });
    } else {
      this.fa.at(index).patchValue({ file: '' });
    }

    this.files[index] = file;
  }

  resetForm(): void {
    this.attachmentForm.reset();
    this.files = [];

    const attachmentsArray = this.fa;
    while (attachmentsArray.length !== 0) {
      attachmentsArray.removeAt(0);
    }
    this.addGroup();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('dragover');
  }

  onDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('dragover');

    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];

      if (this.fa.length <= index) {
        this.addGroup();
      }

      this.fa.at(index).patchValue({ file });
      this.files[index] = file;
    }
  }


}



