import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogEntriesComponent } from './log-entries.component';

describe('LogEntriesComponent', () => {
  let component: LogEntriesComponent;
  let fixture: ComponentFixture<LogEntriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogEntriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
