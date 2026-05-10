import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateDataTableComponent } from './template-data-table.component';

describe('TemplateDataTableComponent', () => {
  let component: TemplateDataTableComponent;
  let fixture: ComponentFixture<TemplateDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TemplateDataTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
