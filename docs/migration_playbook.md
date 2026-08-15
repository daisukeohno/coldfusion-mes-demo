# ColdFusion → Angular + REST API 移行 Playbook

`app/inspection.cfm` (品質検査) の移行で確立した手順を、他画面へそのまま適用できる汎用ステップとして記述する。
各ステップに「inspection.cfm での具体例」と「他画面への適用ポイント」を併記する。

成果物の対応:

| 現行 | 移行後 |
|---|---|
| `app/inspection.cfm` (画面 + 判定 + SQL) | `api/` (Spring Boot: Controller / Service / Repository) + `web-angular/` (Angular: Component / Service) |
| 画面に埋め込まれた再検査判定 | `InspectionJudgmentService.judge()` (純粋関数) + `RECHECK_THRESHOLD` 定数 |
| テストなし | `InspectionJudgmentServiceTest` / `InspectionServiceValidationTest` (境界値・異常系) |

既存 ColdFusion アプリは削除せず並存させる (同等性検証のため)。

---

## ステップ1. 現行 .cfm から業務ルール・SQL・画面項目・境界条件を抽出しドキュメント化

やること:

- 業務判定・計算のロジック (条件式、閾値、初期値、丸め) を列挙する。
- SQL を洗い出し、結合条件・並び順・絞込条件・集計条件をそのまま書き出す。
- 画面項目 (入力欄、初期値、プルダウンのデータ源、強調表示の条件、絞込リンク) を列挙する。
- 境界条件 (等号を含むか、0 や空文字の扱い、非数値入力) を明示する。ここが移行事故の最大要因。

inspection.cfm での具体例:

1. `sunpou` が数値でなければ登録せず「測定値は数値で入力してください。」。
2. 判定初期値は `OK`。`sunpou < kijun_min` または `sunpou > kijun_max` で `NG`。
3. `OK` かつ `(kijun_max - sunpou) < 0.010` で `再検査`。**等号を含まない**ため 差 0.010 ちょうど (例: 220.090) は `OK`、上限ちょうど 220.100 は 差 0 で `再検査`。
4. `t_kensa` に INSERT。`kensa_ymd` は `curdate()` (当日)。小数は `DECIMAL(8,3)`。
5. 検査履歴は `shiji_no` / `hantei` で絞込 (すべて / NGのみ / 再検査のみ)、`kensa_ymd desc, kensa_id desc`。
6. 不良内容集計は `hantei <> 'OK' AND furyo_naiyo <> ''` を group by、件数降順。
7. 規格値は画面の入力値から来る (マスタ化されていない) ため、移行後も画面から受け取る仕様を維持。

他画面への適用ポイント:

- 「仕様書にないが画面に書かれている暫定運用」を必ず拾う (再検査判定は 2011年の暫定対応でコメントのみが根拠)。
- 同一概念が画面ごとに違う定義を持つ場合 (不良率、欠品判定) は、突合前に**差異一覧**として先に書き出す。統合するかどうかは業務判断。
- `preserveSingleQuotes` を使った文字列連結 SQL は、抽出時点で「どの条件が任意か」を明確にしておく (移行後はバインド変数になる)。

## ステップ2. 業務判定/計算ロジックを純粋関数としてサービス層に切り出す (DB / HTTP 非依存)

やること:

- 判定/計算だけを引数と戻り値で表現できる形に切り出し、DB 接続・リクエスト・セッションに依存させない。
- 画面に散っていた閾値は定数として1箇所に定義する (挙動は変えない)。
- 小数比較は `BigDecimal` (または整数スケール) で行い、`double` 演算を使わない。

inspection.cfm での具体例:

- `InspectionJudgmentService.judge(sunpou, kijunMin, kijunMax)` が `"OK" / "NG" / "再検査"` を返す純粋関数。
- `RECHECK_THRESHOLD = new BigDecimal("0.010")` を単一定義。
- `220.1d - 220.09d` は `0.009999999999990905` となり `double` では誤って `再検査` になる。`BigDecimal` 比較でこれを回避しつつ、現行 CFML (内部で十進演算) と同じ結果を得る。
- 入力検証 (`isNumeric` 相当) はユースケース側 (`InspectionService`) に置き、判定関数は数値だけを扱う。

他画面への適用ポイント:

- 「1画面 = 1判定サービス」を目安に切る。日付計算・在庫判定・集計式も同じ扱い。
- 純粋関数にできない処理 (採番、当日日付、トランザクション) は明確に外側 (Service / Repository) へ寄せる。当日日付は現行同様 DB 側 (`curdate()` / `now()`) に寄せると突合しやすい。

## ステップ3. 境界値・異常系の単体テストを先に用意し、現行挙動を正解として固定

やること:

- 閾値の「ちょうど / ±1最小単位」を必ずテストする。
- 異常系 (非数値、欠落、空文字、0、負値) をテストする。
- 浮動小数の誤差が出る値を意図的に含める。

inspection.cfm での具体例 (`min=219.900 / max=220.100`):

| 測定値 | 期待 | 意味 |
|---|---|---|
| 219.899 | NG | 下限未満 |
| 219.900 | OK | 下限ちょうど |
| 220.090 | OK | 上限差 = 0.010 ちょうど (等号を含まない) |
| 220.091 | 再検査 | 上限差 < 0.010 |
| 220.100 | 再検査 | 上限ちょうど (差 0) |
| 220.101 | NG | 上限超過 |
| `abc` / 空 / 欠落 | 400 + 「測定値は数値で入力してください。」 | 検証エラー、DB へ書かない |

他画面への適用ポイント:

- テストを先に書くことで「現行がバグでも挙動は維持する」判断を明文化できる。仕様変更したい点は別 PR / 別チケットに切り出す。
- 表記揺れ (`220.09` と `220.0900`) でも同じ判定になることを確認する (`compareTo` を使い `equals` を使わない)。

## ステップ4. REST API (Controller + Service + Repository) を実装。文字列連結 SQL はパラメータバインドへ

やること:

- Controller は入出力のみ。判定はサービス層へ委譲する。
- 検証エラーは 400 + 現行同等メッセージで返す (画面の "NG:" メッセージを踏襲)。
- 絞込条件は `where 1 = 1` + 条件ごとの `?` バインドに置換 (SQL インジェクション除去)。並び順・結合は現行と一致させる。
- 暗黙結合 (`from a, b where a.x = b.x`) は `join` に書き換えるが、結果集合は変えない。

inspection.cfm での具体例:

- `POST /api/inspections` : 検証 → `judge` → `t_kensa` INSERT → 判定を含むレスポンス。
- `GET /api/inspections?shijiNo=&hantei=` : 履歴取得 (品目名・ライン結合、`kensa_ymd desc, kensa_id desc`)。
- `GET /api/inspections/defect-summary` : 不良内容集計。
- `GET /api/orders/simple` : 製造指示プルダウン用 (`shiji_no` + `hinmoku_nm`)。
- DB 接続は `docker-compose.yml` に合わせ `mesdb` / `mesuser` / `mespass`、ホストは `MES_DB_HOST`。

他画面への適用ポイント:

- 書込系は現行にトランザクションがないため、移行時に `@Transactional` で囲む (挙動改善だが業務影響を要確認: 二重登録の扱いは変えない)。
- N+1 はリポジトリで単一クエリ (集約 + LEFT JOIN) に置き換える。画面側のループでクエリを投げない。
- 履歴を残さない直接 UPDATE (在庫) は、まず現行同等で移行し、履歴テーブル追加は別タスクとして起票する。

## ステップ5. Angular コンポーネント + Service を実装し、画面項目・絞込・強調表示を再現

やること:

- `HttpClient` ラッパー (Angular の Service) に API 呼び出しを集約する。
- コンポーネントは現行の項目・初期値・絞込リンク・行の強調色をそのまま再現する。
- **判定ロジックをクライアントに複製しない** (閾値はサーバのみ)。

inspection.cfm での具体例:

- `InspectionService` (Angular) が 4 エンドポイントを呼ぶ。
- `InspectionComponent` が 登録フォーム (製造指示 select / ロット `LOT-mmdd-01` / 検査者 / 測定値 220.000 / 規格 219.900-220.100 / 不良内容) + 判定メッセージ + 履歴テーブル (NG は `late` = 赤、再検査は `warn` = 黄) + 不良内容集計 を表示。
- 絞込リンク「すべて / NGのみ / 再検査のみ」は `hantei` クエリパラメータへ。
- 数値表示は `number: '1.3-3'` で現行の `numberFormat(...,"9.999")` に合わせる。

他画面への適用ポイント:

- 現行 `mes.css` のクラス (`grid` / `late` / `warn` / `ok` / `ng` / `box`) をそのまま持ち込むと、旧画面と並べた目視突合が容易になる。
- 入力は現行同様テキストで送り、数値検証はサーバ側に一本化する (検証メッセージの二重管理を避ける)。

## ステップ6. 同一 DB スナップショットで新旧の出力を突合 (同等性検証)

やること:

1. `docker compose up -d` で DB を初期化し、`mysqldump` でスナップショットを取得する。
2. 旧画面 (`http://localhost:8888/inspection.cfm`) と新画面 (`ng serve` + API) で同じ入力を実行し、判定結果・登録行・一覧の並び・集計件数を比較する。
3. 参照系は API レスポンスと旧画面 HTML の行数・順序を突合する。
4. 書込系は各実行前に DB をスナップショットへ戻し、`t_kensa` の INSERT 内容 (列単位) を比較する。
5. 差異が出た場合は「現行がバグ」か「移行漏れ」かを判定し、前者はチケット化して挙動は維持する。

inspection.cfm での具体例:

- 境界値 6 件 (219.899 / 219.900 / 220.090 / 220.091 / 220.100 / 220.101) を旧新両方で登録し、`hantei` の一致を確認する。
- 非数値 `abc` は 旧: 画面メッセージ / 新: 400 + 同一文言、いずれも `t_kensa` に行が増えないことを確認する。

他画面への適用ポイント:

- 集計系は端数処理 (`numberFormat` の丸め) まで比較する。不良率のように定義が画面間で異なる場合は、突合対象を「どちらの定義か」明示してから比較する。

---

## 並列展開 (画面依存関係に基づく割当)

| 波 | 画面 | 依存・リスク | 備考 |
|---|---|---|---|
| A (並行着手可) | `maintenance.cfm` | 他画面と共有ロジックなし | 次回点検日算出の切り出しと N+1 解消 |
| A (並行着手可) | `inventory.cfm` | 判定閾値が帳票側と不一致 | 3段階在庫判定 + 入出庫。履歴テーブル追加は要検討 (別タスク) |
| B (低リスク・先行) | `orders.cfm`, `order_detail.cfm` | 参照系のみ | 文字列連結 SQL のバインド化が主眼。`order_detail` は `t_kensa` を参照するため本移行の API を再利用 |
| C (書込系) | `progress.cfm` | `t_kotei_jisseki` INSERT + `t_seizou_shiji` 加算 | 2 文をトランザクション化。完了数の加算仕様 (二重登録で不整合) は現行維持し別チケット |
| D (集計系・最後) | `index.cfm`, `report.cfm` | 上流の書込系仕様が固まってから | 不良率の定義不一致 (ダッシュボード = 指示数ベース / 日報 = 完了数ベース) は**業務判断が必要**。統合可否の合意が取れるまで両方の式を残す |

波 A / B は同時並行で着手できる。C は A/B のリポジトリ層 (指示・工程) が固まってから、D は C の後に着手する。

### 画面ごとに切り出すサービス層ロジックと境界値テスト対象

| 画面 | 切り出すサービス層ロジック | 境界値テスト対象 |
|---|---|---|
| `inspection.cfm` (完了) | `InspectionJudgmentService.judge()` : OK / NG / 再検査 (閾値 0.010、等号なし) | 下限ちょうど・下限未満・上限差 0.010 ちょうど・上限差 < 0.010・上限ちょうど・上限超過・非数値/欠落 |
| `maintenance.cfm` | `NextInspectionDateService.next(lastTenkenYmd, tenkenCycle)` : 最終**定期点検**日 (`max(hassei_ymd) where shubetsu = '定期点検'`) + `tenken_cycle` 日。遅延判定は 次回 < 当日、定期点検履歴なしは「記録なし」+ 遅延扱い | 履歴 0 件 (遅延 true) / `tenken_cycle` が null または 0 / 次回 = 当日 (遅延でない) / 次回 = 当日-1 (遅延) / 定期点検以外 (故障修理・部品交換) の履歴のみ / 月末をまたぐ加算・うるう年 |
| `inventory.cfm` | `StockJudgmentService.judge(zaikoSu, anzenZaiko, hacchuTen)` : 欠品リスク / 発注点割れ / 適正 (`<` 比較)。`StockMoveService` : 入出庫の加減算 | 在庫 = 安全在庫 (適正側) / 安全在庫-1 / 在庫 = 発注点 / 発注点-1 / 安全在庫 > 発注点 の矛盾データ / 数量 0・負値・非数値 / 出庫で在庫がマイナスになるケース |
| `orders.cfm` | `ProgressRateService.rate(kanryoSuryo, suryo)` : 進捗率。`DelayService.isLate(nokiYmd, status)` : 納期遅れ | 指示数 0 (0 除算) / 完了数 > 指示数 (100% 超) / 納期 = 当日 / 納期 = 当日-1 / status = 完了 の遅れ扱い |
| `order_detail.cfm` | 参照のみ (工程実績の並び・検査結果の再利用) | 工程実績 0 件 / 検査結果 0 件 / 判定混在時の表示 |
| `progress.cfm` | `ProgressRegistrationService.register()` : 実績 INSERT + 指示ヘッダ加算 + status 更新をトランザクションで実行 | 良品数/不良数が非数値・負値・0 / 完了数が指示数を超える / 同一工程の二重登録 / 完了フラグ有無での `shuryo_dt` |
| `index.cfm` | `DefectRateService.byInstruction(furyo, suryo)` : 指示数ベース不良率。状態別/ライン別集計、納期遅れ・設備未復旧・発注点割れ抽出 | 分母 0 / 不良数 0 / 端数の丸め (小数2桁) / 対象 0 件 |
| `report.cfm` | `DefectRateService.byCompletion(furyo, kanryo)` : 完了数ベース不良率、達成率 | 分母 0 (完了数 0) / 不良数 > 完了数 / 丸め / 対象 0 件 |

不良率は `index.cfm` と `report.cfm` で分母が異なる。**同一メソッドに統合してはならない** (数値が変わる)。統合は業務側の合意後に行う。

## TODO (本移行のスコープ外)

- **認証・認可**: 現行に存在しないため、本移行では API を既存同等 (認証なし) とした。公開経路に出す前に認証 (例: OIDC / JWT) と画面単位の認可を追加する必要がある。別タスクとして起票する。
- 在庫の入出庫履歴テーブルの新設 (`inventory.cfm` 移行時に検討)。
- 規格値 (`kijun_min` / `kijun_max`) の品目マスタ化。現行は画面入力のため移行後も画面入力を維持している。
- 不良率定義の統一 (業務判断)。
- 現行 `onError` が例外メッセージを画面表示している点の是正 (API 側は共通ハンドラでメッセージを制御)。

## ローカル実行手順

```bash
# 1. DB と 現行 ColdFusion アプリ (並存)
docker compose up -d          # http://localhost:8888/inspection.cfm

# 2. REST API
cd api && MES_DB_HOST=127.0.0.1 mvn spring-boot:run   # http://localhost:8080/api/inspections

# 3. Angular
cd web-angular && npm install && npm start            # http://localhost:4200 (/api は 8080 へプロキシ)
```

判定ロジックの単体テスト: `cd api && mvn test`
