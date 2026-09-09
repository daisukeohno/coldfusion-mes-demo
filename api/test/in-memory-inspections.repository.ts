import type {
  DefectSummaryDto,
  InspectionDto,
  InspectionFilter,
} from '../src/inspections/inspection.dto.js';
import {
  InspectionsRepository,
  NewInspectionRecord,
} from '../src/inspections/inspections.repository.js';

/** MySQL 版と同じ抽出条件・並び順を再現したテスト用リポジトリ */
export class InMemoryInspectionsRepository extends InspectionsRepository {
  rows: InspectionDto[] = [];
  private seq = 0;

  async insert(r: NewInspectionRecord): Promise<number> {
    const kensa_id = ++this.seq;
    this.rows.push({
      kensa_id,
      ...r,
      kensa_ymd: new Date().toISOString().slice(0, 10),
      hinmoku_nm: `品目-${r.shiji_no}`,
      line_cd: 'L1',
    });
    return kensa_id;
  }

  async findAll(filter: InspectionFilter): Promise<InspectionDto[]> {
    return this.rows
      .filter((r) => !filter.shiji_no || r.shiji_no === filter.shiji_no)
      .filter((r) => !filter.hantei || r.hantei === filter.hantei)
      .sort((a, b) =>
        a.kensa_ymd === b.kensa_ymd
          ? b.kensa_id - a.kensa_id
          : b.kensa_ymd.localeCompare(a.kensa_ymd),
      );
  }

  async defectSummary(): Promise<DefectSummaryDto[]> {
    const counts = new Map<string, number>();
    for (const r of this.rows) {
      if (r.hantei !== 'OK' && r.furyo_naiyo !== '') {
        counts.set(r.furyo_naiyo, (counts.get(r.furyo_naiyo) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([furyo_naiyo, ken]) => ({ furyo_naiyo, ken }))
      .sort((a, b) => b.ken - a.ken);
  }
}
