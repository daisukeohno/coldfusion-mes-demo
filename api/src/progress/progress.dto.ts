export interface CreateProgressDto {
  shiji_no?: string;
  kotei_no?: unknown;
  kotei_nm?: string;
  setsubi_cd?: string;
  sagyousha?: string;
  yoryo_suryo?: unknown;
  furyo_suryo?: unknown;
  kanryo?: unknown;
}

export interface CreateProgressResult {
  jisseki_id: number;
  shiji_no: string;
  kotei_no: number;
  kotei_nm: string;
  setsubi_cd: string;
  sagyousha: string;
  yoryo_suryo: number;
  furyo_suryo: number;
  kanryo: boolean;
  message: string;
}

export interface ProgressRecordRow {
  jisseki_id: number;
  shiji_no: string;
  kotei_no: number;
  kotei_nm: string;
  setsubi_cd: string;
  setsubi_nm: string;
  sagyousha: string;
  kaishi_dt: string;
  shuryo_dt: string | null;
  yoryo_suryo: number;
  furyo_suryo: number;
}

export interface ProgressShijiRow {
  shiji_no: string;
  hinmoku_cd: string;
  hinmoku_nm: string;
  line_cd: string;
  suryo: number;
  kanryo_suryo: number;
  status: string;
}

export interface SetsubiRow {
  setsubi_cd: string;
  setsubi_nm: string;
  line_cd: string;
}
