import { IsOptional, IsString, MaxLength } from 'class-validator';

/** sunpou/kijun_* は数値バリデーションを判定サービスに委ねるため文字列で受ける */
export class CreateInspectionDto {
  @IsString()
  @MaxLength(20)
  shiji_no!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  lot_no?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  kensa_sha?: string;

  @IsOptional()
  sunpou?: unknown;

  @IsOptional()
  kijun_min?: unknown;

  @IsOptional()
  kijun_max?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  furyo_naiyo?: string;
}

export interface InspectionRow {
  kensa_id: number;
  shiji_no: string;
  hinmoku_nm: string;
  line_cd: string | null;
  lot_no: string | null;
  kensa_ymd: string | null;
  kensa_sha: string | null;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: string;
  furyo_naiyo: string | null;
}

export interface DefectSummaryRow {
  furyo_naiyo: string;
  ken: number;
}

export interface NewInspection {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: string;
  furyo_naiyo: string;
}

export interface CreateInspectionResponse {
  kensa_id: number;
  hantei: string;
  message: string;
}
