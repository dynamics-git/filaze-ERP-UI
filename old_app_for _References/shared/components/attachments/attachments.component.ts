import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
  FormBuilder
} from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

import { ToastrService } from 'ngx-toastr';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FormField } from '../../../core/models/shared/formField';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

type PreviewType = 'image' | 'pdf' | 'text' | 'excel' | 'word' | 'unsupported' | null;

@Component({
  standalone: false,
  selector: 'app-attachments',
  templateUrl: './attachments.component.html',
  styleUrls: ['./attachments.component.scss']
})
export class AttachmentsComponent implements OnInit, OnChanges, OnDestroy {
  api: string = '/portalDocumentAttachments';
  attachments: any[] = [];
  attachmentFormGroup!: FormGroup;
  isCollapsed = false;

  files: (File | null)[] = [];
  fileAcceptFromats: any =
    '.doc,.docx,.pdf,.xls,.xlsx,.jpeg,.png,.ppt,.pptx,.gif,.zip,.txt,.csv,.json';

  allowedExtensions = [
    'doc', 'docx', 'pdf', 'xls', 'xlsx',
    'jpeg', 'jpg', 'png', 'ppt', 'pptx', 'gif', 'zip',
    'txt', 'csv', 'json'
  ];

  isLoading = false;
  loadingPage = false;
  dropdownOpenKey: string | null = null;
  BCAttachment!: boolean;
  isZipDownloading = false;
  _documentNo: any = {};
  attachmentsLoaded = false;

  @Input() set documentNo(value: string) {
    if (value) {
      this._documentNo = value;
    }
  }

  @Input() documentType!: string;
  @Input() itemConfig!: any;
  @Input() documentID!: any;
  @Input() isDrawer!: any;
  @Input() readonly: boolean = false;
  @Input() documentApi: string | null = null;
  @Input() isWorkflowAttachment: boolean = false;
  /** 0 = document header, >0 = line attachment for that lineNo */
  @Input() recordLineNo: number = 0;
  @Input() sectionTitle: string = 'Documents';
  /** When true, Download All fetches every line attachment (all recordLineNo > 0) */
  @Input() downloadAllLines: boolean = false;
  /** When true, renders a close (×) button in the toolbar to dismiss an NgbModal */
  @Input() inModal: boolean = false;
  /** When true, onSubmit returns selected files to the parent modal instead of uploading */
  @Input() isGEUpload: boolean = false;
  /** When false, hides the Add/Upload button entirely */
  @Input() isShowUploadButton: boolean = true;

  /** Controls whether the Delete button is enabled — read from itemConfig.lineConfig.lineAttachmentDeletePermission */
  showDeletePermission: boolean = true;
  attachmentForm!: FormGroup;
  attachmentsControls: FormField[] = [];

  isUploadModalOpen = false;

  isPreviewOpen = false;
  isPreviewLoading = false;
  previewType: PreviewType = null;
  previewTitle = '';
  previewExtension = '';
  previewDate = '';
  previewText = '';
  previewObjectUrl: string | null = null;
  previewSafeUrl: SafeResourceUrl | null = null;
  previewHtml: SafeHtml = '';
  previewAttachment: any = null;
  previewIndex: number | null = null;

  constructor(
    private restService: RestService,
    private utility: Utility,
    private toastr: ToastrService,
    public sessionService: SessionService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private addItemService: AddItemService,
    private sanitizer: DomSanitizer,
    private dialogService: UnifiedDialogService
  ) { }

  get items(): FormArray {
    return (
      (this.attachmentFormGroup?.get('items') as FormArray) ??
      this.fb.array([])
    );
  }

  get fa(): FormArray {
    return this.attachmentForm.get('attachments') as FormArray;
  }

  get canManageAttachments(): boolean {
    if (!this.isShowUploadButton) return false;  // page-level lock (posted pages) — no one can upload/delete
    return this.sessionService.SuperAdmin || !this.readonly;
  }

  get canDelete(): boolean {
    return this.canManageAttachments && this.showDeletePermission;
  }

  ngOnInit() {
    // Resolve delete permission from lineConfig
    const deletePermission = this.itemConfig?.lineConfig?.lineAttachmentDeletePermission;
    this.showDeletePermission = (deletePermission === undefined || deletePermission === null)
      ? true
      : deletePermission;

    this.attachmentForm = this.fb.group({
      attachments: this.fb.array([this.initDoc()])
    });

    this.files = [null];

    this.restService.get('/portalSetups').subscribe((res: any) => {
      if (res?.value) {
        this.BCAttachment = res.value[0]?.bcAttachment;

        if (this._documentNo) {
          this.getAttachments(this._documentNo);
        }
      }
    });

    if (this.isDrawer) {
      this.isCollapsed = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['recordLineNo'] || changes['documentNo']) && this._documentNo && this.BCAttachment !== undefined) {
      this.getAttachments(this._documentNo);
    }
  }

  ngOnDestroy(): void {
    this.clearPreviewObjectUrl();
  }

  toggleDropdown2(j: number) {
    this.dropdownOpenKey =
      this.dropdownOpenKey === 'uploaded-' + j ? null : 'uploaded-' + j;
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.pr-action-control')) {
      this.dropdownOpenKey = null;
    }
  }

  // getAttachments — removed old hardcoded recordLine=0 version

  getAttachments(documentNo: string): void {
    const recordLine = this.recordLineNo ?? 0;

    this.loadingPage = true;
    this.attachmentsLoaded = false;

    const url =
      `${this.api}?$filter=DocumentType eq '${this.documentType}'` +
      ` and No eq '${this._documentNo}'` +
      ` and recordLineNo eq ${recordLine}`;

    this.restService.get(url).subscribe(
      (res: any) => {
        this.attachments = Array.isArray(res?.value) ? res.value : [];
        this.loadingPage = false;
        this.attachmentsLoaded = true;
        this.cdr.detectChanges();
      },
      () => {
        this.attachments = [];
        this.loadingPage = false;
        this.attachmentsLoaded = true;
        this.cdr.detectChanges();
      }
    );
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getFileType(type: string) {
    if (
      type === 'application/msword' ||
      type === 'vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return 'Word';
    } else if (type === 'application/pdf') {
      return 'PDF';
    } else if (
      type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return 'Excel';
    } else if (
      type === 'application/powerpoint' ||
      type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      return 'PowerPoint';
    } else if (
      type === 'image/jpeg' ||
      type === 'image/x-png' ||
      type === 'image/gif'
    ) {
      return 'Image';
    } else if (
      type === 'text/plain' ||
      type === 'text/csv' ||
      type === 'application/json'
    ) {
      return 'Text';
    }

    return 'Other';
  }

  async deleteAttachment(doc: any, rowIndex: number) {
    this.dropdownOpenKey = null;

    // GE Form attachments are owned by Manage PAX — block deletion with explanation
    if (doc?.gEForm === true) {
      await this.dialogService.message({
        title: 'Cannot Delete GE Form',
        message: 'This attachment is a GE Form linked to a PAX record. To remove it, open Manage PAX and remove it from there.'
      });
      return;
    }

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

    this.restService
      .delete(this.api + '(' + this.attachments[rowIndex].Id + ')')
      .subscribe({
        next: () => {
          this.updateWorkflowDocCount(false);
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
    if (!this.canManageAttachments) {
      return;
    }

    this.isUploadModalOpen = true;
  }

  closeModel() {
    this.isUploadModalOpen = false;
    this.resetForm();
  }

  closeModelPopup() {
    this.activeModal.close();
  }

  close() {
    this.activeModal.dismiss();
  }

  viewDocument(data: any, index: number): void {
    this.dropdownOpenKey = null;
    this.resetPreviewState();

    this.previewAttachment = data;
    this.previewIndex = index;
    this.previewTitle = data?.FileName || 'Document';
    this.previewExtension = this.getAttachmentExtension(data).toUpperCase();
    this.previewDate = this.formatDate(
      data?.AttachedDate || data?.systemCreatedAt || data?.SystemCreatedAt
    );
    this.isPreviewOpen = true;
    this.isPreviewLoading = true;

    const directUrl = (data?.FileUrl || '').trim();
    const mediaReadLink = data?.['Content@odata.mediaReadLink'];
    const extension = this.getAttachmentExtension(data);

    if (directUrl) {
      if (this.isImageExtension(extension)) {
        this.previewType = 'image';
        this.previewObjectUrl = directUrl;
        this.isPreviewLoading = false;
        return;
      }

      if (extension === 'pdf') {
        fetch(directUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error('PDF preview fetch failed');
            }
            return response.blob();
          })
          .then((blob) => {
            const objectUrl = window.URL.createObjectURL(blob);
            this.previewType = 'pdf';
            this.previewObjectUrl = objectUrl;
            this.previewSafeUrl =
              this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
            this.isPreviewLoading = false;
            this.cdr.detectChanges();
          })
          .catch(() => {
            this.previewType = 'unsupported';
            this.isPreviewLoading = false;
            this.toastr.warning('PDF preview is not available. Please download the file.');
            this.cdr.detectChanges();
          });
        return;
      }

      if (this.isTextPreviewExtension(extension)) {
        fetch(directUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error('Preview fetch failed');
            }
            return response.text();
          })
          .then((text) => {
            this.previewType = 'text';
            this.previewText = text;
            this.isPreviewLoading = false;
            this.cdr.detectChanges();
          })
          .catch(() => {
            this.previewType = 'unsupported';
            this.isPreviewLoading = false;
            this.cdr.detectChanges();
          });
        return;
      }

      if (this.isExcelExtension(extension)) {
        fetch(directUrl)
          .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
          .then((blob) => this.renderExcelBlob(blob))
          .catch(() => {
            this.previewType = 'unsupported';
            this.isPreviewLoading = false;
            this.cdr.detectChanges();
          });
        return;
      }

      if (this.isWordExtension(extension)) {
        fetch(directUrl)
          .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
          .then((blob) => this.renderWordBlob(blob))
          .catch(() => {
            this.previewType = 'unsupported';
            this.isPreviewLoading = false;
            this.cdr.detectChanges();
          });
        return;
      }

      this.previewType = 'unsupported';
      this.isPreviewLoading = false;
      return;
    }


    if (mediaReadLink) {
      this.restService.getBinary(mediaReadLink).subscribe({
        next: (fileBlob: Blob) => {
          const blobType = (fileBlob?.type || '').toLowerCase();

          if (this.isImageExtension(extension) || blobType.startsWith('image/')) {
            const imageBlob = fileBlob.type ? fileBlob : new Blob([fileBlob], { type: 'image/*' });
            const objectUrl = window.URL.createObjectURL(imageBlob);

            this.previewType = 'image';
            this.previewObjectUrl = objectUrl;
            this.isPreviewLoading = false;
            this.cdr.detectChanges();
            return;
          }

          if (
            extension === 'pdf' ||
            blobType === 'application/pdf' ||
            blobType.includes('pdf')
          ) {
            const pdfBlob = new Blob([fileBlob], { type: 'application/pdf' });
            const objectUrl = window.URL.createObjectURL(pdfBlob);

            this.previewType = 'pdf';
            this.previewObjectUrl = objectUrl;
            this.previewSafeUrl =
              this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
            this.isPreviewLoading = false;
            this.cdr.detectChanges();
            return;
          }

          if (
            this.isTextPreviewExtension(extension) ||
            blobType.startsWith('text/') ||
            blobType.includes('json')
          ) {
            const reader = new FileReader();
            reader.onload = () => {
              this.previewType = 'text';
              this.previewText = String(reader.result || '');
              this.isPreviewLoading = false;
              this.cdr.detectChanges();
            };
            reader.onerror = () => {
              this.previewType = 'unsupported';
              this.isPreviewLoading = false;
              this.cdr.detectChanges();
            };
            reader.readAsText(fileBlob);
            return;
          }

          if (
            this.isExcelExtension(extension) ||
            blobType.includes('spreadsheet') ||
            blobType.includes('excel')
          ) {
            this.renderExcelBlob(fileBlob).catch(() => {
              this.previewType = 'unsupported';
              this.isPreviewLoading = false;
              this.cdr.detectChanges();
            });
            return;
          }

          if (this.isWordExtension(extension) || blobType.includes('wordprocessingml')) {
            this.renderWordBlob(fileBlob).catch(() => {
              this.previewType = 'unsupported';
              this.isPreviewLoading = false;
              this.cdr.detectChanges();
            });
            return;
          }

          this.previewType = 'unsupported';
          this.isPreviewLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.previewType = 'unsupported';
          this.isPreviewLoading = false;
          this.toastr.error('Preview is not available for this document.');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.previewType = 'unsupported';
    this.isPreviewLoading = false;
  }

  closePreview(): void {
    this.isPreviewOpen = false;
    this.resetPreviewState();
  }

  downloadFromPreview(): void {
    if (this.previewAttachment != null && this.previewIndex != null) {
      this.downloadDocument(this.previewAttachment, this.previewIndex);
    }
  }

  downloadDocument(data: any, index: number) {
    this.dropdownOpenKey = null;

    const fileName = data.FileName || 'document';
    const extension =
      (data.FileExtension || fileName.split('.').pop() || '').toLowerCase();
    const finalName = fileName.endsWith(`.${extension}`)
      ? fileName
      : `${fileName}.${extension}`;

    if (data.FileUrl?.trim()) {
      const documentUrl = this.attachments[index].FileUrl;
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    if (data['Content@odata.mediaReadLink']) {
      const bcUrl = data['Content@odata.mediaReadLink'];

      this.restService.getBinary(bcUrl).subscribe({
        next: (fileBlob: Blob) => {
          const url = window.URL.createObjectURL(fileBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = finalName;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.toastr.error('Failed to download file from Business Central.');
        }
      });
      return;
    }

    this.toastr.error('No valid file link found for this document.');
  }

  initDoc() {
    return this.fb.group({
      file: this.fb.control('', Validators.required),
      type: this.fb.control('')
    });
  }

  addGroup() {
    this.fa.push(this.initDoc());
    this.files.push(null);
  }

  removeGroup(i: number) {
    this.fa.removeAt(i);
    this.files.splice(i, 1);

    if (!this.fa.length) {
      this.addGroup();
    }
  }

  onSubmit(): void {
    if (!this.attachmentForm.valid) {
      this.toastr.warning('Please fill up the form correctly!');
      return;
    }

    const attachments = this.attachmentForm.value.attachments;

    if (!attachments?.length) {
      this.toastr.error('No file(s) selected for upload');
      return;
    }

    // GE Upload mode: return selected files to parent modal without calling API
    if (this.isGEUpload === true) {
      const files = attachments
        .filter((a: any) => a.file)
        .map((a: any) => a.file);

      if (!files.length) {
        this.toastr.error('No valid file selected.');
        return;
      }

      this.activeModal.close({
        action: 'ge-files-selected',
        files: files
      });
      return;
    }

    if (this.BCAttachment === true) {
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
          no: this._documentNo,
          fileName: file.name,
          recordLineNo: this.recordLineNo ?? 0,
          gEForm: false,
          FileExtension: file.name.split('.').pop()?.toUpperCase(),
          AttachedDate: new Date().toISOString()
        };

        this.restService.post('/portalDocumentAttachments', payload).subscribe({
          next: (res: any) => {
            const attachmentId = res.Id;

            if (!attachmentId) {
              this.toastr.error(`Attachment ID missing from response for ${file.name}`);
              uploadCount++;
              if (uploadCount === attachments.length) { this.isLoading = false; }
              return;
            }

            const endpoint = `/portalDocumentAttachments(${attachmentId})/content`;

            this.restService.patchBinary(endpoint, file).subscribe({
              next: () => {
                uploadCount++;
                this.toastr.success(
                  `${file.name} uploaded successfully to Business Central.`
                );

                if (uploadCount === attachments.length) {
                  this.updateWorkflowDocCount(true);
                  this.resetForm();
                  this.getAttachments(this.documentNo);
                  this.isLoading = false;
                  this.closeModel();
                }
              },
              error: () => {
                uploadCount++;
                this.toastr.error(`Failed to upload content for ${file.name}`);

                if (uploadCount === attachments.length) {
                  this.isLoading = false;
                }
              }
            });
          },
          error: () => {
            uploadCount++;
            this.toastr.error(`Failed to create metadata for ${file.name}`);

            if (uploadCount === attachments.length) {
              this.isLoading = false;
            }
          }
        });
      });
    } else {
      const formData = this.attachmentForm.value;
      this.isLoading = true;
      let uploadCount = 0;

      formData.attachments.forEach((item: any, index: number) => {
        this.restService.fileUpload(item.file).subscribe({
          next: (uploadRes: any) => {
            const itemGroup = new FormGroup({
              FileExtension: new FormControl(item.file.name.split('.').pop()),
              FileType: new FormControl(this.getFileType(item.file.type)),
              UserId: new FormControl(this.sessionService.UserId)
            });

            this.items.setControl(index, itemGroup);

            const payload = this.utility.getHeaderControlsData(
              itemGroup.value,
              [this.attachmentsControls]
            );

            payload.FileName = item.file.name;
            payload.FileUrl = uploadRes.file;
            payload.CreatedBy = this.sessionService.UserId;
            payload.UserId = this.sessionService.UserId;
            payload.Company = this.sessionService.CompanyName;
            payload.CompanyId = this.sessionService.Company;
            payload.PortalResponsibilityCentre =
              this.sessionService.ResponsibilityCenterId;
            payload.No = this._documentNo;
            payload.DocumentType = this.documentType;
            payload.AttachedDate = new Date().toISOString();
            payload.DocumentsAttachmentType = item.type || null;

            this.restService.post(this.api, payload).subscribe({
              next: () => {
                uploadCount++;
                this.toastr.success('Document added successfully.');
                this.getAttachments(this.documentNo);

                if (uploadCount === formData.attachments.length) {
                  this.isLoading = false;
                  this.closeModel();
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

    this.fa.at(index).patchValue({
      file: file || ''
    });

    this.files[index] = file;
  }

  resetForm(): void {
    this.attachmentForm.reset();
    this.files = [];

    const attachmentsArray = this.fa;
    while (attachmentsArray.length) {
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

    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !this.allowedExtensions.includes(ext)) {
      this.toastr.error('File not accepted.');
      return;
    }

    if (this.fa.length <= index) {
      this.addGroup();
    }

    this.fa.at(index).patchValue({ file });
    this.files[index] = file;
  }

  updateWorkflowDocCount(isAdd: boolean) {
    if (this.documentType !== 'Invoice') {
      return;
    }

    if (!this.isWorkflowAttachment) {
      const api = this.itemConfig?.headerConfig?.api;
      const idProp = this.itemConfig?.headerConfig?.idProp;
      const docId = this.documentID?.[idProp];

      if (!api || !docId) {
        return;
      }

      this.documentApi = `${api}(${docId})`;
    }

    const ifMatchKey = '*';

    this.restService.get(this.documentApi!).subscribe({
      next: (res: any) => {
        const currentCount = res?.workflowDocCount || 0;
        const newCount = isAdd
          ? currentCount + 1
          : Math.max(currentCount - 1, 0);

        const patchBody = {
          workflowDocCount: newCount
        };

        this.restService.patch(this.documentApi!, patchBody, ifMatchKey).subscribe({
          next: () => {
            this.restService.get(this.documentApi!).subscribe({
              next: () => { },
              error: () => { }
            });
          },
          error: () => { }
        });
      },
      error: () => { }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr || dateStr === '0001-01-01T00:00:00Z') {
      return '';
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return '';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  private getAttachmentExtension(data: any): string {
    const fileName = data?.FileName || '';
    return (
      data?.FileExtension ||
      data?.FileType ||
      fileName.split('.').pop() ||
      ''
    )
      .toString()
      .toLowerCase()
      .trim();
  }

  private isImageExtension(ext: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
  }

  private isTextPreviewExtension(ext: string): boolean {
    return ['txt', 'csv', 'json', 'xml', 'log'].includes(ext);
  }

  private isExcelExtension(ext: string): boolean {
    return ['xlsx', 'xls'].includes(ext);
  }

  private isWordExtension(ext: string): boolean {
    return ['docx'].includes(ext);
  }

  private async renderExcelBlob(blob: Blob): Promise<void> {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_html(firstSheet, { editable: false });
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(raw);
    this.previewType = 'excel';
    this.isPreviewLoading = false;
    this.cdr.detectChanges();
  }

  private async renderWordBlob(blob: Blob): Promise<void> {
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(result.value);
    this.previewType = 'word';
    this.isPreviewLoading = false;
    this.cdr.detectChanges();
  }

  private resetPreviewState(): void {
    this.clearPreviewObjectUrl();
    this.previewType = null;
    this.previewTitle = '';
    this.previewExtension = '';
    this.previewDate = '';
    this.previewText = '';
    this.previewHtml = '';
    this.previewSafeUrl = null;
    this.previewAttachment = null;
    this.previewIndex = null;
    this.isPreviewLoading = false;
  }

  private clearPreviewObjectUrl(): void {
    if (this.previewObjectUrl && this.previewObjectUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(this.previewObjectUrl);
    }
    this.previewObjectUrl = null;
  }



  async downloadAllAsZip(): Promise<void> {
    this.dropdownOpenKey = null;
    this.isZipDownloading = true;

    try {
      let allItems: any[] = this.attachments;

      // For line section: fetch ALL line attachments across every line
      if (this.downloadAllLines) {
        const url = `${this.api}?$filter=DocumentType eq '${this.documentType}' and No eq '${this._documentNo}' and recordLineNo gt 0`;
        const res: any = await firstValueFrom(this.restService.get(url));
        allItems = res?.value ?? [];
      }

      if (!allItems?.length) {
        this.toastr.warning('No attachments found.');
        this.isZipDownloading = false;
        return;
      }

      if (allItems.length === 1) {
        this.isZipDownloading = false;
        this.downloadDocument(allItems[0], 0);
        return;
      }

      const zip = new JSZip();
      const folderName = `${this.documentType}_${this._documentNo}_Attachments`;
      const folder = zip.folder(folderName);

      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];

        if (!item) continue;

        const fileName =
          item.FileName ||
          `Attachment_${i + 1}.${(item.FileExtension || 'bin').toLowerCase()}`;

        try {
          // BC attachment
          if (item['Content@odata.mediaReadLink']) {
            const blob = await firstValueFrom(
              this.restService.getBinary(item['Content@odata.mediaReadLink'])
            );

            if (blob && folder) {
              folder.file(fileName, blob);
            }

            continue;
          }

          // Optional fallback if FileUrl exists
          if (item.FileUrl?.trim()) {
            const response = await fetch(item.FileUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${fileName}`);
            }

            const blob = await response.blob();
            if (folder) {
              folder.file(fileName, blob);
            }
          }
        } catch (fileError) {
          console.error('ZIP skip file:', fileName, fileError);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${folderName}.zip`);
    } catch (error) {
      console.error(error);
      this.toastr.error('Failed to prepare ZIP download.');
    } finally {
      this.isZipDownloading = false;
    }
  }
}