import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Editor, Toolbar } from 'ngx-editor';
import { debounceTime, Subject } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements OnInit, OnDestroy {
  @Input() subject: string = '';
  @Input() body: string = '';
  @Input() mode: 'emailEditor' | 'advanceEditor' = 'emailEditor';

  @Output() subjectChange = new EventEmitter<string>();
  @Output() bodyChange = new EventEmitter<string>();

  subjectEditor!: Editor;
  bodyEditor!: Editor;

  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['undo', 'redo'],
  ];

  private saveTrigger = new Subject<string>();

  variableList = [
    'RequesterName',
    'RequesterID',
    'ApproverID',
    'DocumentType',
    'DocumentNo',
    'Amount',
    'Currency',
    'CompanyName'
  ];

  ngOnInit(): void {
    this.subjectEditor = new Editor();
    this.bodyEditor = new Editor();

    this.saveTrigger.pipe(debounceTime(2000)).subscribe((value) => {
      this.bodyChange.emit(value);
    });
  }

  ngOnDestroy(): void {
    this.subjectEditor.destroy();
    this.bodyEditor.destroy();
  }

  onSubjectChange(value: string) {
    this.subject = value;
    this.subjectChange.emit(value);
  }

  onBodyChange(value: string) {
    this.body = value;
    this.bodyChange.emit(value);
    this.saveTrigger.next(value);
  }

  insertVariableToSubject(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) return;

    const variable = `{{${value}}}`;
    const textarea = document.querySelector('.emailSubject') as HTMLTextAreaElement;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      textarea.value = text.slice(0, start) + variable + text.slice(end);
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      this.subject = textarea.value;
      this.onSubjectChange(this.subject);
    }

    (event.target as HTMLSelectElement).value = '';
  }


  insertVariableToBody(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) return;

    const variable = `{{${value}}}`;

    const editorEl = document.querySelector('.ProseMirror');
    if (editorEl) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      if (range) {
        range.deleteContents();
        range.insertNode(document.createTextNode(variable));
        range.setStartAfter(range.endContainer);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }

    this.bodyChange.emit(this.body);
    (event.target as HTMLSelectElement).value = '';
  }


}