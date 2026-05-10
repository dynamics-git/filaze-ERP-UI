import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CredentialService {
  decrypt(value: string): string {
    if (!value || !environment.secret) {
      return '';
    }

    return CryptoJS.AES.decrypt(value.toString(), environment.secret.trim()).toString(CryptoJS.enc.Utf8);
  }

  matchesPassword(passwordHash: string, password: string): boolean {
    return this.decrypt(passwordHash) === password;
  }
}
