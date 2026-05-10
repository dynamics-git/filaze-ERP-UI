import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersActivityLogsComponent } from './users-activity-logs.component';

describe('UsersActivityLogsComponent', () => {
  let component: UsersActivityLogsComponent;
  let fixture: ComponentFixture<UsersActivityLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsersActivityLogsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UsersActivityLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
