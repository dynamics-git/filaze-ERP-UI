import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { EnumTextCase } from '../../core/models/shared/textCase.enum';


@Directive({
  standalone: true,
  selector: '[uppercase]',
  host: {
    '(input)': '$event'
  }
})
export class UppercaseInputDirective {

  lastValue!: string;
  private _textCase: EnumTextCase = EnumTextCase.Normal;

  @Input() set uppercase(type: EnumTextCase) {
    this._textCase = type;
  }

  constructor(public ref: ElementRef) { }

  @HostListener('input', ['$event']) onInput($event: any) {
    const start = $event.target.selectionStart;
    const end = $event.target.selectionEnd;
    if (this._textCase === EnumTextCase.UpperCase) {
      $event.target.value = $event.target.value.toUpperCase();
    }
    $event.target.setSelectionRange(start, end);
    $event.preventDefault();

    if (!this.lastValue || (this.lastValue && $event.target.value.length > 0 && this.lastValue !== $event.target.value)) {
      this.lastValue = this.ref.nativeElement.value = $event.target.value;
      // Propagation
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', false, true);
      event!.target!.dispatchEvent(evt);
    }
  }
}
