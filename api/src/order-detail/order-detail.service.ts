import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  OrderDetailHeader,
  OrderDetailInspectionRow,
  OrderDetailProcessRow,
  OrderDetailResult,
} from './order-detail.dto';
import { OrderDetailSummaryService } from './order-detail-summary.service';

const HEADER_SQL = `select s.*, h.hinmoku_nm, h.kikaku, h.tani, h.hyojun_jikan
  from t_seizou_shiji s
  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
  where s.shiji_no = ?`;

const PROCESS_SQL = `select j.*, m.setsubi_nm
  from t_kotei_jisseki j
  left join m_setsubi m on j.setsubi_cd = m.setsubi_cd
  where j.shiji_no = ?
  order by j.kotei_no`;

const INSPECTION_SQL = `select kensa_id, shiji_no, lot_no, kensa_ymd, kensa_sha,
    sunpou, kijun_min, kijun_max, hantei, furyo_naiyo
  from t_kensa
  where shiji_no = ?
  order by kensa_ymd desc, kensa_id desc`;

function validateShijiNo(shijiNo: string | undefined): string {
  if (typeof shijiNo !== 'string' || shijiNo.trim() === '') {
    throw new BadRequestException('shiji_no は必須です。');
  }
  if (shijiNo.length > 20) {
    throw new BadRequestException('shiji_no は 20 文字以内で入力してください。');
  }
  return shijiNo;
}

@Injectable()
export class OrderDetailService {
  constructor(
    private readonly db: DatabaseService,
    private readonly summary: OrderDetailSummaryService,
  ) {}

  async findOne(shijiNo?: string): Promise<OrderDetailResult> {
    const validatedShijiNo = validateShijiNo(shijiNo);
    const headers = await this.db.query<OrderDetailHeader & RowDataPacket>(HEADER_SQL, [
      validatedShijiNo,
    ]);
    const shiji = headers[0];
    if (!shiji) {
      throw new NotFoundException(`指示番号 ${validatedShijiNo} は登録されていません。`);
    }

    const kotei = await this.db.query<OrderDetailProcessRow & RowDataPacket>(PROCESS_SQL, [
      validatedShijiNo,
    ]);
    const kensa = await this.db.query<OrderDetailInspectionRow & RowDataPacket>(INSPECTION_SQL, [
      validatedShijiNo,
    ]);

    return {
      shiji,
      summary: this.summary.calculate(shiji),
      kotei,
      kensa,
    };
  }
}
