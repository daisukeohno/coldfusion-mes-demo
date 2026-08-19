import { BadRequestException, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  INT_MAX,
  INT_MIN,
  isNumericValue,
  ProgressQuantityService,
} from './progress-quantity.service';
import {
  CreateProgressDto,
  CreateProgressResult,
  ProgressRecordRow,
  ProgressShijiRow,
  SetsubiRow,
} from './progress.dto';

/** app/progress.cfm の insert into t_kotei_jisseki 相当。kaishi_dt は CFML と同じくサーバ側で now() */
const INSERT_KANRYO_SQL = `insert into t_kotei_jisseki
  (shiji_no, kotei_no, kotei_nm, setsubi_cd, sagyousha, kaishi_dt, shuryo_dt, yoryo_suryo, furyo_suryo)
  values (?, ?, ?, ?, ?, now(), now(), ?, ?)`;

const INSERT_MIKANRYO_SQL = `insert into t_kotei_jisseki
  (shiji_no, kotei_no, kotei_nm, setsubi_cd, sagyousha, kaishi_dt, shuryo_dt, yoryo_suryo, furyo_suryo)
  values (?, ?, ?, ?, ?, now(), null, ?, ?)`;

/** 指示ヘッダの完了数・不良数へ都度加算する CFML の update をそのまま保持 */
const UPDATE_SHIJI_SQL = `update t_seizou_shiji
  set kanryo_suryo = kanryo_suryo + ?
    , furyo_suryo  = furyo_suryo  + ?
    , status = '作業中'
  where shiji_no = ?`;

const RECORD_SQL = `select j.jisseki_id, j.shiji_no, j.kotei_no, j.kotei_nm, j.setsubi_cd,
    j.sagyousha, j.kaishi_dt, j.shuryo_dt, j.yoryo_suryo, j.furyo_suryo,
    m.setsubi_nm
  from t_kotei_jisseki j
  left join m_setsubi m on j.setsubi_cd = m.setsubi_cd`;

/** 直近の実績 15 件 (CFML の limit 15 / jisseki_id desc をそのまま保持) */
const RECENT_RECORDS_SQL = `${RECORD_SQL}
  order by j.jisseki_id desc
  limit 15`;

/** 完了以外の指示のみ、納期昇順 (CFML の暗黙結合を明示 join にした) */
const SHIJI_LIST_SQL = `select s.shiji_no, s.hinmoku_cd, h.hinmoku_nm, s.line_cd, s.suryo, s.kanryo_suryo, s.status
  from t_seizou_shiji s
  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
  where s.status <> '完了'
  order by s.noki_ymd`;

const SETSUBI_LIST_SQL = `select setsubi_cd, setsubi_nm, line_cd from m_setsubi order by setsubi_cd`;

/** 工程名は CFML の固定リストと同一 */
export const KOTEI_NAMES = ['鋳造', '機械加工', '組立', '塗装', '検査'] as const;

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

/** kotei_no は INT 列。CFML では非数値だと DB 例外になっていた分を 400 に置き換える */
function koteiNoField(value: unknown): number {
  if (!isNumericValue(value)) {
    throw new BadRequestException('工程順は数値で入力してください。');
  }
  const parsed = Number(typeof value === 'number' ? value : String(value).trim());
  if (!Number.isInteger(parsed)) {
    throw new BadRequestException('工程順は整数で入力してください。');
  }
  if (parsed < INT_MIN || parsed > INT_MAX) {
    throw new BadRequestException(
      `工程順は ${INT_MIN} 〜 ${INT_MAX} の範囲で入力してください。`,
    );
  }
  return parsed;
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly db: DatabaseService,
    private readonly quantity: ProgressQuantityService,
  ) {}

  /**
   * 工程実績の登録。CFML と同じく
   *   数量の数値チェック → t_kotei_jisseki へ INSERT → t_seizou_shiji へ加算 UPDATE
   * の順に実行する。
   */
  async create(dto: CreateProgressDto): Promise<CreateProgressResult> {
    let yoryoSuryo: number;
    let furyoSuryo: number;
    try {
      // CFML は良品数・不良数をまとめて isNumeric() で判定するため、同じ 1 メッセージにする
      yoryoSuryo = this.quantity.parseCount(dto.yoryo_suryo);
      furyoSuryo = this.quantity.parseCount(dto.furyo_suryo);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const shijiNo = textField(dto.shiji_no, 'shiji_no', 20);
    const koteiNo = koteiNoField(dto.kotei_no);
    const koteiNm = textField(dto.kotei_nm, 'kotei_nm', 60);
    const setsubiCd = textField(dto.setsubi_cd, 'setsubi_cd', 20);
    const sagyousha = textField(dto.sagyousha, 'sagyousha', 60);
    const kanryo = this.quantity.isKanryo(dto.kanryo);

    const { insertId } = await this.db.insert(
      kanryo ? INSERT_KANRYO_SQL : INSERT_MIKANRYO_SQL,
      [shijiNo, koteiNo, koteiNm, setsubiCd, sagyousha, yoryoSuryo, furyoSuryo],
    );

    await this.db.insert(UPDATE_SHIJI_SQL, [yoryoSuryo, furyoSuryo, shijiNo]);

    return {
      jisseki_id: insertId,
      shiji_no: shijiNo,
      kotei_no: koteiNo,
      kotei_nm: koteiNm,
      setsubi_cd: setsubiCd,
      sagyousha,
      yoryo_suryo: yoryoSuryo,
      furyo_suryo: furyoSuryo,
      kanryo,
      message: '実績を登録しました。',
    };
  }

  /** 直近の実績 15 件 */
  async findRecentRecords(): Promise<ProgressRecordRow[]> {
    return this.db.query<ProgressRecordRow & RowDataPacket>(RECENT_RECORDS_SQL);
  }

  /** 製造指示ドロップダウン用一覧 (完了以外・納期昇順) */
  async findShijiOrders(): Promise<ProgressShijiRow[]> {
    return this.db.query<ProgressShijiRow & RowDataPacket>(SHIJI_LIST_SQL);
  }

  /** 設備ドロップダウン用一覧 */
  async findSetsubi(): Promise<SetsubiRow[]> {
    return this.db.query<SetsubiRow & RowDataPacket>(SETSUBI_LIST_SQL);
  }

  /** 工程名の選択肢 (CFML の固定リスト) */
  findKoteiNames(): string[] {
    return [...KOTEI_NAMES];
  }
}
