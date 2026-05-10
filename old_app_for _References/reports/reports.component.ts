import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {

  onApplyFilter(filters: any) {
  console.log('PAGE RECEIVED', filters);
}


}
