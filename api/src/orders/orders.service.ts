import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DbService } from '../db/db.service.js';

export interface OrderOptionDto {
  shiji_no: string;
  hinmoku_nm: string;
}

/** 現行 inspection.cfm の qShijiList 相当 (製造指示プルダウン) */
@Injectable()
export class OrdersService {
  constructor(private readonly db: DbService) {}

  list(): Promise<OrderOptionDto[]> {
    return this.db.query<OrderOptionDto & RowDataPacket>(
      `select s.shiji_no, h.hinmoku_nm
         from t_seizou_shiji s
         join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
        order by s.shiji_no desc`,
    );
  }
}
