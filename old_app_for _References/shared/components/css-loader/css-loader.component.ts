import { Component, Input, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'css-loader',
  templateUrl: './css-loader.component.html',
  styleUrls: ['./css-loader.component.scss']
})
export class CssLoaderComponent implements OnInit {

  @Input() left: number = 0;

  constructor() { }

  ngOnInit() {
  }

}
