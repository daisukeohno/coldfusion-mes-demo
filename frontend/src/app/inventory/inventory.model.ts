export type ZaikoHantei = '欠品リスク' | '発注点割れ' | '適正';

export type MovementMode = 'nyuko' | 'shukko';

export interface InventoryItem {
  buhin_cd: string;
  buhin_nm: string;
  souko_cd: string;
  zaiko_su: number;
  anzen_zaiko: number;
  hacchu_ten: number;
  shiire_nm: string;
  tanka: string;
  kingaku: string;
  hantei: ZaikoHantei;
}

export interface InventoryList {
  rows: InventoryItem[];
  buhin_ken: number;
}

export interface WarehouseSummary {
  souko_cd: string;
  ken: number;
  kingaku: string;
}

export interface WarehouseSummaryList {
  rows: WarehouseSummary[];
  total_kingaku: string;
}

export interface CreateMovementRequest {
  mode: MovementMode;
  buhin_cd: string;
  souko_cd: string;
  su: string;
}

export interface CreateMovementResponse {
  mode: MovementMode;
  buhin_cd: string;
  souko_cd: string;
  su: number;
  affected_rows: number;
  message: string;
}
