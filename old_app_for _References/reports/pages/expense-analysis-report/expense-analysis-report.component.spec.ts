import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseAnalysisReportComponent } from './expense-analysis-report.component';

describe('ExpenseAnalysisReportComponent', () => {
  let component: ExpenseAnalysisReportComponent;
  let fixture: ComponentFixture<ExpenseAnalysisReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExpenseAnalysisReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpenseAnalysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
