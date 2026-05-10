import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { SubmittedClaimJournalComponent } from './submitted-claim-journal/submitted-claim-journal.component';
import { JournalClaimComponent } from './journal-claim/journal-claim.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'journal',
        pathMatch: 'full'
      },
      {
        path: 'claim',
        component: JournalClaimComponent
        // component: ClaimJournalComponent
      },
      {
        path: 'submitted-claim',
        component: SubmittedClaimJournalComponent
      },

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JournalRoutingModule { }
