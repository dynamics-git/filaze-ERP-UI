import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailTemplateComponent } from './email-template/email-template.component';

const routes: Routes = [
   {
      path: '',
      children: [
        {
          path: '',
          redirectTo: 'setup',
          pathMatch: 'full'
        },
        {
          path: 'email',
          component: EmailTemplateComponent
        },
      ]
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TemplateRoutingModule { }
