export interface EquipmentPlan {
  setsubi_cd: string;
  setsubi_nm: string;
  line_cd: string;
  maker: string;
  dounyu_ymd: string;
  tenken_cycle: number;
  last_ymd: string | null;
  next_ymd: string | null;
  keika: number;
  okure: boolean;
  open_ken: number;
  kadou: boolean;
}

export interface MaintenanceRecord {
  hozen_id: number;
  setsubi_cd: string;
  setsubi_nm: string;
  line_cd: string;
  shubetsu: string;
  hassei_ymd: string;
  fukyu_ymd: string | null;
  teishi_jikan: string;
  naiyo: string;
  tantou: string;
  tenken_cycle: number;
}

export interface DowntimeSummary {
  setsubi_cd: string;
  setsubi_nm: string;
  ken: number;
  jikan: string;
}

export interface CreateMaintenanceRequest {
  setsubi_cd: string;
  shubetsu: string;
  teishi_jikan: string;
  fukyu: string;
  naiyo: string;
  tantou: string;
}

export interface CreateMaintenanceResponse {
  hozen_id: number;
  message: string;
}
