import { Component } from '@angular/core';
import { ListTableConfig } from '../../../core/models/shared/list-table.config';
import { ClaimPaymentCalculation, ClaimPaymentHeader, ClaimPaymentLine } from './claim-payments.config'
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { catchError, concatMap, finalize, firstValueFrom, forkJoin, from, Observable, of, switchMap, take, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SessionService } from '../../../core/services/session.service';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { RestService } from '../../../core/services/rest.service';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';

@Component({
  standalone: false,
  selector: 'app-claim-payments',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>'

})
export class ClaimPaymentsComponent {

  constructor(private formDataService: FormDataService,
    private restService: RestService,
    private addItemService: AddItemService,
    private toastr: ToastrService,
    private sessionService: SessionService,
    private dialogService: UnifiedDialogService,
    private selectedItemService: SelectedItemService
  ) {

  }


  config: DataTableConfig = {
    title: 'Claim Payment',
    idProp: 'systemId',
    headerApi: '/claimPaymentHeaders',
    pageName: 'CLAIM PAYMENTS',
    headerApiOrderByField: 'batchNo',
    headers: [
      { name: 'Batch No', prop: 'batchNo', isPrimaryLink: true },
      // { name: 'Created By', prop: 'createdBy' },
      { name: 'Created Date', prop: 'createdDate' },
      { name: 'Approval Status', prop: 'approvalStatus' },
      { name: 'Batch Status', prop: 'batchStatus' },
      { name: 'Amount', prop: 'totalAmount' },
      { name: 'Remarks', prop: 'remarks' }
    ],
    removeUnicodeCharFields: ['batchStatus', 'approvalStatus'],
    selctionType: 'single',
    filterByUserCompanyResCenter: true,
    showCreate: true,
    filterConfig: [
      {
        field: 'batchNo',
        label: 'Batch No',
        type: 'text'
      },
      {
        field: 'createdDate',
        label: 'Created Date',
        type: 'date'
      },
      {
        field: 'approvalStatus',
        label: 'Approval Status',
        type: 'dropdown',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'Pending For Approval', label: 'Pending For Approval' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Rejected', label: 'Rejected' }
        ]
      },
      {
        field: 'batchStatus',
        label: 'Batch Status',
        type: 'dropdown',
        options: [
          { value: 'Draft', label: 'Draft' },
          { value: 'Submitted', label: 'Submitted' },
          { value: 'Returned', label: 'Returned' },
          { value: 'ReSubmitted', label: 'ReSubmitted' },
          { value: 'Finance Review', label: 'Finance Review' },
          { value: 'Ready For Batch', label: 'Ready For Batch' },
          { value: 'In Batch', label: 'In Batch' },
          { value: 'Payment Initiated', label: 'Payment Initiated' },
          { value: 'Paid', label: 'Paid' }
        ]
      },
      {
        field: 'totalAmount',
        label: 'Amount',
        type: 'number'
      },
      {
        field: 'remarks',
        label: 'Remarks',
        type: 'text'
      }
    ],
    addItemConfig: {
      title: 'Claim Payment',
      recordId: 'batchNo',
      recordTitle: 'batchNo',
      headerConfig: ClaimPaymentHeader,
      lineConfig: ClaimPaymentLine,
      calculationSectionConfig: ClaimPaymentCalculation,
      informationSectionConfig: {
        documentNoProp: 'batchNo',
        documentType: 'Claim Payment',
        documentStatusProp: 'ClaimPayment',
        allowAttachmentUpload: false,
        useSelectedLineForHeaderAttachments: true,
      }
    },
    factBoxConfig: {
      boxType: FactBoxType.ClaimPayment
    }
  };




  popupLoaded(data: any) {
    const lineData = data.line;
    const totalClaims = lineData.filter((line: any) => line.claimNo && line.claimNo !== '').length;
    this.formDataService.updateControlData$.next({ control: 'totalClaims', data: totalClaims });
    this.calculateAmount(data.line)
    this.addItemService.disableAllControlsExceptSome$.next(['remarks']);
  }

  calculateAmount(data: any) {
    let totalExcAmount: number = 0;
    let totalTax: number = 0;
    let totalClaimAmount: number = 0;
    if (data) {
      data.forEach((line: any, rowIndex: number) => {
        if (!line.return) {
          totalExcAmount += line['amount'] ? +line['amount'] : 0;
          totalTax += line['taxAmount'] ? +line['taxAmount'] : 0;
        }
      })
      totalClaimAmount = totalExcAmount + totalTax;
    }
    this.formDataService.updateControlData$.next({ control: 'totalExcAmount', data: totalExcAmount.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalTax', data: totalTax.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalClaimAmount', data: totalClaimAmount.toFixed(2) });
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'amount':
          this.CalculateAmountOnChange(data);
          break;
      }
    }
    this.addItemService.disableAllControlsExceptSome$.next(['remarks']);
  }


  CalculateAmountOnChange(data: EventDataModel) {
    let totalExcAmount = 0;
    let totalTax = 0;
    let totalClaimAmount = 0;
    const lineAmount = Number(data.activeData.amount);
    const lineVatPercent = Number(data.activeData.vat);
    const taxAmountLine = (lineAmount * lineVatPercent) / 100;
    this.formDataService.updateLineControlData$.next({
      control: 'taxAmount',
      data: taxAmountLine,
      rowIndex: data.rowIndex
    });
    this.addItemService.patchLineData$.next({
      rowIndex: data.rowIndex!,
      data: { taxAmount: taxAmountLine },
      disableControls: false
    });
    if (data.linesData && data.linesData.length > 0) {
      data.linesData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) {
          totalExcAmount += lineAmount;
          totalTax += taxAmountLine;
        } else {
          totalExcAmount += Number(line['amount']);
          totalTax += Number(line['taxAmount']);
        }
      });
      totalClaimAmount = totalExcAmount + totalTax;
      this.formDataService.updateControlData$.next({
        control: 'totalExcAmount',
        data: totalExcAmount.toFixed(2)
      });
      this.formDataService.updateControlData$.next({
        control: 'totalTax',
        data: totalTax.toFixed(2)
      });
      this.formDataService.updateControlData$.next({
        control: 'totalClaimAmount',
        data: totalClaimAmount.toFixed(2)
      });
    }
  }





  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'return') {
      this.returnReasonMessage(buttonData)
    }
    else if (buttonData.button.label === 'SendApprovalRequest') {
      this.SendApprovalRequest(buttonData);
    }
    else if (buttonData.button.label === 'CancelApprovalRequest') {
      this.CancelApprovalRequest(buttonData);
    }
    else if (buttonData.button.label === 'ReadyForPayment') {
      this.ReadyForPayment(buttonData);
    }
    else if (buttonData.button.label === 'finalizePost') {
      this.finalizePost(buttonData);
    }
    else if (buttonData.button.label === 'markaspaid') {
      this.markaspaid(buttonData);
    }
    else if (buttonData.button.label === 'submit') {
      this.submit(buttonData)
    } else if (buttonData.button.label === 'reopen') {
      this.reopen(buttonData)
    }



  }


  async returnReasonMessage(buttonData: any) {
    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );
    if (!selectedIndexes?.length) {
      this.toastr.warning("Please select line before rejecting.");
      return;
    }
    const reason = await this.dialogService.commentBox({
    });
    if (!reason) {
      this.selectedItemService.popupUncheckedLineData$.next(true);
      return;
    }
    this.addItemService.showLoader$.next(true);
    try {
      const updatePromises = selectedIndexes.map(async (index: number) => {
        const row = buttonData.lineData[index];
        if (!row || !row.systemId) return;
        const newReason = row.return && row.returnReason ? `${row.returnReason}, ${reason}` : reason;
        const ifMatchKey = row["@odata.etag"];
        const patchData = {
          returnReason: newReason,
          return: true,
        };
        const query = `(${row.systemId})`;
        try {
          await firstValueFrom(this.restService.patch(this.config.addItemConfig!.lineConfig!.api + query, patchData, ifMatchKey));
        } catch {
          this.toastr.error(`Failed to save reject reason for claim ${row.claimNo}`);
          return;
        }

        try {
          const filterQuery = `/employeeClaimLines?$filter=claimNo eq '${row.sourceClaimNo}' and lineNo eq ${row.sourceLineNo}`;
          const res: any = await firstValueFrom(this.restService.get(filterQuery));
          const employeeClaimLines = Array.isArray(res) ? res : res?.value || [];

          for (const claimLine of employeeClaimLines) {
            if (!claimLine?.systemId) continue;
            const empNewReason = claimLine.return && claimLine.returnReason ? `${claimLine.returnReason}, ${reason}` : reason;

            const empIfMatchKey = claimLine["@odata.etag"];
            const empQuery = `(${claimLine.systemId})`;

            try {
              await firstValueFrom(this.restService.patch("/employeeClaimLines" + empQuery, { returnReason: empNewReason, return: true }, empIfMatchKey));
            } catch {
              this.toastr.error(`Failed to update employeeClaimLine for claim ${row.claimNo} line ${row.lineNo}`);
            }
          }
        } catch {
          this.toastr.error(`Could not fetch employeeClaimLines for claim ${row.claimNo} line ${row.lineNo}`);
        }
        try {
          if (row.reviewBatchNo && row.reviewLineNo) {
            const reviewFilter = `/claimreviewLines?$filter=batchNo eq '${row.reviewBatchNo}' and lineNo eq ${row.reviewLineNo}`;
            const res: any = await firstValueFrom(this.restService.get(reviewFilter));
            const reviewLines = Array.isArray(res) ? res : res?.value || [];

            for (const reviewLine of reviewLines) {
              if (!reviewLine?.systemId) continue;
              const revNewReason = reviewLine.return && reviewLine.returnReason ? `${reviewLine.returnReason}, ${reason}` : reason;

              const revIfMatchKey = reviewLine["@odata.etag"];
              const revQuery = `(${reviewLine.systemId})`;

              try {
                await firstValueFrom(this.restService.patch("/claimreviewLines" + revQuery, { returnReason: revNewReason, return: true }, revIfMatchKey));
              } catch {
                this.toastr.error(
                  `Failed to update claimreviewLine for reviewBatch ${row.reviewBatchNo} line ${row.reviewLineNo}`
                );
              }
            }
          }
        } catch {
          this.toastr.error(
            `Could not fetch claimreviewLines for reviewBatch ${row.reviewBatchNo} line ${row.reviewLineNo}`
          );
        }
      });
      await Promise.allSettled(updatePromises);
      this.toastr.success("Return submitted successfully.");
    } finally {
      this.addItemService.customButtonResponse$.next(true);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }


  async SendApprovalRequest(buttonData: CustomButtonEvent) {
    this.addItemService.showLoader$.next(true);
    try {
      const getUrl = `(${buttonData.data[this.config.idProp!]})/Microsoft.NAV.getUserId`;
      const payload = {
        userid2: this.sessionService.UserId,
        docNo: buttonData.data.batchNo,
        resCentre: this.sessionService.DefaultResponsibilityCenter,
        comp: this.sessionService.CompanyName,
        compId: this.sessionService.Company,
      };

      await this.restService.post(this.config.headerApi + getUrl, payload).toPromise();

      const url = `(${buttonData.data[this.config.idProp!]})/Microsoft.NAV.PortalSendClaimPaymentForApproval`;
      await this.restService.post(this.config.headerApi + url, {}).toPromise();

      this.toastr.success('Workflow request sent successfully!');
    } catch (err) {
      this.toastr.error('Failed to send workflow request.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.addItemService.customButtonResponse$.next(true);
    }
  }


  CancelApprovalRequest(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.approvalStatus == 'Pending For Approval') {
      this.addItemService.showLoader$.next(true);
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.PortalCancelClaimPaymentApproval';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Sent Cancel Request!');
        this.addItemService.showLoader$.next(false);
        this.addItemService.customButtonResponse$.next(true);
      });
    }
    else {
      this.toastr.warning('You are unable to cancel approval request.');
    }
  }

  //BC fn
  ReadyForPayment(buttonData: any) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.readyForPaymentAPI';
    try {
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success(`claim(s) moved to In Batch.`);
        this.addItemService.showLoader$.next(false);
        this.addItemService.customButtonResponse$.next(true);
      });
    }
    finally {
      this.formDataService.updateControlData$.next({ control: 'batchStatus', data: 'In Batch' });
    }
  }

  //angular fn
  ReadyForPayment1(buttonData: any) {
    if (buttonData.headerData.approvalStatus == 'Open') {
      this.addItemService.showLoader$.next(true);

      let filter = "/claimReviewHeaders";

      if (!this.sessionService.SuperAdmin) {
        let condition = `CompanyId eq ${this.sessionService.Company}`;

        if (this.sessionService.ResponsibilityCenterId) {
          condition += ` and PortalResponsibilityCentre eq '${this.sessionService.ResponsibilityCenterId}'`;
        }

        if (filter === "/claimReviewHeaders") {
          filter += `?$filter=${condition}`;
        } else {
          filter += ` and ${condition}`;
        }
      }

      this.restService.get(filter).subscribe({
        next: (res: any) => {
          const reviewHeaders = Array.isArray(res) ? res : res?.value || [];

          if (!reviewHeaders.length) {
            this.toastr.warning("No claim review headers found.");
            this.addItemService.showLoader$.next(false);
            return;
          }

          const readyHeaders = reviewHeaders.filter(
            (hdr: any) => hdr.batchStatus === "Ready_x0020_For_x0020_Batch"
          );

          if (!readyHeaders.length) {
            this.toastr.info("No claim review headers are Ready For Batch.");
            this.addItemService.showLoader$.next(false);
            return;
          }

          if (readyHeaders.length > 0) {
            const ifMatchKey = buttonData.headerData['@odata.etag'];
            this.restService.patch(this.config.headerApi + '(' + buttonData.headerData.systemId + ')', { batchStatus: 'In Batch' }, ifMatchKey
            ).subscribe(() => { })
          }

          from(readyHeaders)
            .pipe(
              concatMap((reviewHdr: any) => {
                return this.restService
                  .get(`/claimReviewLines?$filter=batchNo eq '${reviewHdr.batchNo}'`)
                  .pipe(
                    concatMap((res: any) => {
                      const reviewLines = Array.isArray(res) ? res : res?.value || [];
                      const allLinesReady = reviewLines.every(
                        (line: any) => line.batchStatus === "Ready_x0020_For_x0020_Batch"
                      );
                      if (!allLinesReady) {
                        // this.toastr.warning(
                        //   `Claim ${reviewHdr.batchNo} skipped. Not all lines are Ready For Batch.`
                        // );
                        return of(null);
                      }

                      return from(reviewLines).pipe(
                        concatMap((line: any) => {
                          const paymentData = {
                            claimNo: line.claimNo,
                            batchNo: buttonData?.headerData?.batchNo,
                            employeeNo: line.employeeNo,
                            employeeName: line.employeeName,
                            sourceClaimNo: line.sourceClaimNo,
                            sourceLineNo: line.sourceLineNo,
                            expenseType: line.expenseType,
                            // submitionLineNo: 0,
                            reviewBatchNo: line.batchNo,
                            reviewLineNo: line.lineNo,
                            amount: line.amount,
                            glCode: line.glCode,
                            remarks: line.remarks,
                            description: line.description,
                            paymentMethod: line.paymentMethod,
                            vat: line.vat,
                            vatCode: line.vatCode,
                            taxAmount: line.taxAmount,
                            clientName: line.clientName,
                            job: line.job,
                            currencyCode: line.currencyCode,
                            Chargeable: line.Chargeable,
                            attachment: line.attachment,
                            company: this.sessionService.CompanyName,
                            companyId: this.sessionService.Company,
                            createdBy: this.sessionService.UserId,
                            portalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
                            userId: this.sessionService.UserId,
                            batchStatus: "In Batch",
                            departmentCode: line.departmentCode,
                          };

                          return this.restService.post("/claimPaymentLines", paymentData).pipe(
                            concatMap(() => {
                              const etag = line["@odata.etag"];
                              return this.restService.patch(
                                `/claimReviewLines(${line.systemId})`,
                                { batchStatus: "In Batch" },
                                etag
                              );
                            }),

                            concatMap(() => {
                              return this.checkIsAllClaimReview(line.batchNo, 'In Batch');
                            }),

                            concatMap(() => {
                              return this.UpdateBatchStatusInEmpClaim(line.claimNo, line.sourceLineNo, 'In Batch');
                            }),

                            concatMap(() => {
                              return this.checkIsAllEmpClaim(line.claimNo, 'In Batch');
                            })
                          );

                        })
                      );
                    })
                  );
              }),
              finalize(() => {
                this.addItemService.customButtonResponse$.next(true);
                this.addItemService.showLoader$.next(false);
                this.toastr.success(
                  `claim(s) moved to In Batch.`
                );
              })
            )
            .subscribe();
        },
        error: () => {
          this.toastr.error("Failed to load claim review headers.");
          this.addItemService.showLoader$.next(false);
        },
      });
    }
    else {
      this.toastr.warning('Approval status not Open!');
    }
  }


  checkIsAllClaimReview(batchNo: string, batchStatus: string): Observable<any> {
    return this.restService.get(`/claimReviewLines?$filter=batchNo eq '${batchNo}'`).pipe(
      concatMap((res: any) => {
        const reviewLines = Array.isArray(res) ? res : res?.value || [];
        if (!reviewLines.length) return of(null);

        const normalizedTarget = (batchStatus || '').replace(/_x0020_/g, ' ').trim();
        const allInBatch = reviewLines.every((line: any) => {
          const currentStatus = (line.batchStatus || '').replace(/_x0020_/g, ' ').trim();
          return currentStatus === normalizedTarget;
        });

        if (allInBatch) {
          return this.restService
            .get(`/claimReviewHeaders?$filter=batchNo eq '${batchNo}'`)
            .pipe(
              concatMap((hdrRes: any) => {
                const headers = Array.isArray(hdrRes) ? hdrRes : hdrRes?.value || [];
                if (!headers.length) return of(null);

                const header = headers[0];
                const etag = header['@odata.etag'];

                return this.restService.patch(
                  `/claimReviewHeaders(${header.systemId})`,
                  { batchStatus },
                  etag
                );
              })
            );
        }

        return of(null);
      })
    );
  }





  UpdateBatchStatusInEmpClaim(claimNo: string, sourceLineNo: string, batchStatus: string): Observable<any> {
    return this.restService
      .get(`/employeeClaimLines?$filter=claimNo eq '${claimNo}' and lineNo eq ${sourceLineNo}`)
      .pipe(
        concatMap((res: any) => {
          const empLines = Array.isArray(res) ? res : res?.value || [];
          if (!empLines.length) {
            return of(null);
          }
          const patchCalls = empLines.map((line: any) => {
            const etag = line["@odata.etag"];
            return this.restService.patch(
              `/employeeClaimLines(${line.systemId})`,
              { batchStatus: batchStatus },
              etag
            );
          });

          return forkJoin(patchCalls);
        })
      );
  }



  checkIsAllEmpClaim(claimNo: string, batchStatus: string, paymentDate?: any): Observable<any> {
    return this.restService.get(`/employeeClaimLines?$filter=claimNo eq '${claimNo}'`).pipe(
      concatMap((res: any) => {
        const reviewLines = Array.isArray(res) ? res : res?.value || [];
        if (!reviewLines.length) return of(null);

        const normalizedTarget = (batchStatus || '').replace(/_x0020_/g, ' ').trim();

        const allMatch = reviewLines.every((line: any) => {
          const currentStatus = (line.batchStatus || '').replace(/_x0020_/g, ' ').trim();
          return currentStatus === normalizedTarget;
        });

        if (allMatch) {
          return this.restService
            .get(`/employeeClaimHeaders?$filter=claimNo eq '${claimNo}'`)
            .pipe(
              concatMap((hdrRes: any) => {
                const headers = Array.isArray(hdrRes) ? hdrRes : hdrRes?.value || [];
                if (!headers.length) return of(null);

                const header = headers[0];
                const etag = header['@odata.etag'];

                const patchBody: any = { batchStatus };

                if (paymentDate && paymentDate !== '') {
                  patchBody.paymentDate = paymentDate;
                  patchBody.paymentDone = true;
                }

                return this.restService.patch(
                  `/employeeClaimHeaders(${header.systemId})`,
                  patchBody,
                  etag
                );
              })
            );
        }

        return of(null);
      })
    );
  }

  //BC fn
  finalizePost(buttonData: any) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.claimFinalizePost';
    try {
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success(`Record(s) updated to Payment Initiated successfully!`);
        this.addItemService.showLoader$.next(false);
      });
    }
    finally {
      this.addItemService.customButtonResponse$.next(true);
    }
  }

  //angular fn
  async finalizePost1(buttonData: any) {
    const header = buttonData.headerData;

    if (header.approvalStatus !== 'Approved' && header.batchStatus != 'In_x0020_Batch') {
      this.toastr.warning('Claim approval status is not Approved!');
      return;
    } else {

      this.addItemService.showLoader$.next(true);
      const finalizeUrl = `(${buttonData.data[this.config.idProp!]})/Microsoft.NAV.claimFinalizePost`;

      try {
        await firstValueFrom(this.restService.post(this.config.headerApi + finalizeUrl, {}));
        this.toastr.success('Claim Finalize Posted!');
        this.formDataService.updateControlData$.next({
          control: 'batchStatus',
          data: 'Payment Initiated',
        });

        const batchNo = header.batchNo;

        const paymentRes: any = await firstValueFrom(
          this.restService.get(`/claimPaymentLines?$filter=batchNo eq '${batchNo}'`)
        );
        const paymentLines = Array.isArray(paymentRes) ? paymentRes : paymentRes?.value || [];

        if (!paymentLines.length) {
          this.toastr.warning('No claim payment lines found for this batch.');
          return;
        }

        const reviewBatchNo = paymentLines[0]?.reviewBatchNo;
        if (!reviewBatchNo) {
          this.toastr.warning('No review batch number found on payment lines.');
          return;
        }

        for (const line of paymentLines) {
          const etag = line['@odata.etag'];
          await firstValueFrom(
            this.restService.patch(`/claimPaymentLines(${line.systemId})`, { batchStatus: 'Payment Initiated' }, etag)
          );
        }

        const reviewRes: any = await firstValueFrom(
          this.restService.get(`/claimReviewLines?$filter=batchNo eq '${reviewBatchNo}'`)
        );
        const reviewLines = Array.isArray(reviewRes) ? reviewRes : reviewRes?.value || [];

        if (!reviewLines.length) {
          this.toastr.warning(`No claim review lines found for review batch ${reviewBatchNo}.`);
        } else {
          for (const line of reviewLines) {
            const etag = line['@odata.etag'];

            await firstValueFrom(
              this.restService.patch(`/claimReviewLines(${line.systemId})`, { batchStatus: 'Payment Initiated' }, etag)
            );
            await firstValueFrom(this.UpdateBatchStatusInEmpClaim(line.claimNo, line.sourceLineNo, 'Payment Initiated'));
            await firstValueFrom(this.checkIsAllEmpClaim(line.claimNo, 'Payment Initiated'));
          }
          await firstValueFrom(this.checkIsAllClaimReview(reviewBatchNo, 'Payment Initiated'));
        }

        this.toastr.success('All related records updated to Payment Initiated successfully!');
      } catch (error) {
        this.toastr.error('Failed to finalize claim or update related statuses.');
      } finally {
        this.addItemService.customButtonResponse$.next(true);
        this.addItemService.showLoader$.next(false);
      }
    }
  }

  //BC fn
  markaspaid(buttonData: any) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.claimMarkAsPaid';
    try {
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success(`Record(s) updated to Paid successfully!`);
        this.addItemService.showLoader$.next(false);
      });
    }
    finally {
      this.addItemService.customButtonResponse$.next(true);
    }
  }


  //Angular function
  async markaspaid1(buttonData: any) {
    const header = buttonData.headerData;
    if (header.batchStatus != 'Payment Initiated') {
      this.toastr.warning('Claim Batch status is not Payment Initiated!');
      return;
    }

    this.addItemService.showLoader$.next(true);
    const paymentId = `(${header[this.config.idProp!]})`;
    const etag = header['@odata.etag'] || buttonData['@odata.etag'] || '*';

    const now = new Date();
    const paymentDate = now.toISOString().split('T')[0];

    try {
      await firstValueFrom(
        this.restService.patch(
          this.config.headerApi + paymentId,
          { batchStatus: 'Paid', paymentDate: paymentDate },
          etag
        )
      );
      this.toastr.success('Claim Finalize Posted!');

      this.formDataService.updateControlData$.next({
        control: 'batchStatus',
        data: 'Paid',
      });

      const batchNo = header.batchNo;

      const paymentRes: any = await firstValueFrom(
        this.restService.get(`/claimPaymentLines?$filter=batchNo eq '${batchNo}'`)
      );
      const paymentLines = Array.isArray(paymentRes)
        ? paymentRes
        : paymentRes?.value || [];

      if (!paymentLines.length) {
        this.toastr.warning('No claim payment lines found for this batch.');
        return;
      }

      const reviewBatchNo = paymentLines[0]?.reviewBatchNo;
      if (!reviewBatchNo) {
        this.toastr.warning('No review batch number found on payment lines.');
        return;
      }

      for (const line of paymentLines) {
        const etag = line['@odata.etag'];
        await firstValueFrom(
          this.restService.patch(
            `/claimPaymentLines(${line.systemId})`,
            { batchStatus: 'Paid' },
            etag
          )
        );
      }

      const reviewRes: any = await firstValueFrom(
        this.restService.get(`/claimReviewLines?$filter=batchNo eq '${reviewBatchNo}'`)
      );
      const reviewLines = Array.isArray(reviewRes)
        ? reviewRes
        : reviewRes?.value || [];

      if (!reviewLines.length) {
        this.toastr.warning(`No claim review lines found for review batch ${reviewBatchNo}.`);
      } else {
        for (const line of reviewLines) {
          const etag = line['@odata.etag'];

          await firstValueFrom(
            this.restService.patch(
              `/claimReviewLines(${line.systemId})`,
              { batchStatus: 'Paid', paymentDate: paymentDate },
              etag
            )
          );

          await firstValueFrom(this.UpdateBatchStatusInEmpClaim(line.claimNo, line.sourceLineNo, 'Paid'));
          await firstValueFrom(this.checkIsAllEmpClaim(line.claimNo, 'Paid', paymentDate));
        }

        await firstValueFrom(this.checkIsAllClaimReview(reviewBatchNo, 'Paid'));
      }

      this.toastr.success('All related records updated to Paid successfully!');
    } catch (error) {
      console.error(error);
      this.toastr.error('Failed to update related statuses.');
    } finally {
      this.addItemService.customButtonResponse$.next(true);
      this.addItemService.showLoader$.next(false);
    }
  }





  submit(buttonData: CustomButtonEvent) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.submitClaimPaymentApproval';
    try {
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success(`Claim Submitted Successfully`);
        this.addItemService.showLoader$.next(false);
        this.addItemService.customButtonResponse$.next(true);
      });
    }
    finally {

    }
  }

  reopen(buttonData: CustomButtonEvent) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.reopenClaimPaymentApproval';
    try {
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success(`Claim Reopen Successfully`);
        this.addItemService.showLoader$.next(false);
      });
    }
    finally {
      setTimeout(() => {
        this.addItemService.customButtonResponse$.next(true);
      }, 100)
    }
  }




}
