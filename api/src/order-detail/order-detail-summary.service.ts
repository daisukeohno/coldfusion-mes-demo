import { Injectable } from '@nestjs/common';

export interface OrderDetailSummaryInput {
  suryo: unknown;
  kanryo_suryo: unknown;
  hyojun_jikan: unknown;
}

export interface OrderDetailSummary {
  zan: number;
  rate: number;
  yotei_kosu: number | null;
}

const HUNDRED = 100;

function decimalToInteger(value: unknown, scale: number): number | null {
  let text: string;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    text = value.toFixed(10);
  } else if (typeof value === 'string') {
    text = value.trim();
  } else {
    return null;
  }

  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(text)) {
    return null;
  }

  const sign = text.startsWith('-') ? -1 : 1;
  const unsigned = text.replace(/^[+-]/, '');
  const [integerPart, fractionPart = ''] = unsigned.split('.');
  const fraction = (fractionPart + '0'.repeat(scale)).slice(0, scale);
  const remainder = fractionPart.slice(scale);
  let result = Number(integerPart || '0') * 10 ** scale + Number(fraction);
  if (remainder.length > 0 && Number(remainder[0]) >= 5) {
    result += 1;
  }
  return sign * result;
}

function integerValue(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  if (typeof value === 'string' && /^[+-]?\d+$/.test(value.trim())) {
    return Number(value);
  }
  return 0;
}

/** 整数同士の除算を 0 方向へ切り捨てる (CFML の int() 相当) */
function truncateDivision(numerator: number, denominator: number): number {
  const sign = numerator < 0 ? -1 : 1;
  return sign * Math.trunc(Math.abs(numerator) / denominator);
}

@Injectable()
export class OrderDetailSummaryService {
  calculate(input: OrderDetailSummaryInput): OrderDetailSummary {
    const suryo = integerValue(input.suryo);
    const kanryo = integerValue(input.kanryo_suryo);
    const hyojunJikanCenti = decimalToInteger(input.hyojun_jikan, 2);

    return {
      zan: suryo - kanryo,
      rate: suryo > 0 ? truncateDivision(kanryo * HUNDRED, suryo) : 0,
      yotei_kosu:
        hyojunJikanCenti === null
          ? null
          : (suryo * hyojunJikanCenti) / HUNDRED,
    };
  }
}
