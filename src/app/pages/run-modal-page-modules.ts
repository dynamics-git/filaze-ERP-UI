import * as applicationPageSetup from './application-page-setup/application-page-setup.config';
import * as companies from './companies/companies.config';
import * as companySetup from './company-setup/company-setup.config';
import * as customerLedgerEntry from './customer-ledger-entry/customer-ledger-entry.config';
import * as customerMaster from './customer-master/customer-master.config';
import * as pageFieldSetup from './page-field-setup/page-field-setup.config';
import * as permissionFieldRuleSetup from './permission-field-rule-setup/permission-field-rule-setup.config';
import * as permissionSetSetup from './permission-set-setup/permission-set-setup.config';
import * as purchaseOrder from './purchase-order/purchase-order.config';
import * as roleSetup from './role-setup/role-setup.config';
import * as userSetup from './user-setup/user-setup.config';
import { RunModalConfigModule } from '../shared/erp-core/public-api';

export const runModalPageModules: RunModalConfigModule[] = [
  applicationPageSetup,
  companies,
  companySetup,
  customerLedgerEntry,
  customerMaster,
  pageFieldSetup,
  permissionFieldRuleSetup,
  permissionSetSetup,
  purchaseOrder,
  roleSetup,
  userSetup,
];
