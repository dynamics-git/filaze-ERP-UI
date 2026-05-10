import {
  ErpCommandConfig,
  ErpStandardCommandConfig
} from '../../models/command-config.model';

export const purchaseInvoiceStandardActions: ErpStandardCommandConfig = {
  new: true,
  delete: true,
  refresh: true
};

export const purchaseInvoiceCommandsConfig: ErpCommandConfig[] = [
  {
    id: 'process',
    label: 'Process',
    type: 'menu',
    group: 'process',
    actionKey: 'process'
  },
  {
    id: 'post',
    label: 'Post',
    type: 'menu',
    group: 'post',
    actionKey: 'post'
  },
  {
    id: 'release',
    label: 'Release',
    type: 'normal',
    group: 'process',
    actionKey: 'release'
  },
  {
    id: 'send-for-approval',
    label: 'Send for Approval',
    type: 'normal',
    group: 'process',
    actionKey: 'sendForApproval'
  },
  {
    id: 'reopen',
    label: 'Reopen',
    type: 'normal',
    group: 'process',
    actionKey: 'reopen'
  }
];
