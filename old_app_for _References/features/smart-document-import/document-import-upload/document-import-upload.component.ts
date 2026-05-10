import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-document-import-upload',
  templateUrl: './document-import-upload.component.html',
  styleUrls: ['./document-import-upload.component.scss'],
})
export class DocumentImportUploadComponent {
  @Input() uploading = false;
  @Input() selectedFileName = '';
  @Input() targetDocumentType = 'PurchaseRequisition';
  @Output() fileSelected = new EventEmitter<File>();

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;

    if (!file) {
      return;
    }

    this.fileSelected.emit(file);
    input.value = '';
  }
}
