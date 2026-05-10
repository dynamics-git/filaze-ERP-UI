import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseTransferComponent } from './license-transfer.component';

describe('LicenseTransferComponent', () => {
  let component: LicenseTransferComponent;
  let fixture: ComponentFixture<LicenseTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LicenseTransferComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LicenseTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
