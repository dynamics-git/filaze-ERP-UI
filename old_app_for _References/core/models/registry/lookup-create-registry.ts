import { AddVendorConfig } from '../../../features/Vendor/register-vendor/add-vendor.config';

export const LookupCreateRegistry: Record<string, any> = {
  '/vendorsAPI': {
    title: 'Vendor',
    recordId: 'number',
    recordTitle: 'displayName',
    headerConfig: AddVendorConfig
  }
};
