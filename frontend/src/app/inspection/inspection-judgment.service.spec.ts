import { InspectionJudgmentService } from './inspection-judgment.service';

describe('InspectionJudgmentService (frontend preview, 境界値)', () => {
  const svc = new InspectionJudgmentService();
  const j = (s: string) => svc.judge(s, '219.900', '220.100');

  it('sunpou == kijun_min → OK', () => expect(j('219.900')).toEqual({ valid: true, hantei: 'OK' }));
  it('kijun_min をわずかに下回る → NG', () => expect(j('219.899')).toEqual({ valid: true, hantei: 'NG' }));
  it('sunpou == kijun_max → 再検査', () => expect(j('220.100')).toEqual({ valid: true, hantei: '再検査' }));
  it('kijun_max をわずかに上回る → NG', () => expect(j('220.101')).toEqual({ valid: true, hantei: 'NG' }));
  it('差 0.010 ちょうど → OK', () => expect(j('220.090')).toEqual({ valid: true, hantei: 'OK' }));
  it('差 0.009 → 再検査', () => expect(j('220.091')).toEqual({ valid: true, hantei: '再検査' }));
  it('範囲中央 → OK', () => expect(j('220.000')).toEqual({ valid: true, hantei: 'OK' }));
  it('非数値 → バリデーションエラー', () => {
    expect(j('').valid).toBeFalse();
    expect(j('abc').valid).toBeFalse();
  });
});
