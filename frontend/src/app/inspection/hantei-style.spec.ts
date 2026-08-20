import { hanteiRowClass, hanteiTextClass } from './hantei-style';

describe('判定の表示スタイル', () => {
  it('NG は赤系 (late)、再検査は warn、OK は装飾なし', () => {
    expect(hanteiRowClass('NG')).toBe('late');
    expect(hanteiRowClass('再検査')).toBe('warn');
    expect(hanteiRowClass('OK')).toBe('');
  });

  it('判定テキストは OK のみ ok クラス', () => {
    expect(hanteiTextClass('OK')).toBe('ok');
    expect(hanteiTextClass('NG')).toBe('ng');
    expect(hanteiTextClass('再検査')).toBe('ng');
  });
});
