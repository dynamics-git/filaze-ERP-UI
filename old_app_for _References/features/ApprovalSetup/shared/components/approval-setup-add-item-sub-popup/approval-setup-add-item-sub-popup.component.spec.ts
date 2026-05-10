import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalSetupAddItemSubPopupComponent } from './approval-setup-add-item-sub-popup.component';

describe('ApprovalSetupAddItemSubPopupComponent', () => {
  let component: ApprovalSetupAddItemSubPopupComponent;
  let fixture: ComponentFixture<ApprovalSetupAddItemSubPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApprovalSetupAddItemSubPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApprovalSetupAddItemSubPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
