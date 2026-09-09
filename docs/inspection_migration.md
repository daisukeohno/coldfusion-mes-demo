# 品質検査画面 (`app/inspection.cfm`) の Angular + REST API 移行

現行 CFML 画面 `app/inspection.cfm` を、判定ルールを変えずに以下へ移行したものです。

| 層 | 場所 | 現行との対応 |
|---|---|---|
| 判定ロジック | `api/src/inspections/inspection-judgment.service.ts` (`InspectionJudgmentService.judge`) | `inspection.cfm` 9〜21行目。DB / HTTP から独立した純粋関数 |
| REST API | `api/src/inspections/*`, `api/src/orders/*` (NestJS + mysql2) | 登録 / 履歴 / 不良集計 / 製造指示プルダウン |
| 画面 | `frontend/src/app/inspection/*` (Angular) | フォーム、履歴一覧 (絞込・色分け)、不良内容集計 |

判定はフロントに重複実装せず、`POST /api/inspections` のレスポンス (`hantei`) を表示します。

## 判定ルール (現行と同等)

1. 測定値 `sunpou` が数値でない場合は登録せず、HTTP 400 とメッセージ「測定値は数値で入力してください。」を返す。
2. 判定初期値は `OK`。
3. `sunpou < kijun_min` または `sunpou > kijun_max` なら `NG`。
4. 判定が `OK` かつ `(kijun_max - sunpou) < 0.010` なら `再検査` に上書き。
   - 許容差判定は **規格上限側のみ**。下限側 (`sunpou - kijun_min`) は判定に使わない。
   - 比較は厳密な **未満 (<)**。差がちょうど 0.010 は `OK`。
   - 小数は `decimal.js` で DECIMAL(8,3) 相当の精度で比較し、浮動小数の丸め誤差 (例: `220.100 - 220.090 = 0.00999…`) で判定が変わらない。

## 境界値の期待挙動 (kijun_min=219.900, kijun_max=220.100)

`api/src/inspections/inspection-judgment.service.spec.ts` で検証しています。

| ケース | sunpou | 期待判定 | 理由 |
|---|---|---|---|
| 下限ちょうど | 219.900 | OK | `sunpou < kijun_min` ではない |
| 下限直下 (kijun_min - 0.001) | 219.899 | NG | 下限未満 |
| 下限側は許容差判定の対象外 (kijun_min + 0.001) | 219.901 | OK | 下限との差 0.001 は判定に使わない |
| 上限との差 0.011 (kijun_max - 0.011) | 220.089 | OK | 差 0.011 ≥ 0.010 |
| 上限との差ちょうど 0.010 (kijun_max - 0.010) | 220.090 | OK | 差 0.010 は「未満」ではない |
| 上限との差 0.009 (kijun_max - 0.009) | 220.091 | 再検査 | 差 0.009 < 0.010 |
| 上限ちょうど | 220.100 | 再検査 | 範囲内かつ差 0 < 0.010 |
| 上限超過 (kijun_max + 0.001) | 220.101 | NG | 上限超過 |
| 非数値 (`abc`, 空文字 など) | - | 400 エラー | 登録されない。「測定値は数値で入力してください。」 |

## API

| メソッド | パス | 内容 |
|---|---|---|
| POST | `/api/inspections` | 判定を実行し `t_kensa` へ登録 (`kensa_ymd` はサーバ側で `curdate()`)。`{ kensa_id, hantei, message }` を返す |
| GET | `/api/inspections?shiji_no=&hantei=` | 履歴一覧 (現行 `qKensa` 相当)。条件はパラメータバインド (文字列連結 SQL は再現しない) |
| GET | `/api/inspections/defect-summary` | `hantei <> 'OK' and furyo_naiyo <> ''` を不良内容ごとに件数集計 (現行 `qFuryo` 相当) |
| GET | `/api/orders` | 製造指示プルダウン用一覧 (現行 `qShijiList` 相当) |

POST の DTO: `shiji_no, lot_no, kensa_sha, sunpou, kijun_min, kijun_max, furyo_naiyo` (数値項目は現行画面同様に文字列可)。

## 起動

```bash
docker compose up -d db                                  # MySQL (既存スキーマ db/01_schema.sql)
(cd api && npm install && MES_DB_HOST=127.0.0.1 npm run start:dev)   # http://localhost:3000/api/inspections
(cd frontend && npm install && npm start)                # http://localhost:4200 (/api は 3000 へプロキシ)
```

API の DB 接続は環境変数 `MES_DB_HOST / MES_DB_PORT / MES_DB_USER / MES_DB_PASSWORD / MES_DB_NAME` で指定します
(既定値は docker-compose.yml の `mesuser / mespass / mesdb`)。ローカルから接続する場合は `docker-compose.yml` の `db` に
`ports: ["3306:3306"]` を追加してください。

## テスト

```bash
cd api
npm test          # 判定サービスの境界値テスト
npm run test:e2e  # API 統合テスト (リポジトリをインメモリ実装に差し替え。POST → GET、絞込、不良集計、400)
npm run lint
```
