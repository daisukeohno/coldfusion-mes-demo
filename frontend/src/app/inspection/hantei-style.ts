import { Hantei } from './inspection.model';

/**
 * 判定に対応する表示クラス。現行画面の色分け (NG=赤系, 再検査=warn) をそのまま再現する。
 * 判定自体はバックエンドの InspectionJudgmentService が決めるため、ここでは分岐しない。
 */
export function hanteiRowClass(hantei: Hantei): string {
  switch (hantei) {
    case 'NG':
      return 'late';
    case '再検査':
      return 'warn';
    default:
      return '';
  }
}

/** 判定セル内のテキストのクラス。 */
export function hanteiTextClass(hantei: Hantei): string {
  return hantei === 'OK' ? 'ok' : 'ng';
}
