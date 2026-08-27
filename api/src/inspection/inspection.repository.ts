import { Injectable, OnModuleDestroy } from '@nestjs/common';
import mysql, {
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionJudgment } from './inspection-judgment.service';

export type InspectionRow = RowDataPacket & {
  kensa_id: number;
  shiji_no: string;
  lot_no: string;
  kensa_ymd: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: InspectionJudgment;
  furyo_naiyo: string;
  hinmoku_nm?: string;
  line_cd?: string;
};

export type DefectSummaryRow = RowDataPacket & {
  furyo_naiyo: string;
  ken: number;
};

export type ProductionOrderRow = RowDataPacket & {
  shiji_no: string;
  hinmoku_nm: string;
};

@Injectable()
export class InspectionRepository implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MES_DB_HOST ?? 'db',
      port: 3306,
      database: 'mesdb',
      user: 'mesuser',
      password: 'mespass',
      connectionLimit: 10,
      timezone: 'Z',
    });
  }

  async create(
    dto: CreateInspectionDto,
    judgment: InspectionJudgment,
  ): Promise<InspectionRow> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO t_kensa
       (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
      [
        dto.shiji_no,
        dto.lot_no,
        dto.kensa_sha,
        dto.sunpou,
        dto.kijun_min,
        dto.kijun_max,
        judgment,
        dto.furyo_naiyo,
      ],
    );
    const [rows] = await this.pool.execute<InspectionRow[]>(
      'SELECT * FROM t_kensa WHERE kensa_id = ?',
      [result.insertId],
    );
    return rows[0];
  }

  async findAll(shijiNo?: string, judgment?: string): Promise<InspectionRow[]> {
    const conditions: string[] = [];
    const params: string[] = [];
    if (shijiNo) {
      conditions.push('k.shiji_no = ?');
      params.push(shijiNo);
    }
    if (judgment) {
      conditions.push('k.hantei = ?');
      params.push(judgment);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await this.pool.execute<InspectionRow[]>(
      `SELECT k.*, h.hinmoku_nm, s.line_cd
       FROM t_kensa k
       JOIN t_seizou_shiji s ON k.shiji_no = s.shiji_no
       JOIN m_hinmoku h ON s.hinmoku_cd = h.hinmoku_cd
       ${where}
       ORDER BY k.kensa_ymd DESC, k.kensa_id DESC`,
      params,
    );
    return rows;
  }

  async defectSummary(): Promise<DefectSummaryRow[]> {
    const [rows] = await this.pool.execute<DefectSummaryRow[]>(
      `SELECT furyo_naiyo, COUNT(*) AS ken
       FROM t_kensa
       WHERE hantei <> 'OK' AND furyo_naiyo <> ''
       GROUP BY furyo_naiyo
       ORDER BY ken DESC`,
    );
    return rows;
  }

  async productionOrders(): Promise<ProductionOrderRow[]> {
    const [rows] = await this.pool.execute<ProductionOrderRow[]>(
      `SELECT s.shiji_no, h.hinmoku_nm
       FROM t_seizou_shiji s
       JOIN m_hinmoku h ON s.hinmoku_cd = h.hinmoku_cd
       ORDER BY s.shiji_no DESC`,
    );
    return rows;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
