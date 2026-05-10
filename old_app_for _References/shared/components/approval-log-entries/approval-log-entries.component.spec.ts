import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalLogEntriesComponent } from './approval-log-entries.component';

describe('ApprovalLogEntriesComponent', () => {
  let component: ApprovalLogEntriesComponent;
  let fixture: ComponentFixture<ApprovalLogEntriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApprovalLogEntriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApprovalLogEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
