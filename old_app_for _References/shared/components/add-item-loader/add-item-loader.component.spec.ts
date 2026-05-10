import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddItemLoaderComponent } from './add-item-loader.component';

describe('AddItemLoaderComponent', () => {
  let component: AddItemLoaderComponent;
  let fixture: ComponentFixture<AddItemLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddItemLoaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddItemLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
