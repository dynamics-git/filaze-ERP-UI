import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SessionService } from '../../../core/services/session.service';
import { RestService } from '../../../core/services/rest.service';

@Component({
  standalone: false,
  selector: 'app-select-res-center-modal',
  templateUrl: './select-res-center-modal.component.html',
  styleUrl: './select-res-center-modal.component.scss'
})
export class SelectResCenterModalComponent {
  optionsForm!: FormGroup;
  centers: any[] = [];
  bindLabel: string = 'PortalResponsibilityCentre';
  bindValue: string = 'PortalResponsibilityCentre';

  constructor(
    @Inject(NgbActiveModal) public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private sessionService: SessionService,
    private restService: RestService
  ) {
    this.optionsForm = this.fb.group({
      resCenter: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    if (this.sessionService.ShowAllResCenters) {
      this.restService.get('/portalResponsibilityCentres').subscribe(
        (response: any) => {
          this.bindLabel = 'Code';
          this.bindValue = 'Code';
          this.centers = response?.value || [];

          const currentValue =
            this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre ||
            this.sessionService.ResponsibilityCenter?.ResponsibilityCentre ||
            this.centers[0]?.Code ||
            null;

          if (!this.sessionService.ResponsibilityCenter && this.centers.length > 0) {
            this.sessionService.ResponsibilityCenter = {
              PortalResponsibilityCentre: this.centers[0].Code
            };
          }

          if (currentValue) {
            this.resCenter?.setValue(currentValue);
          }
        },
        () => {
          this.centers = [];
        }
      );
    } else {
      this.centers = this.sessionService.ResponsibilityCenters || [];

      const currentValue =
        this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre ||
        this.sessionService.ResponsibilityCenter?.ResponsibilityCentre ||
        this.centers[0]?.PortalResponsibilityCentre ||
        this.centers[0]?.ResponsibilityCentre ||
        null;

      if (currentValue) {
        this.resCenter?.setValue(currentValue);
      }
    }
  }

  get resCenter() {
    return this.optionsForm.get('resCenter');
  }

  changeCenter(value: string): void {
    if (!value) {
      this.resCenter?.markAsTouched();
      return;
    }

    if (this.sessionService.ShowAllResCenters) {
      const center = this.centers.find((x: any) => x.Code === value);

      if (!center) {
        return;
      }

      this.sessionService.ResponsibilityCenter = {
        PortalResponsibilityCentre: center.Code
      };
    } else {
      const center = this.centers.find(
        (x: any) =>
          x.PortalResponsibilityCentre === value ||
          x.ResponsibilityCentre === value
      );

      if (!center) {
        return;
      }

      //this.sessionService.ResponsibilityCenter = center;
      this.sessionService.ResponsibilityCenter = {
        PortalResponsibilityCentre: value
      };
    }

    this.activeModal.close();
    this.sessionService.resCenterChanged$.next(true);
  }
}