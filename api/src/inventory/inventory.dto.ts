import { MovementMode, ZaikoHantei } from './inventory-judgment.service';

export interface InventoryListQuery {
  souko?: string;
}

export interface InventoryItemRow {
  buhin_cd: string;
  buhin_nm: string;
  souko_cd: string;
  zaiko_su: number;
  anzen_zaiko: number;
  hacchu_ten: number;
  shiire_nm: string;
  tanka: string;
  /** zaiko_su * tanka (DECIMAL のまま SQL で計算) */
  kingaku: string;
  hantei: ZaikoHantei;
}

export interface InventoryListResult {
  rows: InventoryItemRow[];
  /** 部品点数 KPI。絞込後の件数 (CFML の qZaiko.recordCount) */
  buhin_ken: number;
}

export interface WarehouseSummaryRow {
  souko_cd: string;
  ken: number;
  kingaku: string;
}

export interface WarehouseSummaryResult {
  rows: WarehouseSummaryRow[];
  /** 在庫金額 合計。倉庫絞込に関係なく全倉庫の合計 (CFML の sumKingaku) */
  total_kingaku: string;
}

export interface CreateMovementDto {
  mode?: string;
  buhin_cd?: string;
  souko_cd?: string;
  su?: unknown;
}

export interface CreateMovementResult {
  mode: MovementMode;
  buhin_cd: string;
  souko_cd: string;
  su: number;
  affected_rows: number;
  message: string;
}
