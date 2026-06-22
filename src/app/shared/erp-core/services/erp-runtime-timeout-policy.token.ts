import { InjectionToken } from '@angular/core';

export interface ErpRuntimeTimeoutPolicy {
  requestTimeoutMs: number;
  hydrationTimeoutMs: number;
}

export const DEFAULT_ERP_RUNTIME_TIMEOUT_POLICY: ErpRuntimeTimeoutPolicy = {
  requestTimeoutMs: 15000,
  hydrationTimeoutMs: 8000,
};

export const ERP_RUNTIME_TIMEOUT_POLICY = new InjectionToken<ErpRuntimeTimeoutPolicy>(
  'ERP_RUNTIME_TIMEOUT_POLICY',
  {
    providedIn: 'root',
    factory: () => DEFAULT_ERP_RUNTIME_TIMEOUT_POLICY,
  },
);
