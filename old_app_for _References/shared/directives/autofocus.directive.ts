import { Directive, ElementRef, Renderer2, Input, AfterViewInit } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[autofocus]'
})
export class AutofocusDirective implements AfterViewInit {

  private _autofocus: boolean = false;
  constructor(private el: ElementRef) {
  }

  ngAfterViewInit() {
    if (this._autofocus || typeof this._autofocus === "undefined") {
      this.el.nativeElement.focus();
    }
  }
  
  @Input() set autofocus(condition: boolean) {
    this._autofocus = condition === true;
  }
}


//👉 When the popup/page opens

// 👉 The cursor automatically goes into that field
// 👉 User can start typing immediately
// {
//   type: FormFieldType.TextBox,
//   label: 'VendorInvoiceNumber',
//   name: 'Vendor Invoice No',
//   autofocus: true
// }