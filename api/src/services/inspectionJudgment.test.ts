import {
  InspectionValidationError,
  judge,
} from './inspectionJudgment';

describe('judge', () => {
  const minimum = '219.900';
  const maximum = '220.100';

  it.each([
    ['範囲中央', '220.000', 'OK'],
    ['下限ちょうど', '219.900', 'OK'],
    ['下限未満', '219.899', 'NG'],
    ['上限超過', '220.101', 'NG'],
    ['上限ちょうど', '220.100', '再検査'],
    ['上限との差ちょうど0.010', '220.090', 'OK'],
    ['上限との差0.009', '220.091', '再検査'],
    ['下限に近接', '219.905', 'OK'],
  ])('%sを判定する', (_caseName, measurement, expected) => {
    expect(judge(measurement, minimum, maximum)).toBe(expected);
  });

  it('測定値が非数値ならバリデーションエラーにする', () => {
    expect(() => judge('測定不能', minimum, maximum)).toThrow(
      new InspectionValidationError('測定値は数値で入力してください。'),
    );
  });
});
