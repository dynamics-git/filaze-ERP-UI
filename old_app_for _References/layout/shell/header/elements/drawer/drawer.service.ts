import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { DrawerComponent } from "./drawer.component";


@Injectable({ providedIn: 'root' })
export class DrawerService {

    constructor(
        private modalService: NgbModal,
        @Inject(DOCUMENT) private document: Document,
    ) { }
    open(component: any, data?: any): NgbModalRef {

        const modalRef = this.modalService.open(DrawerComponent, {
            windowClass: 'right-drawer-modal',
            backdrop: true,
            keyboard: true,
            animation: false,
            centered: false,
        });

        this.document.body.classList.add('drawer-open');

        modalRef.hidden.subscribe(() => {
            this.document.body.classList.remove('drawer-open');
        });

        modalRef.dismissed.subscribe(() => {
            this.document.body.classList.remove('drawer-open');
        });

        modalRef.componentInstance.childComponent = component;
        modalRef.componentInstance.childData = data;

        return modalRef;
    }
}
