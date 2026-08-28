import { BadRequestException, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  Hantei,
  InspectionJudgmentService,
  NonNumericMeasurementError,
  NonNumericSpecLimitError,
  toDecimalString,
} from './inspection-judgment.service';
import {
  CreateInspectionDto,
  CreateInspectionResult,
  DefectSummaryRow,
  InspectionListQuery,
  InspectionRow,
  ShijiOrderRow,
} from './inspection.dto';

const INSERT_SQL = `insert into t_kensa
  (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
  values (?, ?, curdate(), ?, ?, ?, ?, ?, ?)`;

const LIST_SQL = `select k.kensa_id, k.shiji_no, k.lot_no, k.kensa_ymd, k.kensa_sha,
    k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo,
    h.hinmoku_nm, s.line_cd
  from t_kensa k
  join t_seizou_shiji s on k.shiji_no = s.shiji_no
  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd`;

const DEFECT_SUMMARY_SQL = `select furyo_naiyo, count(*) as ken
  from t_kensa
  where hantei <> 'OK' and furyo_naiyo <> ''
  group by furyo_naiyo
  order by ken desc`;

const SHIJI_LIST_SQL = `select s.shiji_no, h.hinmoku_nm
  from t_seizou_shiji s
  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
  order by s.shiji_no desc`;

/** DB 列長・型に合わない値は DB エラーではなく 400 で返す */
function textField(value: string | undefined, name: string, maxLength: number): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} は文字列で入力してください。`);
  }
  if (value.length > maxLength) {
    throw new BadRequestException(`${name} は ${maxLength} 文字以内で入力してください。`);
  }
  return value;
}

@Injectable()
export class InspectionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly judgment: InspectionJudgmentService,
  ) {}

  /** 検査結果の登録。バリデーション → 判定 → INSERT の順序は CFML と同じ */
  async create(dto: CreateInspectionDto): Promise<CreateInspectionResult> {
    // DECIMAL(8,3) 列へは正規化した十進文字列をバインドする (CFML の cf_sql_decimal scale=3 相当)
    const sunpou = toDecimalString(dto.sunpou);
    if (sunpou === null) {
      throw new BadRequestException(new NonNumericMeasurementError().message);
    }
    const kijunMin = toDecimalString(dto.kijun_min);
    const kijunMax = toDecimalString(dto.kijun_max);
    if (kijunMin === null || kijunMax === null) {
      throw new BadRequestException(new NonNumericSpecLimitError().message);
    }

    const hantei: Hantei = this.judgment.judge(sunpou, kijunMin, kijunMax);

    const shijiNo = textField(dto.shiji_no, 'shiji_no', 20);
    const lotNo = textField(dto.lot_no, 'lot_no', 30);
    const kensaSha = textField(dto.kensa_sha, 'kensa_sha', 60);
    const furyoNaiyo = textField(dto.furyo_naiyo, 'furyo_naiyo', 255);

    const { insertId } = await this.db.insert(INSERT_SQL, [
      shijiNo,
      lotNo,
      kensaSha,
      sunpou,
      kijunMin,
      kijunMax,
      hantei,
      furyoNaiyo,
    ]);

    const saved = await this.db.query<InspectionRow & RowDataPacket>(
      `${LIST_SQL} where k.kensa_id = ?`,
      [insertId],
    );
    const row = saved[0];

    return {
      kensa_id: insertId,
      shiji_no: shijiNo,
      lot_no: lotNo,
      kensa_ymd: row?.kensa_ymd ?? '',
      kensa_sha: kensaSha,
      sunpou: row?.sunpou ?? sunpou,
      kijun_min: row?.kijun_min ?? kijunMin,
      kijun_max: row?.kijun_max ?? kijunMax,
      hantei,
      furyo_naiyo: furyoNaiyo,
      message: `検査結果を登録しました。判定は ${hantei} です。`,
    };
  }

  /** 検査履歴。shiji_no / hantei で絞込。SQL は必ずパラメータバインド */
  async findAll(query: InspectionListQuery): Promise<InspectionRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (query.shiji_no) {
      conditions.push('k.shiji_no = ?');
      params.push(query.shiji_no);
    }
    if (query.hantei) {
      conditions.push('k.hantei = ?');
      params.push(query.hantei);
    }
    const where = conditions.length > 0 ? ` where ${conditions.join(' and ')}` : '';
    const sql = `${LIST_SQL}${where} order by k.kensa_ymd desc, k.kensa_id desc`;
    return this.db.query<InspectionRow & RowDataPacket>(sql, params);
  }

  /** 不良内容 集計 */
  async defectSummary(): Promise<DefectSummaryRow[]> {
    return this.db.query<DefectSummaryRow & RowDataPacket>(DEFECT_SUMMARY_SQL);
  }

  /** 製造指示ドロップダウン用一覧 */
  async findShijiOrders(): Promise<ShijiOrderRow[]> {
    return this.db.query<ShijiOrderRow & RowDataPacket>(SHIJI_LIST_SQL);
  }
}
