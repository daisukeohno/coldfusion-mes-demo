import { BadRequestException, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  MaintenanceJudgmentService,
  TEISHI_JIKAN_MAX_CENTI,
  centiToDecimalString,
  toCenti,
} from './maintenance-judgment.service';
import {
  CreateMaintenanceDto,
  CreateMaintenanceResult,
  DowntimeSummaryRow,
  EquipmentPlanRow,
  MaintenanceRow,
} from './maintenance.dto';

/** app/maintenance.cfm の種別ドロップダウンと同じ選択肢 */
export const SHUBETSU_LIST = ['定期点検', '故障修理', '部品交換'] as const;

/** 最終点検日の判定対象となる種別 */
const TEIKI_TENKEN = '定期点検';

/** 復旧済のときだけ fukyu_ymd に curdate() を入れる (CFML の cfif と同じ) */
const insertSql = (fukyuZumi: boolean): string => `insert into t_hozen
  (setsubi_cd, shubetsu, hassei_ymd, fukyu_ymd, teishi_jikan, naiyo, tantou)
  values (?, ?, curdate(), ${fukyuZumi ? 'curdate()' : 'null'}, ?, ?, ?)`;

/**
 * 設備一覧 + 最終点検日 + 未復旧件数。
 * CFML では設備ごとに 2 本のクエリを投げていた (N+1) が、
 * 同じ集計条件を保ったまま 1 本にまとめている。
 */
const EQUIPMENT_SQL = `select m.setsubi_cd, m.setsubi_nm, m.line_cd, m.maker, m.dounyu_ymd, m.tenken_cycle,
    (select max(z.hassei_ymd) from t_hozen z
      where z.setsubi_cd = m.setsubi_cd and z.shubetsu = ?) as last_ymd,
    (select count(*) from t_hozen z
      where z.setsubi_cd = m.setsubi_cd and z.fukyu_ymd is null) as open_ken
  from m_setsubi m
  order by m.line_cd, m.setsubi_cd`;

const HISTORY_SQL = `select z.hozen_id, z.setsubi_cd, z.shubetsu, z.hassei_ymd, z.fukyu_ymd,
    z.teishi_jikan, z.naiyo, z.tantou,
    m.setsubi_nm, m.line_cd, m.tenken_cycle
  from t_hozen z
  join m_setsubi m on z.setsubi_cd = m.setsubi_cd
  order by z.hassei_ymd desc`;

const DOWNTIME_SUMMARY_SQL = `select z.setsubi_cd, m.setsubi_nm, sum(z.teishi_jikan) as jikan, count(*) as ken
  from t_hozen z
  join m_setsubi m on z.setsubi_cd = m.setsubi_cd
  group by z.setsubi_cd, m.setsubi_nm
  order by jikan desc`;

const TODAY_SQL = 'select curdate() as today';

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
export class MaintenanceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly judgment: MaintenanceJudgmentService,
  ) {}

  /** 保全記録の登録。バリデーション → 正規化 → INSERT の順序は CFML と同じ */
  async create(dto: CreateMaintenanceDto): Promise<CreateMaintenanceResult> {
    const setsubiCd = textField(dto.setsubi_cd, 'setsubi_cd', 20);
    const shubetsu = textField(dto.shubetsu, 'shubetsu', 20);
    const naiyo = textField(dto.naiyo, 'naiyo', 255);
    const tantou = textField(dto.tantou, 'tantou', 60);

    if (setsubiCd === '') {
      throw new BadRequestException('設備を選択してください。');
    }
    if (!SHUBETSU_LIST.includes(shubetsu as (typeof SHUBETSU_LIST)[number])) {
      throw new BadRequestException('種別は定期点検・故障修理・部品交換から選択してください。');
    }
    if (!(await this.setsubiExists(setsubiCd))) {
      throw new BadRequestException('設備マスタに存在しない設備コードです。');
    }

    // CFML の isNumeric(form.teishi_jikan) ? form.teishi_jikan : 0 と同じ扱い
    const centi = toCenti(dto.teishi_jikan) ?? 0;
    if (Math.abs(centi) > TEISHI_JIKAN_MAX_CENTI) {
      throw new BadRequestException('停止時間(h) は 999999.99 以内で入力してください。');
    }
    const teishiJikan = centiToDecimalString(centi);

    // 復旧済 ('1') のときだけ復旧日にサーバの当日を入れる
    const fukyuZumi = dto.fukyu === '1';

    const { insertId } = await this.db.insert(insertSql(fukyuZumi), [
      setsubiCd,
      shubetsu,
      teishiJikan,
      naiyo,
      tantou,
    ]);

    const today = await this.today();

    return {
      hozen_id: insertId,
      setsubi_cd: setsubiCd,
      shubetsu,
      hassei_ymd: today,
      fukyu_ymd: fukyuZumi ? today : null,
      teishi_jikan: teishiJikan,
      naiyo,
      tantou,
      message: '保全記録を登録しました。',
    };
  }

  /** 設備一覧 / 次回点検予定。判定は純粋サービスで行う */
  async findEquipmentPlans(): Promise<EquipmentPlanRow[]> {
    const today = await this.today();
    const rows = await this.db.query<RowDataPacket>(EQUIPMENT_SQL, [TEIKI_TENKEN]);
    return rows.map((row) => {
      const plan = this.judgment.plan({
        dounyu_ymd: row.dounyu_ymd,
        tenken_cycle: row.tenken_cycle,
        last_ymd: row.last_ymd,
        today,
      });
      const openKen = Number(row.open_ken ?? 0);
      return {
        setsubi_cd: String(row.setsubi_cd),
        setsubi_nm: String(row.setsubi_nm ?? ''),
        line_cd: String(row.line_cd ?? ''),
        maker: String(row.maker ?? ''),
        dounyu_ymd: row.dounyu_ymd === null ? '' : String(row.dounyu_ymd),
        tenken_cycle: Number(row.tenken_cycle ?? 0),
        last_ymd: row.last_ymd === null ? null : String(row.last_ymd),
        next_ymd: plan.next_ymd,
        keika: plan.keika,
        okure: plan.okure,
        open_ken: openKen,
        kadou: this.judgment.isKadou(openKen),
      };
    });
  }

  /** 保全履歴。CFML と同じ内部結合・並び順 (発生日の降順のみ) */
  async findAll(): Promise<MaintenanceRow[]> {
    return this.db.query<MaintenanceRow & RowDataPacket>(HISTORY_SQL);
  }

  /** 設備別 停止時間 累計 */
  async downtimeSummary(): Promise<DowntimeSummaryRow[]> {
    const rows = await this.db.query<RowDataPacket>(DOWNTIME_SUMMARY_SQL);
    return rows.map((row) => ({
      setsubi_cd: String(row.setsubi_cd),
      setsubi_nm: String(row.setsubi_nm ?? ''),
      ken: Number(row.ken ?? 0),
      jikan: row.jikan === null ? '0.00' : String(row.jikan),
    }));
  }

  /** 発生日・復旧日と同じ「サーバの当日」を DB から取得する */
  private async today(): Promise<string> {
    const rows = await this.db.query<RowDataPacket>(TODAY_SQL);
    const today = rows[0]?.today;
    return today === undefined || today === null ? '' : String(today).slice(0, 10);
  }

  private async setsubiExists(setsubiCd: string): Promise<boolean> {
    const rows = await this.db.query<RowDataPacket>(
      'select setsubi_cd from m_setsubi where setsubi_cd = ?',
      [setsubiCd],
    );
    return rows.length > 0;
  }
}
