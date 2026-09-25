# 品質検査画面 (`app/inspection.cfm`) の移行仕様

旧 ColdFusion 画面を Spring Boot REST API (`backend/`) と Angular コンポーネント (`frontend/`) に移行した際に、
`inspection.cfm` に埋め込まれていた暗黙仕様を明文化したもの。**仕様源は旧 `app/inspection.cfm` L9-21 のみ**であり、
本書はその読み替えである。

## 1. 保持した業務ルール (判定ロジック)

実装: `backend/src/main/java/com/seizo/mes/inspection/InspectionJudgmentService.java`
(`judge(BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax) -> Hantei`)

| # | 旧 CFML | ルール | 備考 |
|---|---|---|---|
| 1 | `<cfif NOT isNumeric(form.sunpou)>` | 測定値 `sunpou` が数値でなければ **登録せず** エラー | API では 400 `{"errors":{"sunpou":"測定値は数値で入力してください。"}}`。欠損 (null / 空文字) も同じ扱い |
| 2 | `<cfset hantei = "OK">` | 判定の初期値は `OK` | |
| 3 | `sunpou LT kijun_min OR sunpou GT kijun_max` | 規格範囲外は `NG` | 下限・上限ちょうどは範囲内 |
| 4 | `hantei EQ "OK" AND (kijun_max - sunpou) LT 0.010` | 上限との差が **0.010 未満** なら `再検査` | 2011年 暫定運用。仕様書に記載なし。閾値ちょうど (差 = 0.010) は `OK` のまま。NG には適用しない |

判定値は `OK` / `NG` / `再検査` の3種類のみ (`Hantei` enum)。

設計上の判断:

- 判定は DB / HTTP に依存しない純粋関数とし、`InspectionService` (登録処理) から呼び出す。
- `DECIMAL(8,3)` 同士の比較と `0.010` の減算で浮動小数点誤差を出さないため、`double` ではなく `BigDecimal#compareTo` を使う
  (`220.100 - 220.090` を double で計算すると `0.010` にならない)。
- フロントエンドには判定ロジックを持たせない。画面は API が返した `hantei` を表示するだけ。

## 2. データと API

対象テーブル: `t_kensa` (`db/01_schema.sql`)。`kensa_ymd` は登録時の当日 (旧 `curdate()`、Asia/Tokyo)。

| 旧画面の機能 | API | 備考 |
|---|---|---|
| (a) 登録 + 自動判定 (`form.mode=regist`) | `POST /api/inspections` | body: `shiji_no, lot_no, kensa_sha, sunpou, kijun_min, kijun_max, furyo_naiyo`。201 で登録行 (`hantei` 含む) を返す |
| (b) 検査履歴一覧 (`qKensa`) | `GET /api/inspections?shiji_no=&hantei=` | `hinmoku_nm`, `line_cd` を JOIN。`kensa_ymd desc, kensa_id desc`。旧画面の文字列連結 SQL は使わず名前付きパラメータでバインド |
| (c) 不良内容集計 (`qFuryo`) | `GET /api/inspections/defect-summary` | `hantei <> 'OK' and furyo_naiyo <> ''` を `furyo_naiyo` で group、件数降順 |
| 製造指示ドロップダウン (`qShijiList`) | `GET /api/orders` | `shiji_no` + `hinmoku_nm`、`shiji_no desc` |

旧画面との差分 (意図的なもの):

- `hantei` の絞込値が `OK/NG/再検査` 以外なら 400 (旧画面は空一覧を返していた)。
- 存在しない `shiji_no` での登録は 400 (旧画面は登録できてしまい、一覧 JOIN から消える孤児レコードになっていた)。
- `sunpou` / `kijun_*` は小数第3位まで (`@Digits(integer=5, fraction=3)`)。DECIMAL(8,3) への暗黙丸めを防ぐ。

## 3. 境界値テストの意図

`backend/src/test/java/com/seizo/mes/inspection/InspectionJudgmentServiceTest.java`
(規格 `kijun_min=219.900`, `kijun_max=220.100`)

| sunpou | 期待 | 確認したいこと |
|---|---|---|
| 219.900 | OK | 下限ちょうどは範囲内 (`LT` は等号を含まない) |
| 219.899 | NG | 下限を 0.001 下回れば NG |
| 220.000 | OK | 範囲中央 |
| 220.100 | 再検査 | 上限ちょうどは差 0 < 0.010 で再検査 (OK ではない) |
| 220.101 | NG | 上限超過は再検査ではなく NG |
| 220.091 | 再検査 | 差 0.009 < 0.010 |
| 220.090 | OK | 差 0.010 は "less than" を満たさない (閾値ちょうど) |
| 220.089 | OK | 差 0.011 |
| 非数値 / 空 | 400・未登録 | `InspectionApiIntegrationTest` で t_kensa の件数が増えないことを確認 |

加えて、`220.09` と `220.090` のようなスケール違いを同値扱いすること、NG が再検査より優先されること、
規格幅が 0.010 未満なら範囲内が全て再検査になることを確認している。

API 統合テスト `InspectionApiIntegrationTest` は H2 (MySQL モード) に旧スキーマを再現し、
POST → 判定結果 → 一覧 / 絞込 / 集計への反映を通しで検証する。

## 4. 起動方法

```bash
docker compose up -d db                      # MySQL 8.0 (ホスト 3306 を公開)
(cd backend && mvn spring-boot:run)          # http://localhost:8080/api/inspections
(cd frontend && npm install && npm start)    # http://localhost:4200 (/api は 8080 へプロキシ)
```

テスト:

```bash
(cd backend && mvn test)
(cd frontend && npx ng test --watch=false --browsers=ChromeHeadless)
```

接続先は環境変数 `MES_DB_HOST` / `MES_DB_PORT` / `MES_DB_NAME` / `MES_DB_USER` / `MES_DB_PASSWORD` で上書きできる
(既定は docker-compose の `127.0.0.1:3306/mesdb`, `mesuser`/`mespass`)。
