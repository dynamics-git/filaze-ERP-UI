import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ConfirmationDialogConfig } from '../../models/confirmation-dialog-config.model';

@Component({
  selector: 'erp-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.scss'
})
export class ConfirmationModalComponent implements AfterViewInit {
  @Input() config?: ConfirmationDialogConfig;
  @Output() decided = new EventEmitter<boolean>();

  @ViewChild('confirmButton') private confirmButton?: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.confirmButton?.nativeElement.focus();
    });
  }

  confirm(): void {
    this.decided.emit(true);
  }

  cancel(): void {
    this.decided.emit(false);
  }
}
