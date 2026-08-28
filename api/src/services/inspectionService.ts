import type { InspectionRepository } from '../repositories/inspectionRepository';
import type { CreateInspectionInput } from '../types/inspection';
import {
  InspectionValidationError,
  judge,
  parseDecimalToMillis,
} from './inspectionJudgment';

function requiredText(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InspectionValidationError(`${fieldName}は必須です。`);
  }
  return value.trim();
}

function optionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function decimalText(value: unknown, fieldName: string): string {
  const millis = parseDecimalToMillis(value, fieldName);
  const absolute = Math.abs(millis);
  const sign = millis < 0 ? '-' : '';
  const whole = Math.floor(absolute / 1000);
  const fraction = String(absolute % 1000).padStart(3, '0');
  return `${sign}${whole}.${fraction}`;
}

export class InspectionService {
  constructor(private readonly repository: InspectionRepository) {}

  async create(body: Partial<CreateInspectionInput>) {
    const hantei = judge(body.sunpou, body.kijun_min, body.kijun_max);
    const input = {
      shiji_no: requiredText(body.shiji_no, '製造指示'),
      lot_no: optionalText(body.lot_no),
      kensa_sha: requiredText(body.kensa_sha, '検査者'),
      sunpou: decimalText(body.sunpou, '測定値'),
      kijun_min: decimalText(body.kijun_min, '規格下限'),
      kijun_max: decimalText(body.kijun_max, '規格上限'),
      furyo_naiyo: optionalText(body.furyo_naiyo),
      hantei,
    };
    const kensa_id = await this.repository.create(input);

    return { kensa_id, hantei };
  }
}
