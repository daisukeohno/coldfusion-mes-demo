export interface ProgressRecord {
  jisseki_id: number;
  shiji_no: string;
  kotei_no: number;
  kotei_nm: string;
  setsubi_cd: string;
  setsubi_nm: string | null;
  sagyousha: string;
  kaishi_dt: string;
  shuryo_dt: string | null;
  yoryo_suryo: number;
  furyo_suryo: number;
}

export interface ProgressShijiOrder {
  shiji_no: string;
  hinmoku_cd: string;
  hinmoku_nm: string;
  line_cd: string;
  suryo: number;
  kanryo_suryo: number;
  status: string;
}

export interface Setsubi {
  setsubi_cd: string;
  setsubi_nm: string;
  line_cd: string;
}

export interface CreateProgressRequest {
  shiji_no: string;
  kotei_no: string;
  kotei_nm: string;
  setsubi_cd: string;
  sagyousha: string;
  yoryo_suryo: string;
  furyo_suryo: string;
  kanryo: string;
}

export interface CreateProgressResponse {
  jisseki_id: number;
  shiji_no: string;
  yoryo_suryo: number;
  furyo_suryo: number;
  kanryo: boolean;
  message: string;
}
