import { Injectable } from '@angular/core';
import { InspectionJudgment } from './inspection.types';

@Injectable({ providedIn: 'root' })
export class InspectionJudgmentService {
  judge(sunpou: string, kijunMin: string, kijunMax: string): InspectionJudgment | null {
    if (!/^-?(?:\d+|\d+\.\d{1,3})$/.test(sunpou)) return null;
    const measurement = this.toScaledInteger(sunpou);
    const minimum = this.toScaledInteger(kijunMin);
    const maximum = this.toScaledInteger(kijunMax);
    let judgment: InspectionJudgment = 'OK';
    if (measurement < minimum || measurement > maximum) judgment = 'NG';
    if (judgment === 'OK' && maximum - measurement < 10) judgment = '再検査';
    return judgment;
  }

  private toScaledInteger(value: string): number {
    const [whole, fraction = ''] = value.split('.');
    return Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
  }
}
