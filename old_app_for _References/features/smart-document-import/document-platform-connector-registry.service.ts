import { Injectable } from '@angular/core';

import { BusinessCentralDocumentConnectorService } from './business-central-document-connector.service';
import {
  DocumentPlatformConnector,
  PlatformCode,
} from './document-platform-connector.interface';

@Injectable({
  providedIn: 'root',
})
export class DocumentPlatformConnectorRegistryService {
  constructor(private businessCentralConnector: BusinessCentralDocumentConnectorService) {}

  getConnector(platformCode: PlatformCode): DocumentPlatformConnector {
    switch (platformCode) {
      case 'BC':
        return this.businessCentralConnector;
      default:
        throw new Error(`Document platform connector "${platformCode}" is not configured.`);
    }
  }
}
