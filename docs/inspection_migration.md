# 品質検査 (inspection.cfm) 移行版: Angular + REST API

`app/inspection.cfm` の品質検査機能を、業務ルールを保持したまま Angular コンポーネントと REST API に移行したものです。
旧画面 `app/inspection.cfm` はデモ資産としてそのまま残しています。

| ディレクトリ | 内容 |
|---|---|
| `api/` | NestJS 11 + mysql2。判定サービス / REST API / 境界値テスト・結合テスト |
| `frontend/` | Angular 20 (standalone, signals)。品質検査コンポーネント |

## 起動方法

```bash
# 1. MySQL (+ 旧 Lucee 画面)。初回は DB 初期化に約1分。DB はホストの 3306 に公開されます
docker compose up -d

# 2. REST API (http://localhost:3000)
cd api && npm install && MES_DB_HOST=127.0.0.1 npm run start:dev

# 3. Angular (http://localhost:4200、/api は 3000 へプロキシ)
cd frontend && npm install && npm start
```

API の接続先は環境変数で変更できます (既定値は docker-compose.yml の db サービスに一致):
`MES_DB_HOST=127.0.0.1` `MES_DB_PORT=3306` `MES_DB_USER=mesuser` `MES_DB_PASSWORD=mespass` `MES_DB_NAME=mesdb` `PORT=3000`

## テスト / ビルド

```bash
cd api && npm test          # 判定サービス 境界値テスト (DB 不要)
cd api && npm run test:e2e  # REST エンドポイント結合テスト (インメモリ リポジトリ)
cd api && npm run lint && npm run build
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
cd frontend && npm run build
```

## REST API

| メソッド / パス | 内容 | 旧コードの対応箇所 |
|---|---|---|
| `POST /api/inspections` | 登録。数値バリデーション → 判定 → `t_kensa` INSERT。非数値は 400 + 「測定値は数値で入力してください。」 | `form.mode EQ "regist"` ブロック |
| `GET /api/inspections?shiji_no=&hantei=` | 検査履歴。絞込はパラメータバインド | `qKensa` (文字列連結 SQL を置換) |
| `GET /api/inspections/defect-summary` | `hantei <> 'OK' AND furyo_naiyo <> ''` を furyo_naiyo で集計、件数降順 | `qFuryo` |
| `GET /api/shiji` | 製造指示セレクトの選択肢 (`t_seizou_shiji` × `m_hinmoku`) | `qShijiList` |

`POST` の例:

```bash
curl -X POST localhost:3000/api/inspections -H 'content-type: application/json' \
  -d '{"shiji_no":"SJ-2608-0002","lot_no":"LOT-0910-01","kensa_sha":"高橋 花子","sunpou":"220.095","kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":""}'
# => {"kensa_id":13,"hantei":"再検査","message":"検査結果を登録しました。判定は 再検査 です。"}
```

## 旧 inspection.cfm との対応関係

| 旧コード (inspection.cfm) | 移行先 |
|---|---|
| `isNumeric(form.sunpou)` / 「測定値は数値で入力してください。」 | `api/src/inspections/inspection-judgment.service.ts` `isNumeric()` / `INVALID_SUNPOU_MESSAGE` |
| `hantei = "OK"`、`sunpou LT kijun_min OR sunpou GT kijun_max` → NG | 同 `judge()` (ルール2) |
| 2011年暫定: `hantei EQ "OK" AND (kijun_max - sunpou) LT 0.010` → 再検査 | 同 `judge()` (ルール3)。しきい値は定数 `REINSPECTION_THRESHOLD_MM = '0.010'`。`LT` 比較のため 0.010 ちょうどは OK |
| `insert into t_kensa (... curdate() ...)` | `api/src/inspections/inspections.repository.ts` `insert()` (kensa_ymd はサーバ側 `curdate()`) |
| `where` の文字列連結 + `preserveSingleQuotes` | 同 `find()`。`?` プレースホルダにバインド |
| `qFuryo` | 同 `defectSummary()` |
| `qShijiList` | `api/src/shiji/shiji.controller.ts` |
| 画面 (フォーム / 検査履歴 / 不良内容集計) | `frontend/src/app/inspection/inspection.component.{ts,html}` |
| 行スタイル `class="late"` (NG) / `class="warn"` (再検査) / `alt` | `InspectionComponent.rowClass()` |
| 絞込リンク すべて / NGのみ / 再検査のみ | `InspectionComponent.setFilter()` → `GET /api/inspections?hantei=` |
| `app/mes.css` | `frontend/src/styles.css` (必要な定義のみ移植) |

### 判定ロジックの実装メモ

- 判定は `InspectionJudgmentService` に集約し、コントローラ / リポジトリからは呼び出すだけです。
- `DECIMAL(8,3)` の値を浮動小数点で引き算すると `0.3 - 0.29 = 0.010000000000000009` のように境界がぶれるため、
  10進文字列を固定小数点 (BigInt) に変換して比較しています。数値は API へ文字列で送る想定です (数値型も受け付けます)。
- フロントエンド (`frontend/src/app/inspection/inspection-judgment.service.ts`) に同じロジックの TypeScript 実装を置き、
  入力中の「予測」を即時表示しています。登録時に採用する正式な判定はサーバ結果です。

### db/02_seed.sql との整合

`api/src/inspections/inspection-judgment.service.spec.ts` で seed の全レコードを判定サービスに通し、
`hantei` と一致することを確認しています (例: 220.010/219.900/220.100 → OK、220.140 → NG)。

例外は `LOT-D403` (100.310 / 100.000 / 100.500、seed 上は「再検査」) です。上限との差は 0.190 で 0.010 未満ではないため、
旧 `inspection.cfm` のロジックでも「OK」と判定されます。seed の「再検査」は現場の手入力 (要 三次元測定) を模したデータであり、
判定ルールから導かれる値ではない点をテストで明示しています。

## 境界値テスト (api/src/inspections/inspection-judgment.service.spec.ts)

| ケース | 期待 |
|---|---|
| sunpou == kijun_min | OK |
| sunpou が kijun_min をわずかに下回る | NG |
| sunpou == kijun_max (差 0) | 再検査 |
| sunpou が kijun_max をわずかに上回る | NG |
| kijun_max - sunpou == 0.010 | OK |
| kijun_max - sunpou == 0.009 | 再検査 |
| 範囲中央 | OK |
| 非数値 (空文字 / 文字列 / null) | バリデーションエラー |
