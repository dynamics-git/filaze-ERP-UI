import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { RestService } from '../../../core/services/rest.service';
import { SessionService } from '../../../core/services/session.service';
import { SelectResCenterModalComponent } from '../../../shared/components/select-res-center-modal/select-res-center-modal.component';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  // initial center position for the map
  lat: number = 51.673858;
  lng: number = 7.815982;
  zoom: number = 10;
  // markers: marker[] = [];

  constructor(
    private modal: NgbModal,
    private toastr: ToastrService,
    private restService: RestService,
    private sessionService: SessionService) { }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
      });
    } else {
      //console.log('User not allow');
    }
  }

  ngOnInit() {
    // this.getUserLocation();
    // this.getLocations();

    if (this.sessionService.ShowResCenterSelection && !this.sessionService.SuperAdmin
      && (this.sessionService.ShowAllResCenters || this.sessionService.ResponsibilityCenters.length > 1)) {
      this.modal.open(SelectResCenterModalComponent, { size: 'xs', backdrop: 'static' });
      this.sessionService.ShowResCenterSelection = false;
    }
  }

  // getLocations() {
  //   this.restService.get('/GeoLocation/GetAll').subscribe((response: any) => {
  //     if (response.status && response.model) {
  //       response.model.forEach((location: any) => {
  //         this.markers.push({
  //           lat: location.latitude,
  //           lng: location.longitude,
  //           draggable: false
  //         })
  //       });
  //     }
  //   }, (error) => {
  //     this.toastr.warning('Unable to find the route plans.');
  //   });
  // }

  clickedMarker(label: string, index: number) {
    //console.log(`clicked the marker: ${label || index}`);
  }


  kpiTiles = [
    { title:'New Leads',               value:128,     icon:'bi bi-people-fill',        bg:'bg-blue'   },
    { title:'Opportunities',           value:56,      icon:'bi bi-briefcase-fill',     bg:'bg-teal'   },
    { title:'Revenue',                 value:'RM 24 k',icon:'bi bi-currency-dollar',   bg:'bg-orange' },
    { title:'Pending Tasks',           value:19,      icon:'bi bi-list-task',          bg:'bg-purple' },
    { title:'Closed Won',              value:42,      icon:'bi bi-check2-circle',      bg:'bg-blue'   },
    { title:'Closed Lost',             value:7,       icon:'bi bi-x-octagon',          bg:'bg-orange' },
    { title:'Avg. Deal Size',          value:'RM 4 k', icon:'bi bi-bar-chart-fill',    bg:'bg-teal'   },
    { title:'Satisfaction',            value:'93 %',  icon:'bi bi-heart-fill',         bg:'bg-purple' }
  ];
  activityTiles = [
  { title: 'Sales This Month', value: '$23,876' },
  { title: 'Overdue Sales Invoice Amount', value: '$93,422' },
  { title: 'Overdue Purchase Invoice Amount', value: '$17,000' }
];

salesTiles = [
  { title: 'Sales Quotes', value: '2' },
  { title: 'Sales Orders', value: '4' },
  { title: 'Sales Invoices', value: '7' }
];

purchaseTiles = [
  { title: 'Purchase Orders', value: '5' },
  { title: 'Ongoing Purch. Invoices', value: '0' },
  { title: 'Purch. Invoices Due Next Week', value: '5' }
];

paymentTiles = [
  { title: 'Unprocessed Payments', value: '5' },
  { title: 'Collection Days/Average', value: '4' },
  { title: 'Outstanding Vendor Invoices', value: '0.0' }
];
showBanner = true;
dismissBanner() {
  this.showBanner = false;
}


  // mapClicked($event: MouseEvent) {
  //   const modalRef = this.modal.open(AddMachineLocationComponent, { size: 'lg' });
  //   modalRef.componentInstance.latitude = $event.coords.lat;
  //   modalRef.componentInstance.longitude = $event.coords.lng;
  //   modalRef.result.then((result: any) => {
  //     if (typeof result === 'object') {
  //       this.markers.push({
  //         lat: $event.coords.lat,
  //         lng: $event.coords.lng,
  //         draggable: false
  //       });
  //     }
  //   });
  // }

  // markerDragEnd(m: marker, $event: MouseEvent) {
  //   //console.log('dragEnd', m, $event);
  // }
}

// // just an interface for type safety.
// interface marker {
//   lat: number;
//   lng: number;
//   label?: string;
//   draggable: boolean;
// }