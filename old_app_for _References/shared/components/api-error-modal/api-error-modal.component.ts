import { Component, Input, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-api-error-modal',
  templateUrl: './api-error-modal.component.html',
  styleUrls: ['./api-error-modal.component.scss']
})
export class ApiErrorModalComponent implements OnInit {
  @Input() errorMessage!: string ;

  constructor() {
  }

  ngOnInit() {
  }

  reloadWindow() {
    window.location.reload();
  }
}
