import { Component } from '@angular/core';
import { EmployeeClaimSetupConfig } from './employee-claim-setup.config'
import { ItemConfig } from '../../../core/models/shared/item.config';
import { ActivatedRoute, Router } from '@angular/router';
import { EventDataModel } from '../../../core/models/shared/eventDataModel';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { RestService } from '../../../core/services/rest.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-employee-claim-setup',
  template: '<app-add-item [config]="config" (pageLoaded)="pageLoaded($event)" (changeEvent)="changeEvent($event)"></app-add-item>'
})
export class EmployeeClaimSetupComponent {

  constructor(private router: Router,
    private route: ActivatedRoute,
    private formFielService: FormFieldService,
    private restService: RestService,
    private formDataService: FormDataService,
    private toastr: ToastrService,
  ) { }

  public config: ItemConfig = {
    title: 'Claim Setup',
    recordId: '',
    recordTitle: '',
    headerConfig: EmployeeClaimSetupConfig,
    returnUrl: '/claimSetupHome/ruleSetup',
  }

  pageLoaded(data: any) {
    if (data?.header?.paymentJournalTemplate) {
      this.paymentJournalBatch(data?.header?.paymentJournalTemplate)
    }
  }

  changeEvent(data: EventDataModel) {
    if (data.control === 'paymentJournalTemplate') {
      this.paymentJournalBatch(data.data);
    }
    else if (data.control === 'maxClaimsAmountPerMonth') {
      this.maxClaimsAmountPerMonth(data);
    }
    else if (data.control === 'maxClaimAmountPerLine') {
      this.maxClaimAmountPerLine(data);
    }

  }


  paymentJournalBatch(data: any) {
    this.formDataService.updateControlData$.next({ control: 'paymentJournalBatch', data: ' ' })
    let filterValue = data;
    let url = `/genJnlBatchs?$filter=journalTemplateName eq '${filterValue}'`
    this.restService.get(url).subscribe((res: any) => {
      let journalBatchData = res.value || [];
      setTimeout(() => {
        this.formFielService.updateDropdownItem$.next({
          label: 'paymentJournalBatch',
          items: journalBatchData,
          displayFormat: '[name]',
          bindValue: 'name',
        });
      }, 100)
    })
  }




  maxClaimsAmountPerMonth(data: any) {
    const maxPerLine = data.activeData.maxClaimAmountPerLine;
    const maxPerMonth = data.data;
    if (maxPerMonth == 0) {
      return true;
    }
    if (maxPerMonth > 0) {
      if (maxPerLine > maxPerMonth) {
        this.formDataService.updateControlData$.next({ control: 'maxClaimAmountPerMonth', data: 0 })
        this.toastr.error(
          `Max Claim Amount Per Month cannot be less than Max Claim Amount Per Line.`
        );
        return false;
      }
    }
    return true;
  }


  maxClaimAmountPerLine(data: any) {
    const maxPerMonth = data.activeData.maxClaimsAmountPerMonth;
    const maxPerLine = data.data;

    if (maxPerMonth == 0) {
      return true;
    }

    if (maxPerLine > maxPerMonth) {
      this.toastr.error(`Max Claim Amount Per Line cannot be greater than Max Claim Amount Per Month.`);
      this.formDataService.updateControlData$.next({ control: 'maxClaimAmountPerLine', data: 0 })
      return false;
    }
    return true;
  }

  //--------------------------------------------------
  endDateSet(data: any) {
    const start = data?.activeData?.startDate;
    const end = data?.data;
    const limitPeriod = (data?.activeData?.limitPeriod || '').trim();

    // 🧩 Validate required inputs
    if (!start || !end || !limitPeriod) {
      this.toastr.error('Please select Start Date, End Date, and Limit Period.');
      return false;
    }

    // 🧩 Convert NgbDateStruct → JS Date
    const startDate = new Date(start.year, start.month - 1, start.day);
    const endDate = new Date(end.year, end.month - 1, end.day);

    // 🧩 Format into yyyy-MM-dd
    const formatDate = (date: Date): string =>
      date.toISOString().split('T')[0];

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    console.log('Start Date =', startDateStr);
    console.log('End Date =', endDateStr);

    // 🧩 Validate parsed dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      this.toastr.error('Invalid Start Date or End Date.');
      return false;
    }

    // 🧩 Ensure End Date ≥ Start Date
    if (endDate < startDate) {
      this.toastr.error('End Date cannot be earlier than Start Date.');
      this.formDataService.updateControlData$.next({
        control: 'endDate',
        data: startDateStr,
      });
      return false;
    }

    // 🧮 Calculate the difference in days
    const diffDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let minDaysRequired = 0;
    let periodLabel = '';

    switch (limitPeriod.toLowerCase()) {
      case 'monthly':
      case 'month':
        minDaysRequired = 30;
        periodLabel = 'one month';
        break;
      case 'quarterly':
      case 'quarter':
        minDaysRequired = 90;
        periodLabel = 'one quarter';
        break;
      case 'yearly':
      case 'year':
        minDaysRequired = 365;
        periodLabel = 'one year';
        break;
      default:
        this.toastr.error('Invalid Limit Period.');
        return false;
    }

    console.log('diffDays =', diffDays, 'minDaysRequired =', minDaysRequired);
    if (diffDays > minDaysRequired) {
      this.toastr.warning(
        `Rule period is shorter than ${periodLabel}. Please review.`
      );

      // ⏪ Reset End Date back to Start Date
      this.formDataService.updateControlData$.next({
        control: 'endDate',
        data: startDateStr,
      });
      return false;
    }
    return true;
  }







}
