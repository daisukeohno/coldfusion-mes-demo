import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InspectionService } from './inspection.service';
import { DefectSummary, InspectionRequest, KensaResult, SimpleOrder } from './inspection.model';

/**
 * 品質検査画面 (現行 app/inspection.cfm 相当)。
 * 判定はサーバ側 (InspectionJudgmentService) が行い、この画面には閾値ロジックを持たない。
 */
@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css'
})
export class InspectionComponent implements OnInit {
  orders: SimpleOrder[] = [];
  kensaList: KensaResult[] = [];
  defects: DefectSummary[] = [];

  /** 一覧の絞込条件。現行の url.shiji_no / url.hantei に相当。 */
  filterShijiNo = '';
  filterHantei = '';

  message = '';
  messageIsError = false;

  form: InspectionRequest = {
    shijiNo: '',
    lotNo: '',
    kensaSha: '高橋 花子',
    sunpou: '220.000',
    kijunMin: '219.900',
    kijunMax: '220.100',
    furyoNaiyo: ''
  };

  constructor(private readonly inspectionService: InspectionService) {}

  ngOnInit(): void {
    this.form.lotNo = InspectionComponent.defaultLotNo(new Date());
    this.inspectionService.simpleOrders().subscribe((orders) => {
      this.orders = orders;
      if (!this.form.shijiNo && orders.length > 0) {
        this.form.shijiNo = orders[0].shijiNo;
      }
    });
    this.reload();
  }

  /** 現行画面の初期値 LOT-mmdd-01 を再現する。 */
  static defaultLotNo(today: Date): string {
    const mm = `${today.getMonth() + 1}`.padStart(2, '0');
    const dd = `${today.getDate()}`.padStart(2, '0');
    return `LOT-${mm}${dd}-01`;
  }

  submit(): void {
    this.inspectionService.register(this.form).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageIsError = false;
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.message = err.error?.message ?? '登録に失敗しました。';
        this.messageIsError = true;
      }
    });
  }

  setHanteiFilter(hantei: string): void {
    this.filterHantei = hantei;
    this.reload();
  }

  setShijiNoFilter(shijiNo: string): void {
    this.filterShijiNo = shijiNo;
    this.reload();
  }

  reload(): void {
    this.inspectionService
      .search(this.filterShijiNo, this.filterHantei)
      .subscribe((list) => (this.kensaList = list));
    this.inspectionService.defectSummary().subscribe((list) => (this.defects = list));
  }

  rowClass(row: KensaResult, index: number): string {
    if (row.hantei === 'NG') {
      return 'late';
    }
    if (row.hantei === '再検査') {
      return 'warn';
    }
    return index % 2 === 1 ? 'alt' : '';
  }
}
