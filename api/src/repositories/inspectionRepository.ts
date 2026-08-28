import type {
  DefectSummary,
  InspectionInsert,
  InspectionRecord,
  OrderOption,
} from '../types/inspection';

export interface InspectionFilters {
  shiji_no?: string;
  hantei?: string;
}

export interface InspectionRepository {
  create(input: InspectionInsert): Promise<number>;
  findAll(filters: InspectionFilters): Promise<InspectionRecord[]>;
  getDefectSummary(): Promise<DefectSummary[]>;
  getOrders(): Promise<OrderOption[]>;
}
