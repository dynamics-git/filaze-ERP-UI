import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { ErpDocumentPageComponent } from '../document-page/document-page';
import { ErpDocumentPageConfig } from '../../models/document-page-config.model';
import { DocumentDataService } from '../../services/document-data.service';

@Component({
  selector: 'erp-document-container',
  standalone: true,
  imports: [ErpDocumentPageComponent],
  templateUrl: './document-container.html',
  styleUrl: './document-container.scss'
})
export class ErpDocumentContainerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() config?: ErpDocumentPageConfig;
  @Input() documentId?: unknown;
  @Input() fallbackHeaderData?: unknown;
  @Input() fallbackLineData: unknown[] = [];
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  loading = false;
  error?: string;
  headerData?: unknown;
  lineData: unknown[] = [];

  private loadSubscription?: Subscription;

  constructor(private readonly documentData: DocumentDataService) {}

  ngOnInit(): void {
    this.loadDocument();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['documentId'] || changes['fallbackHeaderData'] || changes['fallbackLineData']) {
      this.loadDocument();
    }
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }

  emitCommand(event: { actionKey: string; payload?: unknown }): void {
    this.command.emit(event);
  }

  private loadDocument(): void {
    this.loadSubscription?.unsubscribe();

    if (!this.config) {
      this.loading = false;
      this.error = undefined;
      this.headerData = undefined;
      this.lineData = [];
      return;
    }

    this.loading = true;
    this.error = undefined;

    if (this.applyFallbackData()) {
      this.loading = false;
    }

    this.loadSubscription = this.documentData.loadDocument(this.config, this.documentId).subscribe({
      next: (data) => {
        this.headerData = data.header;
        this.lineData = data.lines;
        this.loading = false;
      },
      error: (error: unknown) => {
        if (this.applyFallbackData()) {
          this.error = undefined;
          this.loading = false;
          return;
        }

        this.error = this.getErrorMessage(error);
        this.headerData = undefined;
        this.lineData = [];
        this.loading = false;
      }
    });
  }

  private applyFallbackData(): boolean {
    if (!this.hasFallbackData()) {
      return false;
    }

    this.headerData = this.fallbackHeaderData;
    this.lineData = this.fallbackLineData;

    return true;
  }

  private hasFallbackData(): boolean {
    return this.fallbackHeaderData !== undefined || this.fallbackLineData.length > 0;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unable to load ERP document data';
  }
}
