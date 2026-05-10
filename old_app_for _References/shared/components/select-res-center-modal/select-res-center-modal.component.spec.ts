import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectResCenterModalComponent } from './select-res-center-modal.component';

describe('SelectResCenterModalComponent', () => {
  let component: SelectResCenterModalComponent;
  let fixture: ComponentFixture<SelectResCenterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectResCenterModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectResCenterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
