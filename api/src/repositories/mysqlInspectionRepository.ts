import type {
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import type {
  DefectSummary,
  InspectionInsert,
  InspectionRecord,
  OrderOption,
} from '../types/inspection';
import type {
  InspectionFilters,
  InspectionRepository,
} from './inspectionRepository';

type InspectionRow = InspectionRecord & RowDataPacket;
type DefectSummaryRow = DefectSummary & RowDataPacket;
type OrderOptionRow = OrderOption & RowDataPacket;

export class MysqlInspectionRepository implements InspectionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: InspectionInsert): Promise<number> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO t_kensa
        (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
      [
        input.shiji_no,
        input.lot_no,
        input.kensa_sha,
        input.sunpou,
        input.kijun_min,
        input.kijun_max,
        input.hantei,
        input.furyo_naiyo,
      ],
    );

    return result.insertId;
  }

  async findAll(filters: InspectionFilters): Promise<InspectionRecord[]> {
    const conditions: string[] = [];
    const parameters: string[] = [];

    if (filters.shiji_no) {
      conditions.push('k.shiji_no = ?');
      parameters.push(filters.shiji_no);
    }
    if (filters.hantei) {
      conditions.push('k.hantei = ?');
      parameters.push(filters.hantei);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await this.pool.execute<InspectionRow[]>(
      `SELECT
         k.kensa_id,
         k.shiji_no,
         h.hinmoku_nm,
         s.line_cd,
         k.lot_no,
         k.kensa_ymd,
         k.kensa_sha,
         k.sunpou,
         k.kijun_min,
         k.kijun_max,
         k.hantei,
         k.furyo_naiyo
       FROM t_kensa k
       INNER JOIN t_seizou_shiji s ON k.shiji_no = s.shiji_no
       INNER JOIN m_hinmoku h ON s.hinmoku_cd = h.hinmoku_cd
       ${whereClause}
       ORDER BY k.kensa_ymd DESC, k.kensa_id DESC`,
      parameters,
    );

    return rows;
  }

  async getDefectSummary(): Promise<DefectSummary[]> {
    const [rows] = await this.pool.execute<DefectSummaryRow[]>(
      `SELECT furyo_naiyo, COUNT(*) AS ken
       FROM t_kensa
       WHERE hantei <> ? AND furyo_naiyo <> ?
       GROUP BY furyo_naiyo
       ORDER BY ken DESC`,
      ['OK', ''],
    );

    return rows.map((row) => ({
      furyo_naiyo: row.furyo_naiyo,
      ken: Number(row.ken),
    }));
  }

  async getOrders(): Promise<OrderOption[]> {
    const [rows] = await this.pool.execute<OrderOptionRow[]>(
      `SELECT s.shiji_no, h.hinmoku_nm
       FROM t_seizou_shiji s
       INNER JOIN m_hinmoku h ON s.hinmoku_cd = h.hinmoku_cd
       ORDER BY s.shiji_no DESC`,
    );

    return rows;
  }
}
