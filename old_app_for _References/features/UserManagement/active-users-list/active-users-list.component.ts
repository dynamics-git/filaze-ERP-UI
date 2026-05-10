import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RestService } from '../../../core/services/rest.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-active-users-list',
  templateUrl: './active-users-list.component.html',
  styleUrls: ['./active-users-list.component.scss']
})
export class ActiveUsersListComponent implements OnInit {
  ActiveUser: any[] = [];
  colomnValueAll: any[] = [];
  colomnNameDrop: any[] = [];
  loading!: boolean;

  constructor(
    private restService: RestService,
    private httpclient: HttpClient,
  ) { }

  ngOnInit() {
    this.loading = true;
    this.httpclient.get(environment.lisenceApiCore + 'GetAllCurrentSession', this.httpOptions).subscribe((response: any) => {
      if (!response.hasError) {
        this.ActiveUser = response.data;
        if (this.ActiveUser.length) {
          this.colomnValueAll = Object.keys(this.ActiveUser[0]);
          this.colomnNameDrop = Object.keys(this.ActiveUser[0]);
        }

        this.loading = false;
      }
    }, error => {
      this.loading = false;
    });
  }

  get httpOptions() {
    return {
      headers: new HttpHeaders(
        {
          'apiKey': environment.licenseCheckToken,
        })
    };
  }
}
