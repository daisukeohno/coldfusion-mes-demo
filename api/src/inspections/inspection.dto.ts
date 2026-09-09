import type { Hantei } from './inspection-judgment.service.js';

/** POST /api/inspections の入力。数値項目は現行画面と同様に文字列でも受け付ける */
export interface CreateInspectionDto {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string | number;
  kijun_min: string | number;
  kijun_max: string | number;
  furyo_naiyo: string;
}

export interface InspectionDto {
  kensa_id: number;
  shiji_no: string;
  lot_no: string;
  kensa_ymd: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: Hantei;
  furyo_naiyo: string;
  hinmoku_nm: string;
  line_cd: string;
}

export interface CreateInspectionResultDto {
  kensa_id: number;
  hantei: Hantei;
  message: string;
}

export interface DefectSummaryDto {
  furyo_naiyo: string;
  ken: number;
}

export interface InspectionFilter {
  shiji_no?: string;
  hantei?: string;
}
