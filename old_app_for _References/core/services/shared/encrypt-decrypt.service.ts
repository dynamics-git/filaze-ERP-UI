import { Injectable } from '@angular/core';

import * as CryptoJS from 'crypto-js';

import { environment } from '../../../../environments/environment.development';

@Injectable({
    providedIn: 'root'
})
export class EncryptDecryptService {

    constructor() { }

    encrypt(value: string) {
        return CryptoJS.AES.encrypt(value.trim(), environment.secret.trim()).toString();
    }

    decrypt(value: string) {
        return CryptoJS.AES.decrypt(value.toString(), environment.secret.trim()).toString(CryptoJS.enc.Utf8);
    }
}
