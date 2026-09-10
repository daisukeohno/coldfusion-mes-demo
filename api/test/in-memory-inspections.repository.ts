import {
  DefectSummaryRow,
  InspectionRow,
  NewInspection,
} from '../src/inspections/inspection.dto';
import {
  InspectionFilter,
  InspectionsRepository,
} from '../src/inspections/inspections.repository';

/** 結合テスト用: t_kensa 相当を配列で保持し、SQL と同じ絞込/集計を行う */
export class InMemoryInspectionsRepository extends InspectionsRepository {
  rows: InspectionRow[] = [];
  private nextId = 1;

  seed(rows: Omit<InspectionRow, 'kensa_id'>[]): void {
    for (const r of rows) this.rows.push({ kensa_id: this.nextId++, ...r });
  }

  insert(rec: NewInspection): Promise<number> {
    const id = this.nextId++;
    this.rows.push({
      kensa_id: id,
      hinmoku_nm: 'テスト品目',
      line_cd: 'L1',
      kensa_ymd: new Date().toISOString().slice(0, 10),
      ...rec,
    });
    return Promise.resolve(id);
  }

  find(filter: InspectionFilter): Promise<InspectionRow[]> {
    return Promise.resolve(
      this.rows
        .filter((r) => !filter.shiji_no || r.shiji_no === filter.shiji_no)
        .filter((r) => !filter.hantei || r.hantei === filter.hantei)
        .sort((a, b) => b.kensa_id - a.kensa_id),
    );
  }

  defectSummary(): Promise<DefectSummaryRow[]> {
    const counts = new Map<string, number>();
    for (const r of this.rows) {
      if (r.hantei !== 'OK' && r.furyo_naiyo && r.furyo_naiyo !== '') {
        counts.set(r.furyo_naiyo, (counts.get(r.furyo_naiyo) ?? 0) + 1);
      }
    }
    return Promise.resolve(
      [...counts.entries()]
        .map(([furyo_naiyo, ken]) => ({ furyo_naiyo, ken }))
        .sort((a, b) => b.ken - a.ken),
    );
  }
}
