import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { SortDirection, SortEvent } from '../../core/services/models/shared/sort-event.model';

const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };

@Directive({
  standalone: false,
  selector: 'th[sortable]',
  host: {
    '[class.sorting_asc]': 'direction === "asc"',
    '[class.sorting_desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  }
})
export class SortableHeaderDirective {

  @Input() sortable!: string;
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
