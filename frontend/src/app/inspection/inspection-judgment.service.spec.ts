import { InspectionJudgmentService } from './inspection-judgment.service';

describe('InspectionJudgmentService', () => {
  const service = new InspectionJudgmentService();

  it.each([
    ['at minimum', '219.900', '219.900', '220.100', 'OK'],
    ['below minimum', '219.899', '219.900', '220.100', 'NG'],
    ['above maximum', '220.101', '219.900', '220.100', 'NG'],
    ['at maximum', '220.100', '219.900', '220.100', '再検査'],
    ['difference exactly .010', '220.090', '219.900', '220.100', 'OK'],
    ['difference .009', '220.091', '219.900', '220.100', '再検査'],
    ['difference .011', '220.089', '219.900', '220.100', 'OK'],
    ['legacy default', '220.000', '219.900', '220.100', 'OK'],
  ])('%s', (_name, sunpou, minimum, maximum, expected) => {
    expect(service.judge(sunpou, minimum, maximum)).toBe(expected);
  });
});
