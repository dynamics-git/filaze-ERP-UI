
import { Directive, ElementRef, HostListener, Renderer2, Input } from '@angular/core';
@Directive({
  standalone: true,
selector: '[appResizableColumn]'
})
export class ResizableColumnDirective {
@Input() columnName: string = ''; // Optional: table-cell identifier
private startX = 0;
private startWidth = 0;
private resizing = false;
private readonly minWidth = 96;
private readonly maxWidth = 720;
private readonly storageKeyPrefix = 'column-width-v2-';
constructor(private el: ElementRef, private renderer: Renderer2) {
const resizer = this.renderer.createElement('span');
this.renderer.addClass(resizer, 'resize-handle');
this.renderer.setStyle(resizer, 'position', 'absolute');
this.renderer.setStyle(resizer, 'right', '-6px');
this.renderer.setStyle(resizer, 'top', '0');
this.renderer.setStyle(resizer, 'bottom', '0');
this.renderer.setStyle(resizer, 'width', '12px');
this.renderer.setStyle(resizer, 'cursor', 'col-resize');
this.renderer.setStyle(resizer, 'z-index', '30');
this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
this.renderer.appendChild(this.el.nativeElement, resizer);
// Load saved column width from localStorage
this.loadColumnWidth();
}
@HostListener('mousedown', ['$event'])
onMouseDown(event: MouseEvent) {
const target = event.target as HTMLElement;
if (!target.classList.contains('resize-handle')) {
return;
}
this.resizing = true;
this.startX = event.pageX;
this.startWidth = this.el.nativeElement.offsetWidth;
this.renderer.addClass(this.el.nativeElement, 'resizing');
event.preventDefault();
event.stopPropagation();
}
@HostListener('dblclick', ['$event'])
onDoubleClick(event: MouseEvent) {
const target = event.target as HTMLElement;
if (!target.classList.contains('resize-handle')) {
return;
}
this.autoFitColumn();
event.preventDefault();
event.stopPropagation();
}
@HostListener('document:mousemove', ['$event'])
onMouseMove(event: MouseEvent) {
if (!this.resizing) return;
const delta = event.pageX - this.startX;
const newWidth = this.clampWidth(this.startWidth + delta);
this.applyColumnWidth(newWidth);
event.preventDefault();
}
@HostListener('document:mouseup')
onMouseUp() {
if (!this.resizing) return;
this.resizing = false;
this.renderer.removeClass(this.el.nativeElement, 'resizing');
// Save column width to localStorage when resize ends
this.saveColumnWidth();
}
private autoFitColumn(): void {
const th = this.el.nativeElement as HTMLTableCellElement;
const table = th.closest('table') as HTMLTableElement | null;
if (!table) return;
const columnIndex = th.cellIndex;
if (columnIndex < 0) return;
let maxContentWidth = this.measureCellContentWidth(th);
const rows = Array.from(table.querySelectorAll('tbody tr'));
for (const row of rows) {
const cells = Array.from((row as HTMLTableRowElement).cells);
const cell = cells[columnIndex] as HTMLTableCellElement | undefined;
if (!cell) continue;
const width = this.measureCellContentWidth(cell);
if (width > maxContentWidth) {
maxContentWidth = width;
}
}
const fittedWidth = this.clampWidth(maxContentWidth + 20);
this.applyColumnWidth(fittedWidth);
// Save auto-fitted width
this.saveColumnWidth();
}

private applyColumnWidth(width: number): void {
const th = this.el.nativeElement as HTMLTableCellElement;
const table = th.closest('table') as HTMLTableElement | null;
if (!table) return;
const columnIndex = th.cellIndex;
if (columnIndex < 0) return;
const setWidth = (cell: HTMLElement) => {
this.renderer.setStyle(cell, 'width', `${width}px`);
this.renderer.setStyle(cell, 'min-width', `${width}px`);
this.renderer.setStyle(cell, 'max-width', `${width}px`);
};
setWidth(th);
const headRows = Array.from(table.querySelectorAll('thead tr'));
for (const row of headRows) {
const cell = (row as HTMLTableRowElement).cells[columnIndex] as HTMLElement | undefined;
if (cell) setWidth(cell);
}
const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
for (const row of bodyRows) {
const cell = (row as HTMLTableRowElement).cells[columnIndex] as HTMLElement | undefined;
if (cell) setWidth(cell);
}
}
private measureCellContentWidth(cell: HTMLElement): number {
const clone = cell.cloneNode(true) as HTMLElement;
clone.style.position = 'absolute';
clone.style.visibility = 'hidden';
clone.style.pointerEvents = 'none';
clone.style.height = 'auto';
clone.style.width = 'auto';
clone.style.minWidth = '0';
clone.style.maxWidth = 'none';
clone.style.whiteSpace = 'nowrap';
clone.style.overflow = 'visible';
clone.style.textOverflow = 'clip';
clone.style.padding = getComputedStyle(cell).padding;
clone.style.font = getComputedStyle(cell).font;
clone.style.fontWeight = getComputedStyle(cell).fontWeight;
clone.style.letterSpacing = getComputedStyle(cell).letterSpacing;
clone.style.boxSizing = 'border-box';
document.body.appendChild(clone);
const width = Math.ceil(clone.scrollWidth);
document.body.removeChild(clone);
return width;
}
private clampWidth(width: number): number {
return Math.max(this.minWidth, Math.min(this.maxWidth, width));
}

private getStorageKey(): string {
const th = this.el.nativeElement as HTMLTableCellElement;
const table = th.closest('table') as HTMLTableElement | null;
if (!table) return this.storageKeyPrefix + this.columnName;

const tableId = table.id || table.className || 'table';
const columnIndex = th.cellIndex;
const headerText = th.textContent?.trim() || '';
return `${this.storageKeyPrefix}${tableId}-col${columnIndex}-${headerText}`;
}

private saveColumnWidth(): void {
const th = this.el.nativeElement as HTMLTableCellElement;
const width = th.offsetWidth;
const key = this.getStorageKey();
try {
  localStorage.setItem(key, width.toString());
} catch (e) {
  console.warn('Failed to save column width to localStorage', e);
}
}

private loadColumnWidth(): void {
const key = this.getStorageKey();
try {
  const savedWidth = localStorage.getItem(key);
  if (savedWidth) {
    const width = parseInt(savedWidth, 10);
    if (!isNaN(width)) {
      setTimeout(() => {
        this.applyColumnWidth(this.clampWidth(width));
      }, 0);
    }
  }
} catch (e) {
  console.warn('Failed to load column width from localStorage', e);
}
}
}
 