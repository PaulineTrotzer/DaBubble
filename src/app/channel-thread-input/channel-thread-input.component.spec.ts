import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelThreadInputComponent } from './channel-thread-input.component';

describe('ChannelThreadInputComponent', () => {
  let component: ChannelThreadInputComponent;
  let fixture: ComponentFixture<ChannelThreadInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelThreadInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelThreadInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
