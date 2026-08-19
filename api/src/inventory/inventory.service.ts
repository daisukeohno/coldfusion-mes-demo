import { BadRequestException, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  CreateMovementDto,
  CreateMovementResult,
  InventoryItemRow,
  InventoryListQuery,
  InventoryListResult,
  WarehouseSummaryResult,
  WarehouseSummaryRow,
} from './inventory.dto';
import {
  fromSen,
  InvalidQuantityError,
  InventoryJudgmentService,
  MovementMode,
  QuantityOutOfRangeError,
  toSen,
} from './inventory-judgment.service';

const ITEMS_SQL = `select buhin_cd, buhin_nm, souko_cd, zaiko_su, anzen_zaiko, hacchu_ten,
    shiire_nm, tanka, (zaiko_su * tanka) as kingaku
  from t_zaiko`;

const ITEMS_ORDER_BY = ' order by souko_cd, buhin_cd';

const WAREHOUSE_SQL = `select souko_cd, count(*) as ken, sum(zaiko_su * tanka) as kingaku
  from t_zaiko
  group by souko_cd
  order by souko_cd`;

const NYUKO_SQL = `update t_zaiko set zaiko_su = zaiko_su + ?
  where buhin_cd = ? and souko_cd = ?`;

const SHUKKO_SQL = `update t_zaiko set zaiko_su = zaiko_su - ?
  where buhin_cd = ? and souko_cd = ?`;

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

type ItemQueryRow = Omit<InventoryItemRow, 'hantei'> & RowDataPacket;

@Injectable()
export class InventoryService {
  constructor(
    private readonly db: DatabaseService,
    private readonly judgment: InventoryJudgmentService,
  ) {}

  /** 在庫一覧。souko で絞込。判定はサーバ側で確定する */
  async findAll(query: InventoryListQuery): Promise<InventoryListResult> {
    const params: unknown[] = [];
    let where = '';
    if (query.souko) {
      where = ' where souko_cd = ?';
      params.push(query.souko);
    }
    const items = await this.db.query<ItemQueryRow>(`${ITEMS_SQL}${where}${ITEMS_ORDER_BY}`, params);
    const rows: InventoryItemRow[] = items.map((row) => ({
      ...row,
      hantei: this.judgment.judge(row.zaiko_su, row.anzen_zaiko, row.hacchu_ten),
    }));
    return { rows, buhin_ken: rows.length };
  }

  /**
   * 倉庫別 在庫金額。CFML と同じく倉庫絞込に関係なく全倉庫を集計し、
   * 合計は各倉庫の小計を加算して求める (1円未満の誤差が出ないよう 1/100 単位の整数で加算)。
   */
  async warehouseSummary(): Promise<WarehouseSummaryResult> {
    const rows = await this.db.query<WarehouseSummaryRow & RowDataPacket>(WAREHOUSE_SQL);
    const totalSen = rows.reduce((sum, row) => sum + toSen(row.kingaku), 0);
    return { rows, total_kingaku: fromSen(totalSen) };
  }

  /** 入出庫登録。CFML と同じく「数量検証 → UPDATE」の順序。履歴は残さない */
  async createMovement(dto: CreateMovementDto): Promise<CreateMovementResult> {
    if (dto.mode !== 'nyuko' && dto.mode !== 'shukko') {
      throw new BadRequestException('入出庫区分は nyuko または shukko で指定してください。');
    }
    const mode: MovementMode = dto.mode;

    let su: number;
    try {
      su = this.judgment.validateQuantity(dto.su);
    } catch (error) {
      if (error instanceof InvalidQuantityError || error instanceof QuantityOutOfRangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const buhinCd = textField(dto.buhin_cd, 'buhin_cd', 20);
    const soukoCd = textField(dto.souko_cd, 'souko_cd', 10);

    const { affectedRows } = await this.db.insert(mode === 'nyuko' ? NYUKO_SQL : SHUKKO_SQL, [
      su,
      buhinCd,
      soukoCd,
    ]);

    return {
      mode,
      buhin_cd: buhinCd,
      souko_cd: soukoCd,
      su,
      affected_rows: affectedRows,
      message: this.judgment.movementMessage(mode),
    };
  }
}
