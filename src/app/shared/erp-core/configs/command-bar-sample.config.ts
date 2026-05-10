import {
  ErpCommandConfig,
  ErpStandardCommandConfig
} from '../models/command-config.model';

export const erpCommandBarSampleStandardActions: ErpStandardCommandConfig = {
  new: true,
  delete: true,
  refresh: true
};

export const erpCommandBarSampleCommands: ErpCommandConfig[] = [
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
    id: 'reports',
    label: 'Reports',
    type: 'menu',
    group: 'report',
    actionKey: 'reports'
  },
  {
    id: 'more',
    label: 'More',
    type: 'menu',
    group: 'more',
    actionKey: 'more',
    children: [
      {
        id: 'approve',
        label: 'Approve',
        type: 'normal',
        group: 'process',
        actionKey: 'approve'
      },
      {
        id: 'reject',
        label: 'Reject',
        type: 'danger',
        group: 'process',
        actionKey: 'reject'
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
      }
    ]
  }
];
