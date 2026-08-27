import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';

export type InspectionJudgment = 'OK' | 'NG' | '再検査';

@Injectable()
export class InspectionJudgmentService {
  judge(
    sunpou: string | Decimal,
    kijunMin: string | Decimal,
    kijunMax: string | Decimal,
  ): InspectionJudgment {
    const measurement = new Decimal(sunpou);
    const minimum = new Decimal(kijunMin);
    const maximum = new Decimal(kijunMax);

    let judgment: InspectionJudgment = 'OK';
    if (measurement.lessThan(minimum) || measurement.greaterThan(maximum)) {
      judgment = 'NG';
    }
    if (judgment === 'OK' && maximum.minus(measurement).lessThan(new Decimal('0.010'))) {
      judgment = '再検査';
    }
    return judgment;
  }
}
