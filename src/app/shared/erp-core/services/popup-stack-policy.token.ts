import { InjectionToken } from '@angular/core';

export interface PopupStackPolicy {
  maxDepth: number;
  onOverflow: 'block' | 'replace-top';
}

export const DEFAULT_POPUP_STACK_POLICY: PopupStackPolicy = {
  maxDepth: 50,
  onOverflow: 'block'
};

export const POPUP_STACK_POLICY = new InjectionToken<PopupStackPolicy>('POPUP_STACK_POLICY');
