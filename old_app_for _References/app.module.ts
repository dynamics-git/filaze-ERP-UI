import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, DatePipe, DecimalPipe, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/* Routing */
import { AppRoutingModule } from './app-routing.module';

/* Bootstrap / UI */
import { NgbModule, NgbPopoverModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';

/* Select / Dropdowns */
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

/* Charts / Visual */

/* Root */
import { AppComponent } from './app.component';

/* Layout */
import { BaseLayoutComponent } from './layout/base-layout/base-layout.component';
import { AppsLayoutComponent } from './layout/apps-layout/apps-layout.component';
import { PagesLayoutComponent } from './layout/pages-layout/pages-layout.component';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';

/* Header */
import { HeaderComponent } from './layout/shell/header/header.component';
// import { MegamenuComponent } from './layout/shell/header/elements/mega-menu/mega-menu.component';
// import { MegapopoverComponent } from './layout/shell/header/elements/mega-menu/elements/megapopover.component';
import { UserBoxComponent } from './layout/shell/header/elements/user-box/user-box.component';
import { ChangePasswordModalComponent } from './layout/shell/header/elements/change-password-modal/change-password-modal.component';

/* Workspace Navigation */
import { WorkspaceNavComponent } from './layout/shell/navigation/workspace-nav/workspace-nav.component';

/* Footer */
import { FooterComponent } from './layout/shell/footer/footer.component';
import { FooterDotsComponent } from './layout/shell/footer/elements/footer-dots/footer-dots.component';
import { FooterMenuComponent } from './layout/shell/footer/elements/footer-menu/footer-menu.component';

/* Shared */
import { SharedModule } from './shared/shared.module';

/* Services */
import { ThemeOptions } from './layout/theme-options.model';
import { InterceptService } from './core/interceptors/http-interceptor';
import { SessionService } from './core/services/session.service';
import { DataTableService } from './core/services/shared/data-table.service';
import { DrawerComponent } from './layout/shell/header/elements/drawer/drawer.component';
import { UserProfileComponent } from './layout/shell/header/elements/user-profile/user-profile.component';
import { ManageProfileImageComponent } from './layout/shell/header/elements/manage-profile-image/manage-profile-image.component';

@NgModule({
  declarations: [
    AppComponent,

    BaseLayoutComponent,
    AppsLayoutComponent,
    PagesLayoutComponent,
    DashboardLayoutComponent,

    HeaderComponent,
    // MegamenuComponent,
    // MegapopoverComponent,
    UserBoxComponent,
    ChangePasswordModalComponent,

    WorkspaceNavComponent,
    DrawerComponent,
    FooterComponent,
    FooterDotsComponent,
    FooterMenuComponent,
    UserProfileComponent,
    ManageProfileImageComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,

    AppRoutingModule,
    RouterModule,
    HttpClientModule,

    FormsModule,
    ReactiveFormsModule,

    NgbModule,
    NgbPopoverModule,

    NgxSkeletonLoaderModule,

    ToastrModule.forRoot({
      timeOut: 3000,
      closeButton: true
    }),

    LoadingBarRouterModule,

    SelectDropDownModule,
    NgMultiSelectDropDownModule,
    SharedModule,
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptService,
      multi: true
    },
    ThemeOptions,
    SessionService,
    DataTableService,
    NgbActiveModal,
    DatePipe,
    DecimalPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }