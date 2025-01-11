import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectThreadInputComponent } from './direct-thread-input.component';

describe('DirectThreadInputComponent', () => {
  let component: DirectThreadInputComponent;
  let fixture: ComponentFixture<DirectThreadInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectThreadInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectThreadInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
