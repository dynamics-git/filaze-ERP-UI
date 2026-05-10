import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { AddItemService } from './add-item.service';
import { RestService } from '../rest.service';
import { SessionService } from '../session.service';


@Injectable({
  providedIn: 'root'
})
export class EmailNotifyService {

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private addItemService: AddItemService,
    private sessionService: SessionService) { }

  public sendNotification(senders: string[], receivers: string[], documentType: string, documentNo: string, documentAction: string, documentDate?: string, reviewType?: string, reviewStatus?: boolean, lastApprov?: boolean, approvalId?: string, senderId?: string, prNumber?: string) {
    const url = `/portalDocumentAttachments?$filter=No eq '${documentNo}'`;
    this.restService.get(url).subscribe((res: any) => {
      let files: string[] = [];
      if (res.value && res.value.length > 0) {
        files = res.value.map((x: any) => x.FileUrl);
      }
      this.sendEmail(senders, receivers, documentType, documentNo, documentAction, files, documentDate, reviewType, reviewStatus, lastApprov, approvalId, senderId, prNumber);
    }, (error: any) => {
      this.sendEmail(senders, receivers, documentType, documentNo, documentAction, [], documentDate, reviewType, reviewStatus, lastApprov, approvalId, senderId, prNumber);
    });
  }

  private sendEmail(senders: string[], receivers: string[], documentType: string, documentNo: string, documentAction: string, files?: string[], documentDate?: string, reviewType?: string, reviewStatus?: boolean, lastApprov?: boolean, approvalId?: string, senderId?: string, prNumber?: string) {
    const payload = {
      senderEmail: senders,
      recieverEmail: receivers,
      files: files,
      documentType: documentType,
      reviewType: reviewType,
      documentNo: documentNo,
      documentAction: documentAction,
      documentDate: documentDate,
      company: this.sessionService.CompanyName,
      responsibilityCenter: this.sessionService.ResponsibilityCenter.PortalResponsibilityCentre,
      reviewStatus: reviewStatus,
      approvalId: approvalId,
      senderId: senderId,
      prNumber: prNumber,
    };
    console.log(payload);
    console.log(this.sessionService.ResponsibilityCenter.PortalResponsibilityCentre)
    if (lastApprov == true) {
      this.restService.FinalApprovednotify(payload).subscribe((res: any) => {
        if (documentAction == "Approve" && (documentType == "Requisition" || documentType == "BW Requisition")) {
          this.SecondNotification(documentNo, documentAction);
        } else {
          this.toastr.success('Email sent successfully.');
          this.addItemService.showLoader$.next(false);
        }
      }, (error: any) => {
        this.toastr.error('Failed to send Email.');
        this.addItemService.showLoader$.next(false);
      })
    }
    else {
      if (documentAction == "VendorAcceptance") {
        this.restService.VendorAcceptance(payload).subscribe((res: any) => {
          this.addItemService.showLoader$.next(false);
          this.toastr.success('Email sent successfully.');
        }, (error: any) => {
          this.toastr.error('Failed to send Email.');
          this.addItemService.showLoader$.next(false);
        })

      }
      else {
        this.restService.notify(payload).subscribe((res: any) => {
          if (documentAction == "Approve" && (documentType == "Requisition" || documentType == "BW Requisition")) {
            this.SecondNotification(documentNo, documentAction);
          } else {
            this.toastr.success('Email sent successfully.');
            this.addItemService.showLoader$.next(false);
          }
        }, (error: any) => {
          this.toastr.error('Failed to send Email.');
          this.addItemService.showLoader$.next(false);
        })
      }
    }

  }



  ////27-20-21///
  public sendNotificationforReview(senders: string[], receivers: string[], documentType: string, documentNo: string, documentAction: string, reviewType?: string, reviewStatus?: boolean) {
    const url = `/portalDocumentAttachments?$filter=No eq '${documentNo}'`;
    this.restService.get(url).subscribe((res: any) => {
      let files: string[] = [];
      if (res.value && res.value.length > 0) {
        files = res.value.map((x: any) => x.FileUrl);
      }
      this.sendEmailforReview(senders, receivers, documentType, documentNo, documentAction, files, reviewType, reviewStatus);
    }, (error: any) => {
      this.sendEmailforReview(senders, receivers, documentType, documentNo, documentAction, [], reviewType, reviewStatus);
    });
  }

  private sendEmailforReview(senders: string[], receivers: string[], documentType: string, documentNo: string, documentAction: string, files?: string[], reviewType?: string, reviewStatus?: boolean) {
    const payload = {
      senderEmail: senders,
      recieverEmail: receivers,
      files: files,
      documentType: documentType,
      reviewType: reviewType,
      documentNo: documentNo,
      documentAction: documentAction,
      // documentDate: documentDate,
      company: this.sessionService.CompanyName,
      reviewStatus: reviewStatus,
    };
    this.restService.notify(payload).subscribe((res: any) => {
      this.toastr.success('Email sent successfully.');
      this.addItemService.showLoader$.next(false);
    }, (error: any) => {
      this.toastr.error('Failed to send Email.');
      this.addItemService.showLoader$.next(false);
    })
  }

  /////17/11/2021....
  SecondNotification(documentNo: string, documentAction: string,) {
    this.addItemService.showLoader$.next(true);
    const secondPayload = {
      documentNo: documentNo,
      documentAction: documentAction,
      company: this.sessionService.CompanyName,
      responsibilityCenter: this.sessionService.ResponsibilityCenter.PortalResponsibilityCentre,
    }
    this.restService.Approvednotify(secondPayload).subscribe((res: any) => {
      this.toastr.success('Email sent successfully.');
      this.addItemService.showLoader$.next(false);
    }, (error: any) => {
      this.toastr.error('Failed to send Email.');
      this.addItemService.showLoader$.next(false);
    });

  }
}
