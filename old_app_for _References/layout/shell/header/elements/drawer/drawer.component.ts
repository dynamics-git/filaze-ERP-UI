import {
  Component,
  Input,
  ViewChild,
  ViewContainerRef,
  AfterViewInit,
  Type,
  EventEmitter,
  Output,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RestService } from '../../../../../core/services/rest.service';
import { FormFieldType } from '../../../../../core/models/shared/formField.enum';
import { Utility } from '../../../../../core/services/utility.service';

@Component({
  standalone: false,
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss']
})
export class DrawerComponent implements AfterViewInit {

  @Input() title = '';
  @Input() subtitle = '';
  @Input() childComponent!: Type<any>;
  @Input() childData: any;
  @Output() saved = new EventEmitter<any>();
  childInstance: any;
  isEditMode = false;
  isLoading = false;
  @ViewChild('container', { read: ViewContainerRef })
  container!: ViewContainerRef;
  isDrawerCloseAfterSave = true;
  showHeader = true;

  constructor(
    public activeModal: NgbActiveModal,
    private restService: RestService,
    private utility: Utility
  ) { }

 


  ngAfterViewInit(): void {

    if (this.childComponent) {

      const componentRef = this.container.createComponent(this.childComponent);

      this.childInstance = componentRef.instance;
      if (this.childInstance.headerConfig) {
        this.title = this.childInstance.headerConfig.title;
        this.showHeader = this.childInstance.headerConfig.showHeader;
        if (this.showHeader === undefined || this.showHeader === null) {
          this.showHeader = true;
        }
        this.isDrawerCloseAfterSave = this.childInstance.headerConfig.isDrawerCloseAfterSave;
        if (this.isDrawerCloseAfterSave === undefined || this.isDrawerCloseAfterSave === null) {
          this.isDrawerCloseAfterSave = true;
        }
      }
      if (this.childInstance.changeEvent) {
        this.childInstance.changeEvent.subscribe((data: any) => {
          this.onChildChange(data);
        });
      }

      if (this.childInstance.leaveEvent) {
        this.childInstance.leaveEvent.subscribe((data: any) => {
          this.onChildLeave(data);
        });
      }

      if (this.childData) {
        Object.assign(this.childInstance, this.childData);
      }

      this.loadDataIfEdit();
    }
  }

  close() {
    this.activeModal.dismiss();
  }


  private findRecordId(instance: any, idProp: string): any {

    if (!instance || !idProp) return undefined;

    if (instance[idProp]) {
      return instance[idProp];
    }
    if (this.childData?.[idProp]) {
      return this.childData[idProp];
    }
    for (const key of Object.keys(instance)) {
      const value = instance[key];
      if (value && typeof value === 'object' && value[idProp]) {
        return value[idProp];
      }
    }

    return undefined;
  }


  onSave() {
    if (!this.childInstance?.onSave) return;

    let payload = this.childInstance.onSave();
    if (!payload) return;

    const config = this.childInstance.headerConfig;
    const api = config?.api;
    const idProp = config?.idProp;

    if (!api) {
      return;
    }

    payload = this.transformPayload(payload, config);

    const recordId = this.findRecordId(this.childInstance, idProp);
    let request$;
    this.isLoading = true;
    const ifMatchKey = "*";

    if (recordId) {

      request$ = this.restService.patch(
        `${api}(${recordId})`,
        payload,
        ifMatchKey
      );

    } else {

      request$ = this.restService.post(api, payload);

    }

    request$.subscribe({
      next: (res: any) => {

        if (this.childInstance?.afterSave) {
          this.childInstance.afterSave(res);
        }
        if (this.isDrawerCloseAfterSave) {
          this.activeModal.close(res);
        }
        this.isLoading = false;

      },
      error: (err: any) => {
        this.isLoading = false;
      }
    });

  }

  private loadDataIfEdit() {

    const config = this.childInstance?.headerConfig;
    const idProp = config?.idProp;
    const recordId = this.childData?.[idProp];

    if (!config?.api || !idProp || !recordId) return;

    this.isEditMode = true;

    this.restService
      .get(`${config.api}(${recordId})`)
      .subscribe((res: any) => {
        const data = this.utility.setHeaderControlsData(
          res,
          config.controls
        );

        if (this.childInstance?.headerFormGroup) {
          this.childInstance.headerFormGroup.patchValue(data);
        }

      });
  }

  private transformPayload(recordData: any, config: any) {

    // clone object
    const payload = this.utility.copyObj(recordData);

    // convert dates, numbers, checkbox, dropdown etc
    this.utility.getHeaderControlsData(payload, config.controls);

    return payload;
  }

  private onChildChange(data: any) {
    if (!this.childInstance?.headerFormGroup) {
      return;
    }

    const form = this.childInstance.headerFormGroup;
    const control = form.get(data?.control);

    if (control) {
      control.markAsDirty();
    } else {
    }

  }
  private onChildLeave(data: any) {

    if (!this.childInstance?.headerFormGroup) {
      return;
    }

    const form = this.childInstance.headerFormGroup;

    const control = form.get(data?.control);

    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity({ onlySelf: true });
    } else {
    }

  }
}
