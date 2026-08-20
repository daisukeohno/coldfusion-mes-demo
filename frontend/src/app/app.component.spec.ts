import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }),
  );

  it('共通ヘッダにメニューを表示する', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement as HTMLElement;
    expect(nav.querySelector('.navCell a')?.textContent).toContain('品質検査');
  });
});
