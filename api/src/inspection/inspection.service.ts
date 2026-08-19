import { BadRequestException, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  InspectionJudgmentService,
  isNumericValue,
  NonNumericMeasurementError,
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

@Injectable()
export class InspectionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly judgment: InspectionJudgmentService,
  ) {}

  /** 検査結果の登録。バリデーション → 判定 → INSERT の順序は CFML と同じ */
  async create(dto: CreateInspectionDto): Promise<CreateInspectionResult> {
    if (!isNumericValue(dto.sunpou)) {
      throw new BadRequestException('測定値は数値で入力してください。');
    }

    let hantei;
    try {
      hantei = this.judgment.judge(dto.sunpou, dto.kijun_min, dto.kijun_max);
    } catch (error) {
      if (error instanceof NonNumericMeasurementError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const shijiNo = dto.shiji_no ?? '';
    const lotNo = dto.lot_no ?? '';
    const kensaSha = dto.kensa_sha ?? '';
    const furyoNaiyo = dto.furyo_naiyo ?? '';
    const sunpou = String(dto.sunpou);
    const kijunMin = String(dto.kijun_min);
    const kijunMax = String(dto.kijun_max);

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
