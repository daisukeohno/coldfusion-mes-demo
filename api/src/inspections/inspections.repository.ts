import { Injectable } from '@nestjs/common';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DbService } from '../db/db.service';
import {
  DefectSummaryRow,
  InspectionRow,
  NewInspection,
} from './inspection.dto';

export interface InspectionFilter {
  shiji_no?: string;
  hantei?: string;
}

export abstract class InspectionsRepository {
  abstract insert(rec: NewInspection): Promise<number>;
  abstract find(filter: InspectionFilter): Promise<InspectionRow[]>;
  abstract defectSummary(): Promise<DefectSummaryRow[]>;
}

@Injectable()
export class MysqlInspectionsRepository extends InspectionsRepository {
  constructor(private readonly db: DbService) {
    super();
  }

  /** kensa_ymd はサーバ側の当日日付 (curdate()) */
  async insert(rec: NewInspection): Promise<number> {
    const [res] = await this.db.connection.execute<ResultSetHeader>(
      `insert into t_kensa
         (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
       values (?, ?, curdate(), ?, ?, ?, ?, ?, ?)`,
      [
        rec.shiji_no,
        rec.lot_no,
        rec.kensa_sha,
        rec.sunpou,
        rec.kijun_min,
        rec.kijun_max,
        rec.hantei,
        rec.furyo_naiyo,
      ],
    );
    return res.insertId;
  }

  async find(filter: InspectionFilter): Promise<InspectionRow[]> {
    const where: string[] = [];
    const params: string[] = [];
    if (filter.shiji_no) {
      where.push('k.shiji_no = ?');
      params.push(filter.shiji_no);
    }
    if (filter.hantei) {
      where.push('k.hantei = ?');
      params.push(filter.hantei);
    }
    const extra = where.length ? ' and ' + where.join(' and ') : '';
    const [rows] = await this.db.connection.execute<
      (InspectionRow & RowDataPacket)[]
    >(
      `select k.kensa_id, k.shiji_no, h.hinmoku_nm, s.line_cd, k.lot_no, k.kensa_ymd,
              k.kensa_sha, k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo
       from t_kensa k
       join t_seizou_shiji s on k.shiji_no = s.shiji_no
       join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
       where 1 = 1${extra}
       order by k.kensa_ymd desc, k.kensa_id desc`,
      params,
    );
    return rows;
  }

  async defectSummary(): Promise<DefectSummaryRow[]> {
    const [rows] = await this.db.connection.execute<
      (DefectSummaryRow & RowDataPacket)[]
    >(
      `select furyo_naiyo, count(*) as ken from t_kensa
       where hantei <> 'OK' and furyo_naiyo <> ''
       group by furyo_naiyo order by ken desc`,
    );
    return rows;
  }
}
