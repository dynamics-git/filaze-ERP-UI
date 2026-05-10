import { Component } from '@angular/core';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { ClaimReviewCalculation, ClaimReviewHeader, ClaimReviewLime } from './cliam-review.config';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { RestService } from '../../../core/services/rest.service';
import { ToastrService } from 'ngx-toastr';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { SessionService } from '../../../core/services/session.service';
import { catchError, concatMap, finalize, firstValueFrom, forkJoin, from, Observable, of, switchMap, take, tap } from 'rxjs';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';

@Component({
  standalone: false,
  selector: 'app-claim-review',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>'
})
export class ClaimReviewComponent {
  claimSetupResponse: any;

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private formDataService: FormDataService,
    private dialogService: UnifiedDialogService,
    private selectedItemService: SelectedItemService
  ) {

  }

  config: DataTableConfig = {
    title: 'Finance Claim Review',
    idProp: 'systemId',
    headerApi: '/claimReviewHeaders',
    pageName: 'FINANCE CLAIM REVIEW',
    headerApiOrderByField: 'batchNo',
    headers: [
      { name: 'Batch No', prop: 'batchNo', isPrimaryLink: true },
      // { name: 'Created By', prop: 'createdBy' },
      { name: 'Created Date', prop: 'createdDate' },
      { name: 'Batch Status', prop: 'batchStatus' },
      { name: 'Amount', prop: 'totalAmount' },
      { name: 'Remarks', prop: 'remarks' }
    ],
    removeUnicodeCharFields: ['batchStatus', 'approvalStatus'],
    selctionType: 'single',
    filterByUserCompanyResCenter: true,
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
      title: 'Finance Claim Review',
      recordId: 'batchNo',
      recordTitle: 'batchNo',
      headerConfig: ClaimReviewHeader,
      lineConfig: ClaimReviewLime,
      calculationSectionConfig: ClaimReviewCalculation,
      informationSectionConfig: {
        documentNoProp: 'batchNo',
        documentType: 'Finance Claim',
        documentStatusProp: 'ClaimReview',
        allowAttachmentUpload: false,
        useSelectedLineForHeaderAttachments: true,
        // informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
      }
    },
    factBoxConfig: {
      boxType: FactBoxType.ClaimReview
    }
  };

  ngOnInit(): void {
    this.getEmpClaimSetup();
  }

  popupLoaded(data: any) {
    let lineData = data.line;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
      })
    }
    //if (data.header.approvalStatus == "Finance Review") {
    this.addItemService.disableAllControlsExceptSome$.next(['remarks']);
    // this.addItemService.disableLineControls$.next(true);
    //}
    this.calculateAmount(data.line)
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'amount':
          this.CalculateAmountOnChange(data);
          break;
      }
    }
    //if (data.header.approvalStatus == "Finance Review") {
    this.addItemService.disableAllControlsExceptSome$.next(['remarks']);
    //}
  }


  getEmpClaimSetup() {
    this.restService.get('/empClaimSetups').subscribe({
      next: (response: any) => {
        const firstId = response?.value?.[0];
        if (firstId) {
          this.claimSetupResponse = firstId;
        } else {
          this.toastr.warning('Unable to find the item');
        }
      },
      error: (err) => {
        this.toastr.warning('Unable to find the item');
      }
    });

  }



  buttonClickEvent(buttonData: CustomButtonEvent) {

    if (buttonData.button.label === 'recalculate') {
      this.recalculate(buttonData);
    }
    else if (buttonData.button.label === 'reloadPreviousMonth') {
      this.createBatchPreviousMonth(buttonData);
    }
    else if (buttonData.button.label === 'createPaymentBatch') {
      this.createPaymentBatch(buttonData);
    }
    else if (buttonData.button.label === 'Return') {
      this.returnReasonMessage(buttonData)
    }
    else if (buttonData.button.label === 'AcceptResubmission') {
      this.AcceptResubmission(buttonData);
    }
    else if (buttonData.button.label === 'ReadyForBatch') {
      this.ReadyForBatch(buttonData);
    }

  }

  // bc function
  recalculate(buttonData: CustomButtonEvent) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.recalculateFromAPI';
    try {
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success(`Claim Successfully added in Finance Review`);
        this.addItemService.showLoader$.next(false);
      });
    }
    finally {
      this.addItemService.reloadHeaderById$.next(buttonData.headerData.systemId);
      this.addItemService.customButtonResponse$.next(true);
    }

  }


  // recalculate(buttonData: any) {
  //   if (buttonData.headerData.batchStatus == 'Draft' || buttonData.headerData.batchStatus == 'Finance Review') {
  //     this.addItemService.showLoader$.next(true);

  //     let data = buttonData.lineData;
  //     this.calculateAmount(data);

  //     const now = new Date();
  //     const claimDate = now.toISOString().split('T')[0];

  //     let filter = "/employeeClaimHeaders";

  //     if (!this.sessionService.SuperAdmin) {
  //       // treat CompanyId as string
  //       let condition = `CompanyId eq ${this.sessionService.Company}`;

  //       if (this.sessionService.ResponsibilityCenterId) {
  //         condition += ` and PortalResponsibilityCentre eq '${this.sessionService.ResponsibilityCenterId}'`;
  //       }

  //       if (filter === "/employeeClaimHeaders") {
  //         filter += `?$filter=${condition}`;
  //       } else {
  //         filter += ` and ${condition}`;
  //       }
  //     }

  //     this.restService.get(filter).subscribe({
  //       next: (res: any) => {
  //         const employeeClaims = Array.isArray(res) ? res : res?.value || [];

  //         if (!employeeClaims.length) {
  //           this.toastr.warning('No employee claims found.');
  //           this.addItemService.showLoader$.next(false);
  //           return;
  //         }

  //         const monthNames = [
  //           'January', 'February', 'March', 'April', 'May', 'June',
  //           'July', 'August', 'September', 'October', 'November', 'December'
  //         ];
  //         const systemDate = new Date();
  //         const systemMonth = monthNames[systemDate.getMonth()];
  //         const systemYear = systemDate.getFullYear();

  //         const matchingClaims = employeeClaims.filter((claim: any) => {
  //           const empClaimMonth = claim.claimMonth;
  //           const empClaimYear = new Date(claim.claimDate).getFullYear();
  //           return (
  //             claim.approvalStatus === 'Approved' &&
  //             claim.batchStatus === 'Approved' &&
  //             empClaimMonth === systemMonth &&
  //             empClaimYear === systemYear
  //           );
  //         });

  //         if (!matchingClaims.length) {
  //           this.toastr.info('No claims match the current month.');
  //           this.addItemService.showLoader$.next(false);
  //           return;
  //         }
  //         if (matchingClaims.length > 0) {
  //           const ifMatchKey = buttonData.headerData['@odata.etag'];
  //           this.restService.patch(
  //             this.config.headerApi + '(' + buttonData.headerData.systemId + ')',
  //             { batchStatus: 'Finance_x0020_Review' },
  //             ifMatchKey
  //           ).subscribe(() => { })
  //         }

  //         from(matchingClaims).pipe(
  //           concatMap((claim: any) => {
  //             return this.restService.get(`/employeeClaimLines?$filter=claimNo eq '${claim.claimNo}'`).pipe(
  //               concatMap((res: any) => {
  //                 const claimLines = Array.isArray(res) ? res : res?.value || [];
  //                 if (!claimLines.length) return of(null);

  //                 return from(claimLines).pipe(
  //                   concatMap((line: any) => {
  //                     const lineData = {
  //                       batchNo: buttonData?.headerData?.batchNo,
  //                       claimNo: claim.claimNo,
  //                       employeeNo: claim.employeeNo,
  //                       employeeName: claim.employeeName,
  //                       expenseType: line.expenseType,
  //                       amount: line.amount,
  //                       glCode: line.glCode || '',
  //                       return: false,
  //                       returnReason: '',
  //                       remarks: line.remarks || claim.remarks,
  //                       recalculate: false,
  //                       batchStatus: 'Finance_x0020_Review',
  //                       inBatch: false,
  //                       sourceClaimNo: claim.claimNo,
  //                       sourceLineNo: line.lineNo,
  //                       description: line.description,
  //                       fromLocation: line.fromLocation,
  //                       toLocation: line.toLocation,
  //                       km: line.km,
  //                       typeOfTransportation: line.typeOfTransportation,
  //                       paymentMethod: line.paymentMethod,
  //                       vat: line.vat,
  //                       vatCode: line.vatCode,
  //                       taxAmount: line.taxAmount,
  //                       clientName: line.clientName,
  //                       job: line.job,
  //                       currencyCode: line.currencyCode,
  //                       departmentCode: line.departmentCode,
  //                       Chargeable: line.Chargeable,
  //                       attachment: line.attachment,
  //                       company: this.sessionService.CompanyName,
  //                       companyId: this.sessionService.Company,
  //                       createdBy: this.sessionService.UserId,
  //                       portalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
  //                       userId: this.sessionService.UserId
  //                     };

  //                     return this.restService
  //                       .get(`/claimReviewLines?$filter=claimNo eq '${claim.claimNo}' and sourceLineNo eq ${line.lineNo}`)
  //                       .pipe(
  //                         concatMap((existingRes: any) => {
  //                           const existingLines = Array.isArray(existingRes) ? existingRes : existingRes?.value || [];
  //                           if (existingLines.length > 0) {
  //                             return of(null);
  //                           }

  //                           return this.restService.post('/claimReviewLines', lineData).pipe(
  //                             concatMap(() => {
  //                               return this.updateEmployeeClaimStatus(
  //                                 claim.claimNo,
  //                                 line.lineNo,
  //                                 "Finance_x0020_Review",
  //                                 claimDate
  //                               );
  //                             })
  //                           );
  //                         })
  //                       );
  //                   })
  //                 );
  //               })
  //             );
  //           }),
  //           finalize(() => {
  //             this.addItemService.customButtonResponse$.next(true);
  //             this.formDataService.updateControlData$.next({ control: 'batchStatus', data: 'Finance Review' });
  //             this.addItemService.showLoader$.next(false);
  //             this.toastr.success(`Claim Successfully added in Finance Review`);
  //           })
  //         ).subscribe();
  //       },
  //       error: () => {
  //         this.toastr.error('Failed to load employee claims.');
  //         this.addItemService.showLoader$.next(false);
  //       }
  //     });
  //   } else {
  //     this.toastr.warning('Batch status is not Finance Review!');
  //   }
  // }





  createBatchPreviousMonth(buttonData: any) {
    if (buttonData.headerData.batchStatus == 'Finance Review') {
      this.addItemService.showLoader$.next(true);

      this.restService.get('/employeeClaimHeaders').subscribe({
        next: (res: any) => {
          const employeeClaims = Array.isArray(res) ? res : res?.value || [];

          if (!employeeClaims.length) {
            this.toastr.warning('No employee claims found.');
            this.addItemService.showLoader$.next(false);
            return;
          }

          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const systemDate = new Date();
          let prevMonthIndex = systemDate.getMonth() - 1;
          let prevMonthYear = systemDate.getFullYear();

          if (prevMonthIndex < 0) {
            prevMonthIndex = 11;
            prevMonthYear--;
          }

          const prevMonthName = monthNames[prevMonthIndex];

          const matchingClaims = employeeClaims.filter((claim: any) => {
            const empClaimMonth = claim.claimMonth;
            const empClaimYear = new Date(claim.claimDate).getFullYear();
            return empClaimMonth === prevMonthName && empClaimYear === prevMonthYear;
          });

          if (!matchingClaims.length) {
            this.toastr.info('No claims match the current month.');
            this.addItemService.showLoader$.next(false);
            return;
          }
          let totalLinesAdded = 0;
          from(matchingClaims).pipe(
            concatMap((claim: any) => {
              return this.restService.get(`/employeeClaimLines?$filter=claimNo eq '${claim.claimNo}'`).pipe(
                concatMap((res: any) => {
                  const claimLines = Array.isArray(res) ? res : res?.value || [];
                  if (!claimLines.length) return of(null);

                  return from(claimLines).pipe(
                    concatMap((line: any) => {
                      const lineData = {
                        batchNo: buttonData?.headerData?.batchNo,
                        claimNo: claim.claimNo,
                        employeeNo: claim.employeeNo,
                        employeeName: claim.employeeName,
                        amount: line.amount,
                        glCode: line.glCode || '',
                        return: false,
                        returnReason: '',
                        remarks: line.remarks || claim.remarks,
                        recalculate: false,
                        status: 'Draft',
                        inBatch: false,
                        sourceClaimNo: claim.claimNo,
                        sourceLineNo: line.lineNo,

                        description: line.description,
                        fromLocation: line.fromLocation,
                        toLocation: line.toLocation,
                        km: line.km,
                        typeOfTransportation: line.typeOfTransportation,
                        paymentMethod: line.paymentMethod,
                        vat: line.vat,
                        vatCode: line.vatCode,
                        taxAmount: line.taxAmount,
                        clientName: line.clientName,
                        job: line.job,
                        Chargeable: line.Chargeable,
                        attachment: line.attachment,

                        company: this.sessionService.CompanyName,
                        companyId: this.sessionService.Company,
                        createdBy: this.sessionService.UserId,
                        portalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
                        userId: this.sessionService.UserId
                      };

                      return this.restService.get(`/claimReviewLines?$filter=sourceClaimNo eq '${claim.claimNo}' and sourceLineNo eq ${line.lineNo}`).pipe(
                        concatMap((existing: any) => {
                          const alreadyExists = existing?.value?.length > 0;
                          if (alreadyExists) {
                            return of(null);
                          }

                          totalLinesAdded++;
                          return this.restService.post('/claimReviewLines', lineData);
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
              this.toastr.success(`${totalLinesAdded} line(s) added into the batch from ${matchingClaims.length} claim(s).`);
            })
          ).subscribe();
        },
        error: () => {
          this.toastr.error('Failed to load employee claims.');
          this.addItemService.showLoader$.next(false);
        }
      });
    } else {
      this.toastr.warning('Batch status is not Finance Review!');
    }
  }





  createPaymentBatch(buttonData: any) {
    this.addItemService.showLoader$.next(true);
    this.restService.get(this.config.addItemConfig!.headerConfig!.api + '(' + buttonData.data[this.config.idProp!] + ')' + this.config.addItemConfig!.lineConfig!.api).subscribe({
      next: (res: any) => {
        const reviewLines = Array.isArray(res) ? res : res?.value || [];
        const unreturnedLines = reviewLines.filter((line: any) => line.return === false);
        if (!unreturnedLines.length) {
          this.toastr.info('No unreturned claims found.');
          this.addItemService.showLoader$.next(false);
          return;
        }
        const paymentHeader = {
          totalClaims: unreturnedLines.length,
          status: 'Draft',

          company: this.sessionService.CompanyName,
          companyId: this.sessionService.Company,
          createdBy: this.sessionService.UserId,
          portalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
          userId: this.sessionService.UserId
        };

        this.restService.post('/claimPaymentHeaders', paymentHeader).subscribe({
          next: (headerResponse: any) => {
            const paymentBatchNo = headerResponse?.batchNo;
            from(unreturnedLines).pipe(
              concatMap((line: any) => {
                const paymentLine = {
                  batchNo: paymentBatchNo,
                  claimNo: line.claimNo,
                  employee: line.employeeNo,
                  amount: line.amount,
                  paymentMethod: line.paymentMethod,
                  status: 'Open',
                  paymentStatus: 'Unpaid',
                  sourceClaimNo: line.sourceClaimNo,
                  sourceLineNo: line.sourceLineNo,
                  reviewBatchNo: line.batchNo,
                  reviewLineNo: line.lineNo,
                  reviewPaymentMethod: line.paymentMethod,

                  description: line.description,
                  fromLocation: line.fromLocation,
                  toLocation: line.toLocation,
                  km: line.km,
                  typeOfTransportation: line.typeOfTransportation,
                  vat: line.vat,
                  vatCode: line.vatCode,
                  taxAmount: line.taxAmount,
                  clientName: line.clientName,
                  job: line.job,
                  Chargeable: line.Chargeable,
                  attachment: line.attachment,


                  company: this.sessionService.CompanyName,
                  companyId: this.sessionService.Company,
                  createdBy: this.sessionService.UserId,
                  portalResponsibilityCentre: this.sessionService.DefaultResponsibilityCenter,
                  userId: this.sessionService.UserId
                };
                return this.restService.post('/claimPaymentLines', paymentLine);
              }),
              finalize(() => {
                this.addItemService.showLoader$.next(false);
                this.addItemService.customButtonResponse$.next(true);
                this.toastr.success(`${unreturnedLines.length} payment line(s) created successfully.`);
              })
            ).subscribe({
              error: (err) => {
                this.toastr.error('Some payment lines could not be added.');
              }
            });
          },
          error: (err) => {
            this.toastr.error('Payment header creation failed.');
            this.addItemService.showLoader$.next(false);
          }
        });
      },
      error: (error: any) => {
        this.toastr.error('Failed to load review lines.');
        this.addItemService.showLoader$.next(false);
      }
    });
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

  //BC function
  async returnReasonMessage(buttonData: any) {
    if (buttonData.headerData.batchStatus !== 'Finance Review') {
      this.toastr.warning('Batch status is not Finance Review!');
      return;
    }
    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );

    if (!selectedIndexes?.length) {
      this.toastr.warning('Please select line(s) to return.');
      return;
    }

    // Ask for reason
    const reason = await this.dialogService.commentBox({
    });

    if (!reason?.value?.trim()) {
      this.toastr.error('Reject reason is required.');
      return;
    }

    //  const reasonText = reason.value.trim();
    const reasonText = encodeURIComponent(reason.value.trim()).replace(/%20/g, '_x0020_')
    this.addItemService.showLoader$.next(true);


    try {
      const selectedLines = selectedIndexes.map((i: number) => buttonData.lineData[i]).filter(l => !!l);
      if (!selectedLines.length) {
        this.toastr.warning('No valid lines selected.');
        this.addItemService.showLoader$.next(false);
        return;
      }
      // const encodedReason = encodeURIComponent(reasonText);

      for (const line of selectedLines) {
        if (!line?.systemId) continue;

        const url = `${this.config.addItemConfig!.lineConfig!.api}(${line.systemId})/Microsoft.NAV.returnReviewLineAPI`;

        try {
          await firstValueFrom(
            this.restService.post(url, { reasonText: reasonText })
          );
        } catch (err) {
          console.error(err);
          this.toastr.error(`Failed to return line ${line.lineNo}.`);
        }
      }

      this.toastr.success('Return process completed.');
    } catch (err) {
      console.error(err);
      this.toastr.error('Unexpected error during return process.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.addItemService.customButtonResponse$.next(true);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }

  //angular fn
  async returnReasonMessage1(buttonData: any) {
    const status = (buttonData.headerData.batchStatus || '').replace(/_x0020_/g, ' ').trim().toLowerCase();

    if (status === 'finance review') {
      const selectedIndexes = await firstValueFrom(
        this.selectedItemService.selectedLines$.pipe(take(1))
      );

      if (!selectedIndexes?.length) {
        this.toastr.warning('Please select line before returning.');
        return;
      }

      const reason = await this.dialogService.commentBox({
      });

      if (!reason?.value) {
        this.selectedItemService.popupUncheckedLineData$.next(true);
        this.toastr.error('Reject reason required.');
        return;
      }

      const reasonValue = reason.value.trim();
      this.addItemService.showLoader$.next(true);

      try {
        if (this.claimSetupResponse.returnOption === 'Document Line') {
          const updatePromises = selectedIndexes.map(async (index: number) => {
            const row = buttonData.lineData[index];
            if (!row || !row.systemId) return;

            if (row.noOfReturns >= this.claimSetupResponse.maxNoOfReturns) {
              this.toastr.error(
                `Your return limit exceeded for claim ${row.claimNo}. Please remove this claim.`
              );
              return;
            }

            const newReason =
              row.return && row.returnReason
                ? `${row.returnReason}, ${reasonValue}`
                : reasonValue;

            const ifMatchKey = row['@odata.etag'];
            const patchData = {
              returnReason: newReason,
              return: true,
              batchStatus: 'Returned',
              noOfReturns: row.noOfReturns + 1,
            };
            const query = `(${row.systemId})`;

            try {
              await firstValueFrom(
                this.restService.patch(
                  this.config.addItemConfig!.lineConfig!.api + query,
                  patchData,
                  ifMatchKey
                )
              );
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
                const empNewReason =
                  claimLine.return && claimLine.returnReason
                    ? `${claimLine.returnReason}, ${reasonValue}`
                    : reasonValue;

                const empIfMatchKey = claimLine['@odata.etag'];
                const empQuery = `(${claimLine.systemId})`;
                try {
                  await firstValueFrom(
                    this.restService.patch(
                      '/employeeClaimLines' + empQuery,
                      {
                        returnReason: empNewReason,
                        return: true,
                        batchStatus: 'Returned',
                      },
                      empIfMatchKey
                    )
                  );
                } catch {
                  this.toastr.error(
                    `Failed to update employeeClaimLine for claim ${row.claimNo} line ${row.lineNo}`
                  );
                }
              }
            } catch {
              this.toastr.error(
                `Could not fetch employeeClaimLines for claim ${row.claimNo} line ${row.lineNo}`
              );
            }
          });

          const results = await Promise.allSettled(updatePromises);
          const hasFailure = results.some((r) => r.status === 'rejected');
          if (!hasFailure) {
            this.toastr.success('Return submitted successfully.');
          }
        }
        else if (this.claimSetupResponse.returnOption === 'Document') {
          const selectedClaims = [
            ...new Set(
              selectedIndexes
                .map((i) => buttonData.lineData[i]?.claimNo)
                .filter((claimNo) => !!claimNo)
            ),
          ];

          if (!selectedClaims.length) {
            this.toastr.error('No valid claim numbers found.');
            return;
          }

          for (const claimNo of selectedClaims) {
            try {
              const claimReviewQuery = `${this.config.addItemConfig!.lineConfig!.api}?$filter=claimNo eq '${claimNo}'`;
              const claimReviewRes: any = await firstValueFrom(this.restService.get(claimReviewQuery));
              const claimReviewLines = Array.isArray(claimReviewRes)
                ? claimReviewRes
                : claimReviewRes?.value || [];

              const deletePromises = claimReviewLines.map(async (line: any) => {
                if (!line?.systemId) return;
                try {
                  await firstValueFrom(
                    this.restService.delete(
                      `${this.config.addItemConfig!.lineConfig!.api}(${line.systemId})`
                    )
                  );
                } catch {
                  this.toastr.error(`Failed to delete claimReview line for claim ${line.claimNo}`);
                }
              });
              await Promise.allSettled(deletePromises);
              const headerQuery = `/employeeClaimHeaders?$filter=claimNo eq '${claimNo}'`;
              const headerRes: any = await firstValueFrom(this.restService.get(headerQuery));
              const empHeaders = Array.isArray(headerRes) ? headerRes : headerRes?.value || [];

              for (const header of empHeaders) {
                if (!header?.systemId) continue;
                try {
                  await firstValueFrom(
                    this.restService.patch(
                      `/employeeClaimHeaders(${header.systemId})`,
                      { batchStatus: 'Draft', approvalStatus: 'Open' },
                      header['@odata.etag']
                    )
                  );
                } catch {
                  this.toastr.error(`Failed to update header for claim ${claimNo}`);
                }
              }

              const empLineQuery = `/employeeClaimLines?$filter=claimNo eq '${claimNo}'`;
              const empLineRes: any = await firstValueFrom(this.restService.get(empLineQuery));
              const empLines = Array.isArray(empLineRes) ? empLineRes : empLineRes?.value || [];

              for (const line of empLines) {
                if (!line?.systemId) continue;
                const empNewReason =
                  line.return && line.returnReason
                    ? `${line.returnReason}, ${reasonValue}`
                    : reasonValue;

                try {
                  await firstValueFrom(
                    this.restService.patch(
                      `/employeeClaimLines(${line.systemId})`,
                      {
                        approvalStatus: 'Open',
                        returnReason: empNewReason,
                        return: true,
                        batchStatus: 'Draft',
                      },
                      line['@odata.etag']
                    )
                  );
                } catch {
                  this.toastr.error(`Failed to update employeeClaimLine for claim ${claimNo}`);
                }
              }

              this.toastr.success(`Claim ${claimNo} returned successfully and set to Draft/Open.`);
            } catch (err) {
              this.toastr.error(`Failed to process claim ${claimNo}`);
            }
          }
        }
      } finally {
        this.addItemService.customButtonResponse$.next(true);
        this.addItemService.showLoader$.next(false);
        this.selectedItemService.popupUncheckedLineData$.next(true);
      }
    } else {
      this.toastr.warning('Batch status is not Finance Review!');
    }
  }

  //BC function
  async AcceptResubmission(buttonData: any) {
    const selectedIndexes = await firstValueFrom(
      this.selectedItemService.selectedLines$.pipe(take(1))
    );

    if (!selectedIndexes?.length) {
      this.toastr.warning('Please select line(s) to accept resubmission.');
      return;
    }
    this.addItemService.showLoader$.next(true);

    try {
      const selectedLines = selectedIndexes
        .map((i: number) => buttonData.lineData[i])
        .filter((line: any) => !!line);

      if (!selectedLines.length) {
        this.toastr.warning('No valid lines selected.');
        return;
      }
      for (const line of selectedLines) {
        if (!line?.systemId) continue;

        const url = `${this.config.addItemConfig!.lineConfig!.api}(${line.systemId})/Microsoft.NAV.acceptResubmissionAPI`;

        try {
          await firstValueFrom(this.restService.post(url, {}));
          // this.toastr.success(`Line ${line.lineNo} resubmission accepted.`);
        } catch (err) {
          console.error(`Error accepting resubmission for line ${line.lineNo}:`, err);
        }
      }

      this.toastr.success('Resubmission acceptance process completed.');
    } catch (err) {
      console.error('Unexpected error during resubmission acceptance:', err);
      this.toastr.error('Unexpected error during resubmission acceptance.');
    } finally {
      this.addItemService.showLoader$.next(false);
      this.addItemService.customButtonResponse$.next(true);
    }
  }



  //Angular fn
  async AcceptResubmission1(buttonData: any) {
    if (buttonData.headerData.batchStatus !== 'Finance Review') {
      this.toastr.warning('Batch status is not Finance Review!');
      return;
    }

    this.addItemService.showLoader$.next(true);

    try {
      const selectedIndexes = await firstValueFrom(
        this.selectedItemService.selectedLines$.pipe(take(1))
      );

      if (!selectedIndexes?.length) {
        this.toastr.warning("Please select line before accepting resubmission.");
        return;
      }

      const updatePromises = selectedIndexes.map(async (index: number) => {
        const row = buttonData.lineData[index];
        if (!row?.systemId) return;

        if (row.batchStatus !== "ReSubmitted") {
          this.toastr.warning(
            `Review ${row.batchNo} line ${row.lineNo}: No ReSubmitted batch status found.`
          );
          return;
        }

        try {
          const filterQuery = `/employeeClaimLines?$filter=claimNo eq '${row.sourceClaimNo}' and lineNo eq ${row.sourceLineNo}`;
          const res: any = await firstValueFrom(this.restService.get(filterQuery));
          const employeeClaimLines = Array.isArray(res) ? res : res?.value || [];
          const empLine = employeeClaimLines[0];

          if (!empLine?.systemId) {
            this.toastr.warning(`Employee claim line not found for ${row.claimNo}/${row.lineNo}`);
            return;
          }

          const {
            description,
            fromLocation,
            toLocation,
            km,
            typeOfTransportation,
            vat,
            vatCode,
            taxAmount,
            amount,
            clientName,
            job,
            Chargeable,
            attachment,
            remarks,
            paymentMethod
          } = empLine;

          const empIfMatchKey = empLine["@odata.etag"];
          await firstValueFrom(
            this.restService.patch(
              `/employeeClaimLines(${empLine.systemId})`,
              { batchStatus: "Finance_x0020_Review" },
              empIfMatchKey
            )
          );

          const reviewIfMatchKey = row["@odata.etag"];
          await firstValueFrom(
            this.restService.patch(
              `${this.config.addItemConfig!.lineConfig!.api}(${row.systemId})`,
              {
                batchStatus: "Finance_x0020_Review",
                description,
                fromLocation,
                toLocation,
                km,
                typeOfTransportation,
                vat,
                vatCode,
                taxAmount,
                amount,
                clientName,
                job,
                Chargeable,
                attachment,
                remarks,
                paymentMethod
              },
              reviewIfMatchKey
            )
          );
        } catch (error) {
          this.toastr.error(`Failed to resubmit claim ${row.claimNo} line ${row.lineNo}`);
        }
      });

      await Promise.allSettled(updatePromises);

      this.recalculate(buttonData);

      this.toastr.success("Line(s) resubmitted successfully.");

    } catch (error) {
      this.toastr.error("An unexpected error occurred during resubmission.");
    } finally {
      this.addItemService.customButtonResponse$.next(true);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }






  // bc function
  ReadyForBatch(buttonData: CustomButtonEvent) {
    this.addItemService.showLoader$.next(true);
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.readyForPaymentBatch';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success(`Claim Successfully added in Ready for batch.`);
      this.addItemService.showLoader$.next(false);
      this.addItemService.customButtonResponse$.next(true);
    });
  }


  //angular fn 
  ReadyForBatch1(buttonData: any) {
    this.addItemService.showLoader$.next(true);
    if (!buttonData?.lineData?.length) {
      this.toastr.warning("No line data found.");
      this.addItemService.showLoader$.next(false);
      return;
    }

    const allPending = buttonData.lineData.every(
      (line: any) => line.batchStatus === "Finance Review"
    );

    const headerOk = buttonData?.headerData?.batchStatus === "Finance Review";

    if (allPending && headerOk) {
      const payload = { batchStatus: "Ready For Batch" };

      const headerEtag = buttonData.headerData["@odata.etag"];
      const headerPatch$ = this.restService.patch(
        this.config.headerApi + "(" + buttonData.headerData.systemId + ")",
        payload,
        headerEtag
      );

      const linePatchCalls = buttonData.lineData.map((line: any) => {
        const etag = line["@odata.etag"];
        const reviewLine$ = this.restService.patch(
          this.config.addItemConfig!.lineConfig!.api + "(" + line.systemId + ")",
          payload,
          etag
        );

        const empLine$ = this.updateEmployeeClaimStatus(
          line.sourceClaimNo,
          line.sourceLineNo,
          "Ready_x0020_For_x0020_Batch"
        );

        return forkJoin([reviewLine$, empLine$]);
      });

      forkJoin([headerPatch$, ...linePatchCalls]).subscribe({
        next: () => {
          this.toastr.success("Ready for batch.");
          this.addItemService.customButtonResponse$.next(true);
          this.addItemService.showLoader$.next(false);
        },
        error: () => {
          this.toastr.error("Failed Ready for batch.");
          this.addItemService.showLoader$.next(false);
        },
      });

    } else {
      if (!headerOk) {
        this.toastr.warning("Header is not in Finance Review status.");
      }
      if (!allPending) {
        this.toastr.warning("Line(s) are not in Finance Review status.");
      }
      this.addItemService.showLoader$.next(false);
    }
  }


  private headerPatchInProgress: Set<string> = new Set();

  updateEmployeeClaimStatus(claimNo: string, sourceLineNo: number, newStatus: string, claimDate?: any): Observable<any> {
    return this.restService
      .get(`/employeeClaimLines?$filter=claimNo eq '${claimNo}' and lineNo eq ${sourceLineNo}`)
      .pipe(
        concatMap((res: any) => {
          const empLines = Array.isArray(res) ? res : res?.value || [];
          if (!empLines.length) return of(null);

          const empLine = empLines[0];
          const empEtag = empLine["@odata.etag"];

          const patchData: any = { batchStatus: newStatus };
          if (claimDate) {
            patchData.claimDate = claimDate;
          }

          return this.restService
            .patch(`/employeeClaimLines(${empLine.systemId})`, { batchStatus: newStatus }, empEtag)
            .pipe(
              concatMap(() => this.restService.get(`/employeeClaimLines?$filter=claimNo eq '${claimNo}'`)),
              concatMap((allRes: any) => {
                const allEmpLines = Array.isArray(allRes) ? allRes : allRes?.value || [];
                const allUpdated = allEmpLines.every((l: any) => l.batchStatus === newStatus);

                if (allUpdated && !this.headerPatchInProgress.has(claimNo)) {
                  this.headerPatchInProgress.add(claimNo);

                  return this.restService
                    .get(`/employeeClaimHeaders?$filter=claimNo eq '${claimNo}'`)
                    .pipe(
                      concatMap((hdrRes: any) => {
                        const headers = Array.isArray(hdrRes) ? hdrRes : hdrRes?.value || [];
                        if (!headers.length) return of(null);

                        const header = headers[0];
                        const hdrEtag = header["@odata.etag"];

                        return this.restService
                          .patch(`/employeeClaimHeaders(${header.systemId})`, patchData, hdrEtag)
                          .pipe(finalize(() => this.headerPatchInProgress.delete(claimNo)));
                      })
                    );
                }

                return of(null);
              })
            );
        })
      );
  }

}
