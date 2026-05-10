import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddItemSubPopupComponent } from './add-item-sub-popup.component';

describe('AddItemSubPopupComponent', () => {
  let component: AddItemSubPopupComponent;
  let fixture: ComponentFixture<AddItemSubPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddItemSubPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddItemSubPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
