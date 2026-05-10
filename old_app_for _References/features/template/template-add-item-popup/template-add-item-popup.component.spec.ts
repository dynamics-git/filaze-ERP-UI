import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateAddItemPopupComponent } from './template-add-item-popup.component';

describe('TemplateAddItemPopupComponent', () => {
  let component: TemplateAddItemPopupComponent;
  let fixture: ComponentFixture<TemplateAddItemPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TemplateAddItemPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateAddItemPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
