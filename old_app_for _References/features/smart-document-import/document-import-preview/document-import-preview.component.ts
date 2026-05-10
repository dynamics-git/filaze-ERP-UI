import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: false,
  selector: 'app-document-import-preview',
  templateUrl: './document-import-preview.component.html',
  styleUrls: ['./document-import-preview.component.scss'],
})
export class DocumentImportPreviewComponent implements OnChanges {
  @Input() fileName = '';
  @Input() fileMimeType = '';
  @Input() previewUrl: string | null = null;
  @Input() sourceFileUrl: string | null = null;
  @Input() isBusy = false;
  @Input() busyLabel = 'Processing document';

  stableOpenUrl: string | null = null;
  safePdfUrl: SafeResourceUrl | null = null;
  safeImageUrl: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['previewUrl'] || changes['sourceFileUrl'] || changes['fileMimeType']) {
      this.updatePreviewState();
    }
  }

  get hasPdfPreview(): boolean {
    return !!this.safePdfUrl;
  }

  get hasImagePreview(): boolean {
    return !!this.safeImageUrl;
  }

  private updatePreviewState(): void {
    const nextUrl = this.previewUrl || this.sourceFileUrl || null;
    if (nextUrl === this.stableOpenUrl) {
      return;
    }

    this.stableOpenUrl = nextUrl;

    const looksLikeImage = this.fileMimeType.startsWith('image/') || this.looksLikeImageUrl(nextUrl);
    if (looksLikeImage) {
      this.safeImageUrl = nextUrl;
      this.safePdfUrl = null;
      return;
    }

    this.safeImageUrl = null;
    const embedUrl = nextUrl ? this.buildPdfViewerUrl(nextUrl) : null;
    this.safePdfUrl = embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  }

  private buildPdfViewerUrl(url: string): string {
    const trimmedUrl = String(url || '').trim();
    if (!trimmedUrl) {
      return '';
    }

    // Keep the URL mostly untouched so browser-native PDF viewers can choose
    // their best-fit behavior; forced fit hashes caused inconsistent rendering.
    if (trimmedUrl.startsWith('blob:')) {
      return trimmedUrl;
    }

    if (trimmedUrl.includes('#')) {
      return trimmedUrl;
    }

    return `${trimmedUrl}#page=1`;
  }

  private looksLikeImageUrl(url: string | null): boolean {
    if (!url) {
      return false;
    }

    return /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url);
  }
}
