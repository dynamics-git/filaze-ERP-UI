import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { DocumentImportHeaderReviewComponent } from './document-import-header-review/document-import-header-review.component';
import { DocumentImportLineReviewComponent } from './document-import-line-review/document-import-line-review.component';
import { DocumentImportPreviewComponent } from './document-import-preview/document-import-preview.component';
import { DocumentImportUploadComponent } from './document-import-upload/document-import-upload.component';
import { SmartImportDraftWorkspaceComponent } from './smart-import-draft-workspace.component';
import { SmartImportDraftsListComponent } from './smart-import-drafts-list.component';
import { SmartDocumentImportRoutingModule } from './smart-document-import-routing.module';
import { SmartDocumentImportComponent } from './smart-document-import.component';

@NgModule({
  declarations: [
    SmartDocumentImportComponent,
    SmartImportDraftsListComponent,
    SmartImportDraftWorkspaceComponent,
    DocumentImportUploadComponent,
    DocumentImportPreviewComponent,
    DocumentImportHeaderReviewComponent,
    DocumentImportLineReviewComponent,
  ],
  imports: [CommonModule, FormsModule, SharedModule, SmartDocumentImportRoutingModule],
})
export class SmartDocumentImportModule {}
