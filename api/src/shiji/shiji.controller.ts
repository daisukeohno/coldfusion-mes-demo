import { Controller, Get } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DbService } from '../db/db.service';

export interface ShijiOption {
  shiji_no: string;
  hinmoku_nm: string;
}

@Controller('api/shiji')
export class ShijiController {
  constructor(private readonly db: DbService) {}

  @Get()
  async list(): Promise<ShijiOption[]> {
    const [rows] = await this.db.connection.execute<
      (ShijiOption & RowDataPacket)[]
    >(
      `select s.shiji_no, h.hinmoku_nm
       from t_seizou_shiji s join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
       order by s.shiji_no desc`,
    );
    return rows;
  }
}
