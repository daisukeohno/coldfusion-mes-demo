import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DbService } from '../db/db.service.js';
import type { Hantei } from './inspection-judgment.service.js';
import type {
  DefectSummaryDto,
  InspectionDto,
  InspectionFilter,
} from './inspection.dto.js';

export interface NewInspectionRecord {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: Hantei;
  furyo_naiyo: string;
}

export abstract class InspectionsRepository {
  abstract insert(record: NewInspectionRecord): Promise<number>;
  abstract findAll(filter: InspectionFilter): Promise<InspectionDto[]>;
  abstract defectSummary(): Promise<DefectSummaryDto[]>;
}

@Injectable()
export class MysqlInspectionsRepository extends InspectionsRepository {
  constructor(private readonly db: DbService) {
    super();
  }

  async insert(r: NewInspectionRecord): Promise<number> {
    const result = await this.db.execute(
      `insert into t_kensa
         (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
       values (?, ?, curdate(), ?, ?, ?, ?, ?, ?)`,
      [
        r.shiji_no,
        r.lot_no,
        r.kensa_sha,
        r.sunpou,
        r.kijun_min,
        r.kijun_max,
        r.hantei,
        r.furyo_naiyo,
      ],
    );
    return result.insertId;
  }

  async findAll(filter: InspectionFilter): Promise<InspectionDto[]> {
    const conditions: string[] = [];
    const params: string[] = [];
    if (filter.shiji_no) {
      conditions.push('k.shiji_no = ?');
      params.push(filter.shiji_no);
    }
    if (filter.hantei) {
      conditions.push('k.hantei = ?');
      params.push(filter.hantei);
    }
    const where = conditions.length ? ` and ${conditions.join(' and ')}` : '';
    const rows = await this.db.query<InspectionDto & RowDataPacket>(
      `select k.kensa_id, k.shiji_no, k.lot_no, k.kensa_ymd, k.kensa_sha,
              k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo,
              h.hinmoku_nm, s.line_cd
         from t_kensa k
         join t_seizou_shiji s on k.shiji_no = s.shiji_no
         join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
        where 1 = 1${where}
        order by k.kensa_ymd desc, k.kensa_id desc`,
      params,
    );
    return rows;
  }

  async defectSummary(): Promise<DefectSummaryDto[]> {
    const rows = await this.db.query<DefectSummaryDto & RowDataPacket>(
      `select furyo_naiyo, count(*) as ken from t_kensa
        where hantei <> 'OK' and furyo_naiyo <> ''
        group by furyo_naiyo order by ken desc`,
    );
    return rows.map((r) => ({
      furyo_naiyo: r.furyo_naiyo,
      ken: Number(r.ken),
    }));
  }
}
