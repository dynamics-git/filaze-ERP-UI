import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectCompanyModalComponent } from './select-company-modal.component';

describe('SelectCompanyModalComponent', () => {
  let component: SelectCompanyModalComponent;
  let fixture: ComponentFixture<SelectCompanyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectCompanyModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectCompanyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
