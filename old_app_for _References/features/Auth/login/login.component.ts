// import { Component, OnInit } from '@angular/core';
// import { DatePipe } from '@angular/common';
// import { Router } from '@angular/router';
// import {
//   UntypedFormGroup,
//   UntypedFormBuilder,
//   UntypedFormControl,
//   Validators,
// } from '@angular/forms';
// import { HttpClient, HttpHeaders } from '@angular/common/http';

// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { v4 as uuidv4 } from 'uuid';
// import { ToastrService } from 'ngx-toastr';
// import { CookieService } from 'ngx-cookie-service';

// import { environment } from '../../../../environments/environment.development';
// import { RestService } from '../../../core/services/rest.service';
// import { AuthService } from '../../../core/services/auth/auth.service';
// import { SessionService } from '../../../core/services/session.service';
// import { EncryptDecryptService } from '../../../core/services/shared/encrypt-decrypt.service';
// import { AddItemService } from '../../../core/services/shared/add-item.service';
// import { LicenseTransferComponent } from '../license-transfer/license-transfer.component';

// declare var $: any;

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss',
// })
// export class LoginComponent implements OnInit {
//   private apiUrl: string = environment.api;

//   submitted: boolean = false;
//   loginForm!: UntypedFormGroup;
//   slideConfig2 = {
//     className: 'center',
//     centerMode: true,
//     infinite: true,
//     centerPadding: '0',
//     slidesToShow: 1,
//     speed: 500,
//     dots: true,
//   };
//   lic: any;
//   mssg: any;
//   bttndsbl: any;
//   companies: any[] = [];
//   wrongPassCount: number = 0;
//   licensePermission!: boolean;
//   IP: any;
//   deviceInfo = null;

//   constructor(
//     private fb: UntypedFormBuilder,
//     private restService: RestService,
//     private router: Router,
//     private toastr: ToastrService,
//     private authService: AuthService,
//     public sessionService: SessionService,
//     private cookie: CookieService,
//     private httpclient: HttpClient,
//     private encryptService: EncryptDecryptService,
//     private modal: NgbModal,
//     private addItemService: AddItemService,
//     private datePipe: DatePipe
//   ) {
//     const myGuid = uuidv4();
//     this.IP = uuidv4();
//     this.sessionService.IP = myGuid;
//   }

//   ngOnInit() {
//     this.getAccessToken();
//     this.loginForm = this.fb.group({
//       company: new UntypedFormControl(null, [Validators.required]),
//       username: new UntypedFormControl({ value: null, disabled: true }, [
//         Validators.required,
//         Validators.email,
//       ]),
//       password: new UntypedFormControl({ value: null, disabled: true }, [
//         Validators.required,
//       ]),
//     });

//     this.Comapny?.valueChanges.subscribe((value) => {
//       this.UserName?.enable();
//       this.Password?.enable();
//     });
//   }

//   getAccessToken() {
//     this.restService.getOAuth2Token().subscribe((response: any) => {
//       if (response) {
//         localStorage.setItem('access-token', response.access_token);
//         this.getCompanies();
//       } else {
//         this.toastr.error('Token generation failed');
//       }
//     });
//   }

//   getCompanies() {
//     this.authService.getCompanies().subscribe((response: any) => {
//       this.companies = response.value;
//     });
//   }

//   get Comapny() {
//     return this.loginForm.get('company');
//   }
//   get UserName() {
//     return this.loginForm.get('username');
//   }
//   get Password() {
//     return this.loginForm.get('password');
//   }

//   getEmailInputValue() {
//     this.validateEmailInputValue(this.UserName?.value).then((validated) => {
//       validated ? this.getLastLogin() : '';
//     });
//   }

//   async validateEmailInputValue(value: string) {
//     const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
//     let regexValidator: boolean = false;
//     regexValidator = emailRegex.test(value);
//     return await regexValidator;
//   }

//   patch_lastLogin_id: string = '';

//   getLastLogin() {
//     this.authService
//       .getUserDeatils(this.Comapny?.value, this.UserName?.value)
//       .subscribe(
//         (response: any) => {
//           if (response.value.length > 0) {
//             console.log(response.value);
//             console.log(response.value[0].LastLoginDateTime);
//             console.log(
//               this.datePipe.transform(
//                 response.value[0].LastLoginDateTime,
//                 'dd MMM yyyy HH:mm a'
//               )
//             );
//             if (response.value[0].Id) {
//               this.patch_lastLogin_id = response.value[0].Id;
//             }

//             if (response.value[0].LastLoginDateTime) {
//               this.sessionService.UserLastLoginInfo = this.datePipe.transform(
//                 response.value[0].LastLoginDateTime,
//                 'dd MMM yyyy HH:mm a'
//               );
//             }
//           } else {
//             this.toastr.error('Email is not registered!');
//           }
//         },
//         (error) => {
//           // this.toastr.error('Something went wrong! Please try again...');
//         }
//       );
//   }

//   patchLastLogin() {
//     let date = new Date();
//     let login_time = this.datePipe.transform(date, 'dd MMM yyyy HH:mm a');
//     this.sessionService.UserLastLoginInfo = login_time;

//     const ifMatchKey = '*';
//     let patchData = {
//       LastLoginDateTime: date,
//     };
//     this.authService
//       .patchUserDeatils(
//         this.Comapny?.value,
//         this.patch_lastLogin_id,
//         patchData,
//         ifMatchKey
//       )
//       .subscribe((res: any) => {});
//   }

//   login() {
//     this.submitted = true;
//     if (this.loginForm.valid) {
//       this.authService
//         .getUserDeatils(this.Comapny?.value, this.UserName?.value)
//         .subscribe(
//           (response: any) => {
//             if (response.value.length > 0) {
//               const user = response.value[0];
//               const decryptedPassword = this.encryptService.decrypt(
//                 user['PasswordHash']
//               );
//               if (decryptedPassword === this.Password?.value) {
//                 this.patchLastLogin(); //this call is for patching latest login time.
//                 if (user.UserName === 'admin@tecsa.com.my') {
//                   this.cookie.set('cenergi-user-details', JSON.stringify(user));
//                   this.sessionService.Company = this.Comapny?.value;
//                   this.sessionService.CompanyName = this.companies.filter(
//                     (x) => x.id === this.Comapny?.value
//                   )[0].name;
//                   this.sessionService.User = user;
//                   this.sessionService.ResponsibilityCenter = null;
//                   this.SendUserDate();
//                   this.router.navigate(['/home']);
//                 } else {
//                   this.sessionService.Company = this.Comapny?.value;
//                   this.sessionService.User = user;
//                   this.addItemService.showLoader$.next(true);
//                   this.getIpCliente(user);
//                 }
//               } else {
//                 this.wrongPassCount = this.wrongPassCount + 1;
//                 if (this.wrongPassCount > 2) {
//                   this.wrongPassCount = 0;
//                   this.toastr.error('Password reset! Please check your mail');
//                 } else {
//                   this.toastr.error('Password is incorrect!');
//                 }
//               }
//             } else {
//               this.toastr.error('Email is not registered!');
//             }
//           },
//           (error) => {
//             this.toastr.error('Login Failed!');
//           }
//         );
//     }
//   }

//   checkUserCompanyPermission(user: any, companyId: string) {
//     this.authService
//       .getUserCompanyPermission(user.UserId, companyId)
//       .subscribe((response: any) => {
//         if (response.value && response.value.length > 0) {
//           const permission = response.value.filter(
//             (x: any) => x.AccessAllCompany || x.CompanyId === companyId
//           )[0];
//           if (permission) {
//             this.getUserRoleDetails(user, this.Comapny?.value);
//           } else {
//             this.toastr.error(
//               "User does't have permission to selected Company."
//             );
//           }
//         } else {
//           this.toastr.error("User does't have permission to selected Company.");
//         }
//       });
//   }

//   getUserRoleDetails(user: any, companyId: string) {
//     this.authService
//       .getUserRoleDetails(user.RoleId)
//       .subscribe((response: any) => {
//         if (response && response.value.length > 0) {
//           const userRole = response.value[0];
//           if (userRole.IsSuperAdmin) {
//             this.cookie.set('cenergi-user-details', JSON.stringify(user));
//             this.sessionService.SuperAdmin = true;
//             this.sessionService.Company = this.Comapny?.value;
//             this.sessionService.CompanyName = this.companies.filter(
//               (x) => x.id === this.Comapny?.value
//             )[0].name;
//             this.sessionService.User = user;
//             this.sessionService.DefaultResponsibilityCenter =
//               user.DefaultResponsibilityCentre;
//             this.sessionService.ResponsibilityCenter = null;
//             this.SendUserDate();
//             this.router.navigate(['/home']);
//           } else {
//             this.getUserResponsibilityCenterPermission(user, companyId);
//           }
//         } else {
//           this.getUserResponsibilityCenterPermission(user, companyId);
//         }
//       });
//   }

//   getUserResponsibilityCenterPermission(user: any, companyId: string) {
//     this.authService
//       .getUserResponsibilityCenterPermission(user.UserId, companyId)
//       .subscribe((response: any) => {
//         const result = response.value.filter(
//           (x: any) => x.AccessAllCompany || x.CompanyId === companyId
//         );
//         if (result.length > 0) {
//           this.cookie.set('cenergi-user-details', JSON.stringify(user));
//           this.sessionService.Company = companyId;
//           this.sessionService.CompanyName = this.companies.filter(
//             (x) => x.id === companyId
//           )[0].name;
//           this.sessionService.User = user;
//           this.sessionService.DefaultResponsibilityCenter =
//             user.DefaultResponsibilityCentre;
//           if (result.filter((x: any) => x.AccessAllResCentre).length > 0) {
//             this.sessionService.ShowAllResCenters = true;
//             this.sessionService.ResponsibilityCenters = [];
//           } else {
//             this.sessionService.ShowAllResCenters = false;
//             this.sessionService.ResponsibilityCenters = result;
//             this.sessionService.ResponsibilityCenter = result[0];
//             if (this.sessionService.DefaultResponsibilityCenter) {
//             } else {
//               this.sessionService.DefaultResponsibilityCenter = result[0];
//             }
//           }

//           this.sessionService.ShowResCenterSelection = true;
//           this.SendUserDate();
//           this.router.navigate(['/home']);
//         } else {
//           this.toastr.error(
//             'User is not configured with any Responsibility Center.  Contact your admin for more information.'
//           );
//         }
//       });
//   }

//   logOut() {
//     let username = this.sessionService.UserName;
//     this.httpclient
//       .get(this.apiUrl + '/Users/Logout?email=' + username)
//       .subscribe((datalogout: any) => {
//         this.sessionService.User = null;
//         this.cookie.set('cenergi-user-details', '');
//       });
//   }

//   SendUserDate() {
//     let payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.sessionService.IP,
//     };

//     // this.httpclient.post(environment.lisenceApiCore + 'StoreLoggedUser', payload, this.restService.httpLicenseCheckOptions).subscribe((response: any) => {
//     //   if (response) {
//     //     console.log(response.data);
//     // this.sessionService.UserLiseceLoginIfo = response.data;
//     this.router.navigate(['/home']);
//     //   }
//     // }, error => {
//     //   this.toastr.error('something went wrong press f5');
//     // });
//   }

//   getIpCliente(user: any) {
//     this.licensecheck(user);
//   }

//   get httpOptions() {
//     return {
//       headers: new HttpHeaders({
//         apiKey: environment.licenseCheckToken,
//       }),
//     };
//   }

//   licensecheck(user: any) {
//     let payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.IP,
//     };

//     this.httpclient
//       .post(
//         environment.lisenceApiCore + 'CheckLoginPermission',
//         payload,
//         this.httpOptions
//       )
//       .subscribe(
//         (response: any) => {
//           if (response) {
//             if (response.PassToLogin) {
//               this.sessionService.licensePermission = true;
//               this.licensePermission = true;
//               if (this.sessionService.licensePermission) {
//                 if (response.NeedToTransferLogin) {
//                   const modalRef = this.modal.open(LicenseTransferComponent, {
//                     backdrop: 'static',
//                   });
//                   modalRef.result.then(
//                     (result) => {
//                       if (result) {
//                         this.transferLogin();
//                         console.log(result);
//                         this.checkUserCompanyPermission(
//                           user,
//                           this.Comapny?.value
//                         );
//                         this.addItemService.showLoader$.next(false);
//                       } else {
//                         localStorage.removeItem('cenergi-user-details');
//                         localStorage.removeItem('cenergi-comapny');
//                         localStorage.removeItem('cenergi-comapny-name');
//                         localStorage.removeItem(
//                           'cenergi-responsibility-center'
//                         );
//                         localStorage.removeItem(
//                           'cenergi-responsibility-centers'
//                         );
//                         localStorage.removeItem('cenergi-super-admin');
//                         localStorage.removeItem(
//                           'cenergi-show-res-center-selection'
//                         );
//                         localStorage.removeItem('cenergi-show-all-res-centers');
//                         localStorage.removeItem(
//                           'cenergi-default-responsibility-center'
//                         );
//                         localStorage.removeItem('cenergi-licensePermission');
//                         localStorage.removeItem('cenergi-user-ip');
//                         localStorage.removeItem('cenergi-Lisence-details');
//                       }
//                     },
//                     (error) => {
//                       localStorage.removeItem('cenergi-user-details');
//                       localStorage.removeItem('cenergi-comapny');
//                       localStorage.removeItem('cenergi-comapny-name');
//                       localStorage.removeItem('cenergi-responsibility-center');
//                       localStorage.removeItem('cenergi-responsibility-centers');
//                       localStorage.removeItem('cenergi-super-admin');
//                       localStorage.removeItem(
//                         'cenergi-show-res-center-selection'
//                       );
//                       localStorage.removeItem('cenergi-show-all-res-centers');
//                       localStorage.removeItem(
//                         'cenergi-default-responsibility-center'
//                       );
//                       localStorage.removeItem('cenergi-licensePermission');
//                       localStorage.removeItem('cenergi-user-ip');
//                       localStorage.removeItem('cenergi-Lisence-details');
//                     }
//                   );
//                 } else {
//                   this.checkUserCompanyPermission(user, this.Comapny?.value);
//                   this.addItemService.showLoader$.next(false);
//                 }
//               } else {
//                 this.addItemService.showLoader$.next(false);
//                 localStorage.removeItem('cenergi-user-details');
//                 localStorage.removeItem('cenergi-comapny');
//                 localStorage.removeItem('cenergi-comapny-name');
//                 localStorage.removeItem('cenergi-responsibility-center');
//                 localStorage.removeItem('cenergi-responsibility-centers');
//                 localStorage.removeItem('cenergi-super-admin');
//                 localStorage.removeItem('cenergi-show-res-center-selection');
//                 localStorage.removeItem('cenergi-show-all-res-centers');
//                 localStorage.removeItem(
//                   'cenergi-default-responsibility-center'
//                 );
//                 localStorage.removeItem('cenergi-licensePermission');
//                 localStorage.removeItem('cenergi-user-ip');
//                 localStorage.removeItem('cenergi-Lisence-details');
//               }
//             } else {
//               this.toastr.error(response.Message);
//               this.sessionService.licensePermission = false;
//               this.licensePermission = false;
//               this.addItemService.showLoader$.next(false);
//             }
//           }
//         },
//         (error) => {
//           this.toastr.error('something went wrong pres f5');
//           this.addItemService.showLoader$.next(false);
//         }
//       );
//   }

//   transferLogin() {
//     let payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.IP,
//     };
//     this.httpclient
//       .post(
//         environment.lisenceApiCore + 'TransferLogin',
//         payload,
//         this.httpOptions
//       )
//       .subscribe((response: any) => {
//         if (response) {
//         }
//       });
//   }
// }


// import { Component, OnInit } from '@angular/core';
// import { DatePipe } from '@angular/common';
// import { Router } from '@angular/router';
// import {
//   UntypedFormGroup,
//   UntypedFormBuilder,
//   UntypedFormControl,
//   Validators,
// } from '@angular/forms';
// import { HttpClient, HttpHeaders } from '@angular/common/http';

// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { v4 as uuidv4 } from 'uuid';
// import { ToastrService } from 'ngx-toastr';
// import { CookieService } from 'ngx-cookie-service';

// import { environment } from '../../../../environments/environment';
// import { RestService } from '../../../core/services/rest.service';
// import { AuthService } from '../../../core/services/auth/auth.service';
// import { SessionService } from '../../../core/services/session.service';
// import { EncryptDecryptService } from '../../../core/services/shared/encrypt-decrypt.service';
// import { AddItemService } from '../../../core/services/shared/add-item.service';
// import { LicenseTransferComponent } from '../license-transfer/license-transfer.component';

// declare var $: any;

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss',
// })
// export class LoginComponent implements OnInit {
//   private apiUrl: string = environment.api;

//   submitted: boolean = false;
//   loginForm!: UntypedFormGroup;
//   slideConfig2 = {
//     className: 'center',
//     centerMode: true,
//     infinite: true,
//     centerPadding: '0',
//     slidesToShow: 1,
//     speed: 500,
//     dots: true,
//   };
//   lic: any;
//   mssg: any;
//   bttndsbl: any;
//   companies: any[] = [];
//   wrongPassCount: number = 0;
//   licensePermission!: boolean;
//   IP: any;
//   deviceInfo = null;
//   patch_lastLogin_id: string = '';

//   constructor(
//     private fb: UntypedFormBuilder,
//     private restService: RestService,
//     private router: Router,
//     private toastr: ToastrService,
//     private authService: AuthService,
//     public sessionService: SessionService,
//     private cookie: CookieService,
//     private httpclient: HttpClient,
//     private encryptService: EncryptDecryptService,
//     private modal: NgbModal,
//     private addItemService: AddItemService,
//     private datePipe: DatePipe
//   ) {
//     const myGuid = uuidv4();
//     this.IP = uuidv4();
//     this.sessionService.IP = myGuid;
//   }

//   ngOnInit() {
//     this.getAccessToken();

//     this.loginForm = this.fb.group({
//       company: new UntypedFormControl(null, [Validators.required]),
//       username: new UntypedFormControl({ value: null, disabled: true }, [
//         Validators.required,
//         Validators.email,
//       ]),
//       password: new UntypedFormControl({ value: null, disabled: true }, [
//         Validators.required,
//       ]),
//     });

//     this.Comapny?.valueChanges.subscribe(() => {
//       this.UserName?.enable();
//       this.Password?.enable();
//     });
//   }

//   getAccessToken() {
//     this.restService.getOAuth2Token().subscribe((response: any) => {
//       if (response) {
//         localStorage.setItem('access-token', response.access_token);
//         this.getCompanies();
//       } else {
//         this.toastr.error('Token generation failed');
//       }
//     });
//   }

//   getCompanies() {
//     this.authService.getCompanies().subscribe((response: any) => {
//       this.companies = response.value;
//     });
//   }

//   get Comapny() {
//     return this.loginForm.get('company');
//   }

//   get UserName() {
//     return this.loginForm.get('username');
//   }

//   get Password() {
//     return this.loginForm.get('password');
//   }

//   getEmailInputValue() {
//     this.validateEmailInputValue(this.UserName?.value).then((validated) => {
//       if (validated) {
//         this.getLastLogin();
//       }
//     });
//   }

//   async validateEmailInputValue(value: string) {
//     const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
//     return emailRegex.test(value);
//   }

//   getLastLogin() {
//     this.authService
//       .getUserDeatils(this.Comapny?.value, this.UserName?.value)
//       .subscribe(
//         (response: any) => {
//           if (response.value.length > 0) {
//             if (response.value[0].Id) {
//               this.patch_lastLogin_id = response.value[0].Id;
//             }

//             if (response.value[0].LastLoginDateTime) {
//               this.sessionService.UserLastLoginInfo = this.datePipe.transform(
//                 response.value[0].LastLoginDateTime,
//                 'dd MMM yyyy HH:mm a'
//               );
//             }
//           } else {
//             this.toastr.error('Email is not registered!');
//           }
//         },
//         () => {}
//       );
//   }

//   patchLastLogin() {
//     const date = new Date();
//     const loginTime = this.datePipe.transform(date, 'dd MMM yyyy HH:mm a');
//     this.sessionService.UserLastLoginInfo = loginTime;

//     const ifMatchKey = '*';
//     const patchData = {
//       LastLoginDateTime: date,
//     };

//     this.authService
//       .patchUserDeatils(
//         this.Comapny?.value,
//         this.patch_lastLogin_id,
//         patchData,
//         ifMatchKey
//       )
//       .subscribe();
//   }

//   login() {
//     this.submitted = true;

//     if (!this.loginForm.valid) {
//       return;
//     }

//     this.authService
//       .getUserDeatils(this.Comapny?.value, this.UserName?.value)
//       .subscribe(
//         (response: any) => {
//           if (response.value.length > 0) {
//             const user = response.value[0];
//             const decryptedPassword = this.encryptService.decrypt(
//               user['PasswordHash']
//             );

//             if (decryptedPassword === this.Password?.value) {
//               this.patchLastLogin();

//               if (user.UserName === 'admin@tecsa.com.my') {
//                 this.cookie.set('cenergi-user-details', JSON.stringify(user));
//                 this.sessionService.Company = this.Comapny?.value;
//                 this.sessionService.CompanyName = this.companies.filter(
//                   (x) => x.id === this.Comapny?.value
//                 )[0]?.name;
//                 this.sessionService.User = user;
//                 this.sessionService.ResponsibilityCenter = null;
//                 this.SendUserDate();
//                 this.router.navigate(['/home']);
//               } else {
//                 this.sessionService.Company = this.Comapny?.value;
//                 this.sessionService.User = user;
//                 this.addItemService.showLoader$.next(true);
//                 this.getIpCliente(user);
//               }
//             } else {
//               this.wrongPassCount = this.wrongPassCount + 1;

//               if (this.wrongPassCount > 2) {
//                 this.wrongPassCount = 0;
//                 this.toastr.error('Password reset! Please check your mail');
//               } else {
//                 this.toastr.error('Password is incorrect!');
//               }
//             }
//           } else {
//             this.toastr.error('Email is not registered!');
//           }
//         },
//         () => {
//           this.toastr.error('Login Failed!');
//         }
//       );
//   }

//   checkUserCompanyPermission(user: any, companyId: string) {
//     this.authService
//       .getUserCompanyPermission(user.UserId, companyId)
//       .subscribe((response: any) => {
//         if (response.value && response.value.length > 0) {
//           const permission = response.value.filter(
//             (x: any) => x.AccessAllCompany || x.CompanyId === companyId
//           )[0];

//           if (permission) {
//             this.getUserRoleDetails(user, this.Comapny?.value);
//           } else {
//             this.toastr.error(
//               "User does't have permission to selected Company."
//             );
//             this.addItemService.showLoader$.next(false);
//             this.sessionService.logout('manual');
//           }
//         } else {
//           this.toastr.error(
//             "User does't have permission to selected Company."
//           );
//           this.addItemService.showLoader$.next(false);
//           this.sessionService.logout('manual');
//         }
//       });
//   }

//   getUserRoleDetails(user: any, companyId: string) {
//     this.authService.getUserRoleDetails(user.RoleId).subscribe((response: any) => {
//       if (response && response.value.length > 0) {
//         const userRole = response.value[0];

//         if (userRole.IsSuperAdmin) {
//           this.cookie.set('cenergi-user-details', JSON.stringify(user));
//           this.sessionService.SuperAdmin = true;
//           this.sessionService.Company = this.Comapny?.value;
//           this.sessionService.CompanyName = this.companies.filter(
//             (x) => x.id === this.Comapny?.value
//           )[0]?.name;
//           this.sessionService.User = user;
//           this.sessionService.DefaultResponsibilityCenter =
//             user.DefaultResponsibilityCentre;
//           this.sessionService.ResponsibilityCenter = null;
//           this.SendUserDate();
//           this.router.navigate(['/home']);
//         } else {
//           this.getUserResponsibilityCenterPermission(user, companyId);
//         }
//       } else {
//         this.getUserResponsibilityCenterPermission(user, companyId);
//       }
//     });
//   }

//   getUserResponsibilityCenterPermission(user: any, companyId: string) {
//     this.authService
//       .getUserResponsibilityCenterPermission(user.UserId, companyId)
//       .subscribe((response: any) => {
//         const result = response.value.filter(
//           (x: any) => x.AccessAllCompany || x.CompanyId === companyId
//         );

//         if (result.length > 0) {
//           this.cookie.set('cenergi-user-details', JSON.stringify(user));
//           this.sessionService.Company = companyId;
//           this.sessionService.CompanyName = this.companies.filter(
//             (x) => x.id === companyId
//           )[0]?.name;
//           this.sessionService.User = user;
//           this.sessionService.DefaultResponsibilityCenter =
//             user.DefaultResponsibilityCentre;

//           if (result.filter((x: any) => x.AccessAllResCentre).length > 0) {
//             this.sessionService.ShowAllResCenters = true;
//             this.sessionService.ResponsibilityCenters = [];
//             this.sessionService.ResponsibilityCenter = null;
//           } else {
//             this.sessionService.ShowAllResCenters = false;
//             this.sessionService.ResponsibilityCenters = result;
//             this.sessionService.ResponsibilityCenter = result[0];

//             if (!this.sessionService.DefaultResponsibilityCenter) {
//               this.sessionService.DefaultResponsibilityCenter = result[0];
//             }
//           }

//           this.sessionService.ShowResCenterSelection = true;
//           this.SendUserDate();
//           this.router.navigate(['/home']);
//         } else {
//           this.toastr.error(
//             'User is not configured with any Responsibility Center. Contact your admin for more information.'
//           );
//           this.addItemService.showLoader$.next(false);
//           this.sessionService.logout('manual');
//         }
//       });
//   }

//   logOut() {
//     const username = this.sessionService.UserName;

//     this.httpclient
//       .get(this.apiUrl + '/Users/Logout?email=' + username)
//       .subscribe(() => {
//         this.sessionService.logout('manual');
//       });
//   }

//   SendUserDate() {
//     const payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.sessionService.IP,
//     };

//     // this.httpclient.post(environment.lisenceApiCore + 'StoreLoggedUser', payload, this.restService.httpLicenseCheckOptions).subscribe((response: any) => {
//     //   if (response) {
//     //     this.sessionService.UserLiseceLoginIfo = response.data;
//     //     this.router.navigate(['/home']);
//     //   }
//     // }, error => {
//     //   this.toastr.error('something went wrong press f5');
//     // });

//     this.router.navigate(['/home']);
//   }

//   getIpCliente(user: any) {
//     this.licensecheck(user);
//   }

//   get httpOptions() {
//     return {
//       headers: new HttpHeaders({
//         apiKey: environment.licenseCheckToken,
//       }),
//     };
//   }

//   licensecheck(user: any) {
//     const payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.IP,
//     };

//     this.httpclient
//       .post(
//         environment.lisenceApiCore + 'CheckLoginPermission',
//         payload,
//         this.httpOptions
//       )
//       .subscribe(
//         (response: any) => {
//           if (!response) {
//             this.addItemService.showLoader$.next(false);
//             return;
//           }

//           if (response.PassToLogin) {
//             this.sessionService.licensePermission = true;
//             this.licensePermission = true;

//             if (this.sessionService.licensePermission) {
//               if (response.NeedToTransferLogin) {
//                 const modalRef = this.modal.open(LicenseTransferComponent, {
//                   backdrop: 'static',
//                 });

//                 modalRef.result.then(
//                   (result) => {
//                     if (result) {
//                       this.transferLogin();
//                       this.checkUserCompanyPermission(user, this.Comapny?.value);
//                       this.addItemService.showLoader$.next(false);
//                     } else {
//                       this.addItemService.showLoader$.next(false);
//                       this.sessionService.logout('manual');
//                     }
//                   },
//                   () => {
//                     this.addItemService.showLoader$.next(false);
//                     this.sessionService.logout('manual');
//                   }
//                 );
//               } else {
//                 this.checkUserCompanyPermission(user, this.Comapny?.value);
//                 this.addItemService.showLoader$.next(false);
//               }
//             } else {
//               this.addItemService.showLoader$.next(false);
//               this.sessionService.logout('license');
//             }
//           } else {
//             this.toastr.error(response.Message);
//             this.sessionService.licensePermission = false;
//             this.licensePermission = false;
//             this.addItemService.showLoader$.next(false);
//           }
//         },
//         () => {
//           this.toastr.error('something went wrong pres f5');
//           this.addItemService.showLoader$.next(false);
//         }
//       );
//   }

//   transferLogin() {
//     const payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.IP,
//     };

//     this.httpclient
//       .post(
//         environment.lisenceApiCore + 'TransferLogin',
//         payload,
//         this.httpOptions
//       )
//       .subscribe();
//   }
// }


//log out behavier fixed 


// import { Component, OnInit } from '@angular/core';
// import { DatePipe } from '@angular/common';
// import { Router } from '@angular/router';
// import {
//   UntypedFormGroup,
//   UntypedFormBuilder,
//   UntypedFormControl,
//   Validators,
// } from '@angular/forms';
// import { HttpClient, HttpHeaders } from '@angular/common/http';

// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { v4 as uuidv4 } from 'uuid';
// import { ToastrService } from 'ngx-toastr';
// import { CookieService } from 'ngx-cookie-service';

// import { environment } from '../../../../environments/environment';
// import { RestService } from '../../../core/services/rest.service';
// import { AuthService } from '../../../core/services/auth/auth.service';
// import { SessionService } from '../../../core/services/session.service';
// import { IdleSessionService } from '../../../core/services/idle-session.service';
// import { EncryptDecryptService } from '../../../core/services/shared/encrypt-decrypt.service';
// import { AddItemService } from '../../../core/services/shared/add-item.service';
// import { LicenseTransferComponent } from '../license-transfer/license-transfer.component';

// declare var $: any;

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss',
// })
// export class LoginComponent implements OnInit {
//   private apiUrl: string = environment.api;

//   submitted: boolean = false;
//   loginForm!: UntypedFormGroup;
//   slideConfig2 = {
//     className: 'center',
//     centerMode: true,
//     infinite: true,
//     centerPadding: '0',
//     slidesToShow: 1,
//     speed: 500,
//     dots: true,
//   };
//   lic: any;
//   mssg: any;
//   bttndsbl: any;
//   companies: any[] = [];
//   wrongPassCount: number = 0;
//   licensePermission!: boolean;
//   IP: any;
//   deviceInfo = null;
//   patch_lastLogin_id: string = '';

//   constructor(
//     private fb: UntypedFormBuilder,
//     private restService: RestService,
//     private router: Router,
//     private toastr: ToastrService,
//     private authService: AuthService,
//     public sessionService: SessionService,
//     private idleSessionService: IdleSessionService,
//     private cookie: CookieService,
//     private httpclient: HttpClient,
//     private encryptService: EncryptDecryptService,
//     private modal: NgbModal,
//     private addItemService: AddItemService,
//     private datePipe: DatePipe
//   ) {
//     const myGuid = uuidv4();
//     this.IP = uuidv4();
//     this.sessionService.IP = myGuid;
//   }

//   ngOnInit() {
//     this.getAccessToken();

//     this.loginForm = this.fb.group({
//       company: new UntypedFormControl(null, [Validators.required]),
//       username: new UntypedFormControl({ value: null, disabled: true }, [
//         Validators.required,
//         Validators.email,
//       ]),
//       password: new UntypedFormControl({ value: null, disabled: true }, [
//         Validators.required,
//       ]),
//     });

//     this.Comapny?.valueChanges.subscribe(() => {
//       this.UserName?.enable();
//       this.Password?.enable();
//     });
//   }

//   getAccessToken() {
//     this.restService.getOAuth2Token().subscribe((response: any) => {
//       if (response) {
//         localStorage.setItem('access-token', response.access_token);
//         this.getCompanies();
//       } else {
//         this.toastr.error('Token generation failed');
//       }
//     });
//   }

//   getCompanies() {
//     this.authService.getCompanies().subscribe((response: any) => {
//       this.companies = response.value;
//     });
//   }

//   get Comapny() {
//     return this.loginForm.get('company');
//   }

//   get UserName() {
//     return this.loginForm.get('username');
//   }

//   get Password() {
//     return this.loginForm.get('password');
//   }

//   getEmailInputValue() {
//     this.validateEmailInputValue(this.UserName?.value).then((validated) => {
//       if (validated) {
//         this.getLastLogin();
//       }
//     });
//   }

//   async validateEmailInputValue(value: string) {
//     const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
//     return emailRegex.test(value);
//   }

//   getLastLogin() {
//     this.authService
//       .getUserDeatils(this.Comapny?.value, this.UserName?.value)
//       .subscribe(
//         (response: any) => {
//           if (response.value.length > 0) {
//             if (response.value[0].Id) {
//               this.patch_lastLogin_id = response.value[0].Id;
//             }

//             if (response.value[0].LastLoginDateTime) {
//               this.sessionService.UserLastLoginInfo = this.datePipe.transform(
//                 response.value[0].LastLoginDateTime,
//                 'dd MMM yyyy HH:mm a'
//               );
//             }
//           } else {
//             this.toastr.error('Email is not registered!');
//           }
//         },
//         () => {}
//       );
//   }

//   patchLastLogin() {
//     const date = new Date();
//     const loginTime = this.datePipe.transform(date, 'dd MMM yyyy HH:mm a');
//     this.sessionService.UserLastLoginInfo = loginTime;

//     const ifMatchKey = '*';
//     const patchData = {
//       LastLoginDateTime: date,
//     };

//     this.authService
//       .patchUserDeatils(
//         this.Comapny?.value,
//         this.patch_lastLogin_id,
//         patchData,
//         ifMatchKey
//       )
//       .subscribe();
//   }

//   login() {
//     this.submitted = true;

//     if (!this.loginForm.valid) {
//       return;
//     }

//     this.authService
//       .getUserDeatils(this.Comapny?.value, this.UserName?.value)
//       .subscribe(
//         (response: any) => {
//           if (response.value.length > 0) {
//             const user = response.value[0];
//             const decryptedPassword = this.encryptService.decrypt(
//               user['PasswordHash']
//             );

//             if (decryptedPassword === this.Password?.value) {
//               this.patchLastLogin();

//               if (user.UserName === 'admin@tecsa.com.my') {
//                 this.cookie.set('cenergi-user-details', JSON.stringify(user));
//                 this.sessionService.Company = this.Comapny?.value;
//                 this.sessionService.CompanyName = this.companies.filter(
//                   (x) => x.id === this.Comapny?.value
//                 )[0]?.name;
//                 this.sessionService.User = user;
//                 this.sessionService.ResponsibilityCenter = null;
//                 this.startIdleTracking();
//                 this.SendUserDate();
//               } else {
//                 this.sessionService.Company = this.Comapny?.value;
//                 this.sessionService.User = user;
//                 this.addItemService.showLoader$.next(true);
//                 this.getIpCliente(user);
//               }
//             } else {
//               this.wrongPassCount = this.wrongPassCount + 1;

//               if (this.wrongPassCount > 2) {
//                 this.wrongPassCount = 0;
//                 this.toastr.error('Password reset! Please check your mail');
//               } else {
//                 this.toastr.error('Password is incorrect!');
//               }
//             }
//           } else {
//             this.toastr.error('Email is not registered!');
//           }
//         },
//         () => {
//           this.toastr.error('Login Failed!');
//         }
//       );
//   }

//   checkUserCompanyPermission(user: any, companyId: string) {
//     this.authService
//       .getUserCompanyPermission(user.UserId, companyId)
//       .subscribe((response: any) => {
//         if (response.value && response.value.length > 0) {
//           const permission = response.value.filter(
//             (x: any) => x.AccessAllCompany || x.CompanyId === companyId
//           )[0];

//           if (permission) {
//             this.getUserRoleDetails(user, this.Comapny?.value);
//           } else {
//             this.toastr.error(
//               "User does't have permission to selected Company."
//             );
//             this.addItemService.showLoader$.next(false);
//             this.sessionService.logout('manual');
//           }
//         } else {
//           this.toastr.error(
//             "User does't have permission to selected Company."
//           );
//           this.addItemService.showLoader$.next(false);
//           this.sessionService.logout('manual');
//         }
//       });
//   }

//   getUserRoleDetails(user: any, companyId: string) {
//     this.authService.getUserRoleDetails(user.RoleId).subscribe((response: any) => {
//       if (response && response.value.length > 0) {
//         const userRole = response.value[0];

//         if (userRole.IsSuperAdmin) {
//           this.cookie.set('cenergi-user-details', JSON.stringify(user));
//           this.sessionService.SuperAdmin = true;
//           this.sessionService.Company = this.Comapny?.value;
//           this.sessionService.CompanyName = this.companies.filter(
//             (x) => x.id === this.Comapny?.value
//           )[0]?.name;
//           this.sessionService.User = user;
//           this.sessionService.DefaultResponsibilityCenter =
//             user.DefaultResponsibilityCentre;
//           this.sessionService.ResponsibilityCenter = null;
//           this.startIdleTracking();
//           this.SendUserDate();
//         } else {
//           this.getUserResponsibilityCenterPermission(user, companyId);
//         }
//       } else {
//         this.getUserResponsibilityCenterPermission(user, companyId);
//       }
//     });
//   }

//   getUserResponsibilityCenterPermission(user: any, companyId: string) {
//     this.authService
//       .getUserResponsibilityCenterPermission(user.UserId, companyId)
//       .subscribe((response: any) => {
//         const result = response.value.filter(
//           (x: any) => x.AccessAllCompany || x.CompanyId === companyId
//         );

//         if (result.length > 0) {
//           this.cookie.set('cenergi-user-details', JSON.stringify(user));
//           this.sessionService.Company = companyId;
//           this.sessionService.CompanyName = this.companies.filter(
//             (x) => x.id === companyId
//           )[0]?.name;
//           this.sessionService.User = user;
//           this.sessionService.DefaultResponsibilityCenter =
//             user.DefaultResponsibilityCentre;

//           if (result.filter((x: any) => x.AccessAllResCentre).length > 0) {
//             this.sessionService.ShowAllResCenters = true;
//             this.sessionService.ResponsibilityCenters = [];
//             this.sessionService.ResponsibilityCenter = null;
//           } else {
//             this.sessionService.ShowAllResCenters = false;
//             this.sessionService.ResponsibilityCenters = result;
//             this.sessionService.ResponsibilityCenter = result[0];

//             if (!this.sessionService.DefaultResponsibilityCenter) {
//               this.sessionService.DefaultResponsibilityCenter = result[0];
//             }
//           }

//           this.sessionService.ShowResCenterSelection = true;
//           this.startIdleTracking();
//           this.SendUserDate();
//         } else {
//           this.toastr.error(
//             'User is not configured with any Responsibility Center. Contact your admin for more information.'
//           );
//           this.addItemService.showLoader$.next(false);
//           this.sessionService.logout('manual');
//         }
//       });
//   }

//   logOut() {
//     const username = this.sessionService.UserName;

//     this.httpclient
//       .get(this.apiUrl + '/Users/Logout?email=' + username)
//       .subscribe(() => {
//         this.sessionService.logout('manual');
//       });
//   }

//   SendUserDate() {
//     const payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.sessionService.IP,
//     };

//     // this.httpclient.post(environment.lisenceApiCore + 'StoreLoggedUser', payload, this.restService.httpLicenseCheckOptions).subscribe((response: any) => {
//     //   if (response) {
//     //     this.sessionService.UserLiseceLoginIfo = response.data;
//     //     this.startIdleTracking();
//     //     this.router.navigate(['/home']);
//     //   }
//     // }, error => {
//     //   this.toastr.error('something went wrong press f5');
//     // });

//     this.router.navigate(['/home']);
//   }

//   getIpCliente(user: any) {
//     this.licensecheck(user);
//   }

//   get httpOptions() {
//     return {
//       headers: new HttpHeaders({
//         apiKey: environment.licenseCheckToken,
//       }),
//     };
//   }

//   licensecheck(user: any) {
//     const payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.IP,
//     };

//     this.httpclient
//       .post(
//         environment.lisenceApiCore + 'CheckLoginPermission',
//         payload,
//         this.httpOptions
//       )
//       .subscribe(
//         (response: any) => {
//           if (!response) {
//             this.addItemService.showLoader$.next(false);
//             return;
//           }

//           if (response.PassToLogin) {
//             this.sessionService.licensePermission = true;
//             this.licensePermission = true;

//             if (this.sessionService.licensePermission) {
//               if (response.NeedToTransferLogin) {
//                 const modalRef = this.modal.open(LicenseTransferComponent, {
//                   backdrop: 'static',
//                 });

//                 modalRef.result.then(
//                   (result) => {
//                     if (result) {
//                       this.transferLogin();
//                       this.checkUserCompanyPermission(user, this.Comapny?.value);
//                       this.addItemService.showLoader$.next(false);
//                     } else {
//                       this.addItemService.showLoader$.next(false);
//                       this.sessionService.logout('manual');
//                     }
//                   },
//                   () => {
//                     this.addItemService.showLoader$.next(false);
//                     this.sessionService.logout('manual');
//                   }
//                 );
//               } else {
//                 this.checkUserCompanyPermission(user, this.Comapny?.value);
//                 this.addItemService.showLoader$.next(false);
//               }
//             } else {
//               this.addItemService.showLoader$.next(false);
//               this.sessionService.logout('license');
//             }
//           } else {
//             this.toastr.error(response.Message);
//             this.sessionService.licensePermission = false;
//             this.licensePermission = false;
//             this.addItemService.showLoader$.next(false);
//           }
//         },
//         () => {
//           this.toastr.error('something went wrong pres f5');
//           this.addItemService.showLoader$.next(false);
//         }
//       );
//   }

//   transferLogin() {
//     const payload = {
//       UserEmail: this.sessionService.Email,
//       MacId: this.IP,
//     };

//     this.httpclient
//       .post(
//         environment.lisenceApiCore + 'TransferLogin',
//         payload,
//         this.httpOptions
//       )
//       .subscribe();
//   }

//   private startIdleTracking(): void {
//     this.idleSessionService.restart();
//   }
// }




// login.component.ts

// Use your current latest file, but replace it fully with this cleaned version so the selected responsibility center is stored as a code, 
// while the list stays as full JSON for lookup/UI.


import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormControl,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { ToastrService } from 'ngx-toastr';
import { CookieService } from 'ngx-cookie-service';

import { environment } from '../../../../environments/environment';
import { RestService } from '../../../core/services/rest.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { IdleSessionService } from '../../../core/services/idle-session.service';
import { EncryptDecryptService } from '../../../core/services/shared/encrypt-decrypt.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { LicenseTransferComponent } from '../license-transfer/license-transfer.component';

declare var $: any;

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private apiUrl: string = environment.api;

  submitted = false;
  loginForm!: UntypedFormGroup;
  slideConfig2 = {
    className: 'center',
    centerMode: true,
    infinite: true,
    centerPadding: '0',
    slidesToShow: 1,
    speed: 500,
    dots: true,
  };

  lic: any;
  mssg: any;
  bttndsbl: any;
  companies: any[] = [];
  wrongPassCount = 0;
  licensePermission!: boolean;
  IP: any;
  deviceInfo = null;
  patch_lastLogin_id = '';

  companyLoading = false;
  loginLoading = false;
  lastLoginLoading = false;

  constructor(
    private fb: UntypedFormBuilder,
    private restService: RestService,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService,
    public sessionService: SessionService,
    private idleSessionService: IdleSessionService,
    private cookie: CookieService,
    private httpclient: HttpClient,
    private encryptService: EncryptDecryptService,
    private modal: NgbModal,
    private addItemService: AddItemService,
    private datePipe: DatePipe
  ) {
    const myGuid = uuidv4();
    this.IP = uuidv4();
    this.sessionService.IP = myGuid;
  }

  ngOnInit() {
    this.buildForm();
    this.bindFormEvents();
    this.getAccessToken();
  }

  private buildForm(): void {
    this.loginForm = this.fb.group({
      company: new UntypedFormControl(null, [Validators.required]),
      username: new UntypedFormControl({ value: null, disabled: true }, [
        Validators.required,
        Validators.email,
      ]),
      password: new UntypedFormControl({ value: null, disabled: true }, [
        Validators.required,
      ]),
    });
  }

  private bindFormEvents(): void {
    this.Comapny?.valueChanges.subscribe(() => {
      this.sessionService.UserLastLoginInfo = null;
      this.patch_lastLogin_id = '';
      this.lastLoginLoading = false;

      if (this.Comapny?.value) {
        this.UserName?.enable({ emitEvent: false });
        this.Password?.enable({ emitEvent: false });
      } else {
        this.UserName?.disable({ emitEvent: false });
        this.Password?.disable({ emitEvent: false });
      }
    });

    this.UserName?.valueChanges.subscribe(() => {
      this.sessionService.UserLastLoginInfo = null;
      this.patch_lastLogin_id = '';
    });
  }

  getAccessToken() {
    this.companyLoading = true;

    this.restService.getOAuth2Token().subscribe(
      (response: any) => {
        if (response) {
          localStorage.setItem('access-token', response.access_token);
          this.getCompanies();
        } else {
          this.companyLoading = false;
          this.toastr.error('Token generation failed');
        }
      },
      () => {
        this.companyLoading = false;
        this.toastr.error('Token generation failed');
      }
    );
  }

  getCompanies() {
    this.authService.getCompanies().subscribe(
      (response: any) => {
        this.companies = response?.value || [];
        this.companyLoading = false;
      },
      () => {
        this.companies = [];
        this.companyLoading = false;
        this.toastr.error('Unable to load companies. Please try again.');
      }
    );
  }

  get Comapny() {
    return this.loginForm.get('company');
  }

  get UserName() {
    return this.loginForm.get('username');
  }

  get Password() {
    return this.loginForm.get('password');
  }

  async handleUsernameBlur() {
    const email = (this.UserName?.value || '').trim();

    if (!this.Comapny?.value || !email) {
      this.sessionService.UserLastLoginInfo = null;
      this.patch_lastLogin_id = '';
      return;
    }

    const validated = await this.validateEmailInputValue(email);
    if (!validated) {
      this.sessionService.UserLastLoginInfo = null;
      this.patch_lastLogin_id = '';
      return;
    }

    this.getLastLogin(false);
  }

  async validateEmailInputValue(value: string) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test((value || '').trim());
  }

  getLastLogin(showNotRegisteredToast: boolean = false) {
    const email = (this.UserName?.value || '').trim();

    if (!this.Comapny?.value || !email) {
      return;
    }

    this.lastLoginLoading = true;

    this.authService.getUserDeatils(this.Comapny?.value, email).subscribe(
      (response: any) => {
        const rows = response?.value || [];

        if (rows.length > 0) {
          const userRow = rows[0];
          this.patch_lastLogin_id = userRow.Id || '';

          if (userRow.LastLoginDateTime) {
            this.sessionService.UserLastLoginInfo = this.datePipe.transform(
              userRow.LastLoginDateTime,
              'dd MMM yyyy HH:mm a'
            );
          } else {
            this.sessionService.UserLastLoginInfo = null;
          }
        } else {
          this.patch_lastLogin_id = '';
          this.sessionService.UserLastLoginInfo = null;

          if (showNotRegisteredToast) {
            this.toastr.error('Email is not registered!');
          }
        }

        this.lastLoginLoading = false;
      },
      () => {
        this.patch_lastLogin_id = '';
        this.sessionService.UserLastLoginInfo = null;
        this.lastLoginLoading = false;
      }
    );
  }

  patchLastLogin() {
    const date = new Date();
    const loginTime = this.datePipe.transform(date, 'dd MMM yyyy HH:mm a');
    this.sessionService.UserLastLoginInfo = loginTime;

    if (!this.patch_lastLogin_id) {
      return;
    }

    const ifMatchKey = '*';
    const patchData = {
      LastLoginDateTime: date,
    };

    this.authService
      .patchUserDeatils(
        this.Comapny?.value,
        this.patch_lastLogin_id,
        patchData,
        ifMatchKey
      )
      .subscribe();
  }

  login() {
    this.submitted = true;

    if (!this.loginForm.valid || this.companyLoading || this.loginLoading) {
      return;
    }

    this.loginLoading = true;
    this.bttndsbl = true;

    this.authService
      .getUserDeatils(this.Comapny?.value, (this.UserName?.value || '').trim())
      .subscribe(
        (response: any) => {
          const rows = response?.value || [];

          if (rows.length > 0) {
            const user = rows[0];
            const decryptedPassword = this.encryptService.decrypt(
              user['PasswordHash']
            );

            this.patch_lastLogin_id = user.Id || this.patch_lastLogin_id;

            if (decryptedPassword === this.Password?.value) {
              this.patchLastLogin();

              if (user.UserName === 'admin@tecsa.com.my') {
                this.cookie.set('app-user-details', JSON.stringify(user));
                this.sessionService.Company = this.Comapny?.value;
                this.sessionService.CompanyName = this.companies.filter(
                  (x) => x.id === this.Comapny?.value
                )[0]?.name;
                this.sessionService.User = user;
                this.sessionService.DefaultResponsibilityCenter =
                  user.DefaultResponsibilityCentre || null;
                this.sessionService.ResponsibilityCenter = null;
                this.startIdleTracking();
                this.finishLoginUiState();
                this.SendUserDate();
              } else {
                this.sessionService.Company = this.Comapny?.value;
                this.sessionService.User = user;
                this.addItemService.showLoader$.next(true);
                this.getIpCliente(user);
              }
            } else {
              this.wrongPassCount = this.wrongPassCount + 1;
              this.finishLoginUiState();

              if (this.wrongPassCount > 2) {
                this.wrongPassCount = 0;
                this.toastr.error('Password reset! Please check your mail');
              } else {
                this.toastr.error('Password is incorrect!');
              }
            }
          } else {
            this.finishLoginUiState();
            this.toastr.error('Email is not registered!');
          }
        },
        () => {
          this.finishLoginUiState();
          this.toastr.error('Login Failed!');
        }
      );
  }

  checkUserCompanyPermission(user: any, companyId: string) {
    this.authService
      .getUserCompanyPermission(user.UserId, companyId)
      .subscribe((response: any) => {
        if (response.value && response.value.length > 0) {
          const permission = response.value.filter(
            (x: any) => x.AccessAllCompany || x.CompanyId === companyId
          )[0];

          if (permission) {
            this.getUserRoleDetails(user, this.Comapny?.value);
          } else {
            this.toastr.error("User does't have permission to selected Company.");
            this.addItemService.showLoader$.next(false);
            this.finishLoginUiState();
            this.sessionService.logout('manual');
          }
        } else {
          this.toastr.error("User does't have permission to selected Company.");
          this.addItemService.showLoader$.next(false);
          this.finishLoginUiState();
          this.sessionService.logout('manual');
        }
      });
  }

  getUserRoleDetails(user: any, companyId: string) {
    this.authService.getUserRoleDetails(user.RoleId).subscribe((response: any) => {
      if (response && response.value.length > 0) {
        const userRole = response.value[0];

        if (userRole.IsSuperAdmin) {
          this.cookie.set('app-user-details', JSON.stringify(user));
          this.sessionService.SuperAdmin = true;
          this.sessionService.Company = this.Comapny?.value;
          this.sessionService.CompanyName = this.companies.filter(
            (x) => x.id === this.Comapny?.value
          )[0]?.name;
          this.sessionService.User = user;
          this.sessionService.DefaultResponsibilityCenter =
            user.DefaultResponsibilityCentre || null;
          this.sessionService.ResponsibilityCenter = null;
          this.startIdleTracking();
          this.finishLoginUiState();
          this.SendUserDate();
        } else {
          this.getUserResponsibilityCenterPermission(user, companyId);
        }
      } else {
        this.getUserResponsibilityCenterPermission(user, companyId);
      }
    });
  }

  getUserResponsibilityCenterPermission(user: any, companyId: string) {
    this.authService
      .getUserResponsibilityCenterPermission(user.UserId, companyId)
      .subscribe((response: any) => {
        const result = (response?.value || []).filter(
          (x: any) => x.AccessAllCompany || x.CompanyId === companyId
        );

        if (result.length > 0) {
          this.cookie.set('app-user-details', JSON.stringify(user));
          this.sessionService.Company = companyId;
          this.sessionService.CompanyName = this.companies.filter(
            (x) => x.id === companyId
          )[0]?.name;
          this.sessionService.User = user;
          this.sessionService.DefaultResponsibilityCenter =
            user.DefaultResponsibilityCentre || null;

          if (result.filter((x: any) => x.AccessAllResCentre).length > 0) {
            this.sessionService.ShowAllResCenters = true;
            this.sessionService.ResponsibilityCenters = [];
            this.sessionService.ResponsibilityCenter = null;
          } else {
            this.sessionService.ShowAllResCenters = false;
            this.sessionService.ResponsibilityCenters = result;

            const preferredCode =
              this.extractResponsibilityCenterCode(user.DefaultResponsibilityCentre) ||
              this.extractResponsibilityCenterCode(result[0]);

            this.sessionService.ResponsibilityCenter = preferredCode;

            if (!this.sessionService.DefaultResponsibilityCenter) {
              this.sessionService.DefaultResponsibilityCenter = preferredCode;
            }
          }

          this.sessionService.ShowResCenterSelection = true;
          this.startIdleTracking();
          this.finishLoginUiState();
          this.SendUserDate();
        } else {
          this.toastr.error(
            'User is not configured with any Responsibility Center. Contact your admin for more information.'
          );
          this.addItemService.showLoader$.next(false);
          this.finishLoginUiState();
          this.sessionService.logout('manual');
        }
      });
  }

  private extractResponsibilityCenterCode(value: any): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value.trim() || null;
    }

    return (
      value.PortalResponsibilityCentre ||
      value.ResponsibilityCentre ||
      value.ResponsibilityCenter ||
      value.Code ||
      value.code ||
      value.Id ||
      value.id ||
      null
    );
  }

  logOut() {
    const username = this.sessionService.UserName;

    this.httpclient
      .get(this.apiUrl + '/Users/Logout?email=' + username)
      .subscribe(() => {
        this.sessionService.logout('manual');
      });
  }

  SendUserDate() {
    this.router.navigate(['/home']);
  }

  getIpCliente(user: any) {
    this.licensecheck(user);
  }

  get httpOptions() {
    return {
      headers: new HttpHeaders({
        apiKey: environment.licenseCheckToken,
      }),
    };
  }

  licensecheck(user: any) {
    const payload = {
      UserEmail: this.sessionService.Email,
      MacId: this.IP,
    };

    this.httpclient
      .post(
        environment.lisenceApiCore + 'CheckLoginPermission',
        payload,
        this.httpOptions
      )
      .subscribe(
        (response: any) => {
          if (!response) {
            this.addItemService.showLoader$.next(false);
            this.finishLoginUiState();
            return;
          }

          if (response.PassToLogin) {
            this.sessionService.licensePermission = true;
            this.licensePermission = true;

            if (this.sessionService.licensePermission) {
              if (response.NeedToTransferLogin) {
                const modalRef = this.modal.open(LicenseTransferComponent, {
                  backdrop: 'static',
                });

                modalRef.result.then(
                  (result) => {
                    if (result) {
                      this.transferLogin();
                      this.checkUserCompanyPermission(user, this.Comapny?.value);
                      this.addItemService.showLoader$.next(false);
                    } else {
                      this.addItemService.showLoader$.next(false);
                      this.finishLoginUiState();
                      this.sessionService.logout('manual');
                    }
                  },
                  () => {
                    this.addItemService.showLoader$.next(false);
                    this.finishLoginUiState();
                    this.sessionService.logout('manual');
                  }
                );
              } else {
                this.checkUserCompanyPermission(user, this.Comapny?.value);
                this.addItemService.showLoader$.next(false);
              }
            } else {
              this.addItemService.showLoader$.next(false);
              this.finishLoginUiState();
              this.sessionService.logout('license');
            }
          } else {
            this.toastr.error(response.Message);
            this.sessionService.licensePermission = false;
            this.licensePermission = false;
            this.addItemService.showLoader$.next(false);
            this.finishLoginUiState();
          }
        },
        () => {
          this.toastr.error('something went wrong pres f5');
          this.addItemService.showLoader$.next(false);
          this.finishLoginUiState();
        }
      );
  }

  transferLogin() {
    const payload = {
      UserEmail: this.sessionService.Email,
      MacId: this.IP,
    };

    this.httpclient
      .post(
        environment.lisenceApiCore + 'TransferLogin',
        payload,
        this.httpOptions
      )
      .subscribe();
  }

  private finishLoginUiState(): void {
    this.loginLoading = false;
    this.bttndsbl = false;
  }

  private startIdleTracking(): void {
    this.idleSessionService.restart();
  }
}