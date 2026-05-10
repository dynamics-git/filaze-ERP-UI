import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClaimJournalComponent } from './claim-journal/claim-journal.component';
import { JournalRoutingModule } from './journal.routing';
import { SubmittedClaimJournalComponent } from './submitted-claim-journal/submitted-claim-journal.component';
import { JournalClaimComponent } from './journal-claim/journal-claim.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ClaimJournalComponent,
    SubmittedClaimJournalComponent,
    JournalClaimComponent],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    JournalRoutingModule
  ]
})
export class JournalModule { }
