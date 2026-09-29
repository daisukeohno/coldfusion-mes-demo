/** 製造指示 詳細画面は未移行のため、旧 CFML 画面 (Lucee) へリンクする。 */
export const LEGACY_BASE_URL = 'http://localhost:8888';

export function legacyOrderDetailUrl(shijiNo: string): string {
  return `${LEGACY_BASE_URL}/order_detail.cfm?shiji_no=${encodeURIComponent(shijiNo)}`;
}
