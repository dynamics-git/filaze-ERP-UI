import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { compareSync } from 'bcryptjs';
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
    if (!passwordHash || !password) {
      return false;
    }

    // Laravel bcrypt hashes often come as $2y$; bcryptjs expects $2a$/$2b$.
    if (passwordHash.startsWith('$2')) {
      const normalizedHash = passwordHash.startsWith('$2y$')
        ? `$2a$${passwordHash.slice(4)}`
        : passwordHash;

      try {
        return compareSync(password, normalizedHash);
      } catch {
        return false;
      }
    }

    return this.decrypt(passwordHash) === password;
  }
}
