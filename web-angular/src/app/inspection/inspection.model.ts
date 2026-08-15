/** REST API (api/) のレスポンス型。判定ロジックはサーバ側にのみ存在する。 */
export interface KensaResult {
  kensaId: number;
  shijiNo: string;
  hinmokuNm: string;
  lineCd: string;
  lotNo: string;
  kensaYmd: string;
  kensaSha: string;
  sunpou: number;
  kijunMin: number;
  kijunMax: number;
  hantei: string;
  furyoNaiyo: string;
}

export interface DefectSummary {
  furyoNaiyo: string;
  ken: number;
}

export interface SimpleOrder {
  shijiNo: string;
  hinmokuNm: string;
}

export interface InspectionRequest {
  shijiNo: string;
  lotNo: string;
  kensaSha: string;
  /** 現行画面と同じくテキストのまま送り、数値検証はサーバ側で行う。 */
  sunpou: string;
  kijunMin: string;
  kijunMax: string;
  furyoNaiyo: string;
}

export interface InspectionResponse {
  hantei: string;
  message: string;
  kensa: KensaResult | null;
}
