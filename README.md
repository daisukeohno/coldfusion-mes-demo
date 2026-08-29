# SEIZO-MES: ColdFusion 製造実行システム (デモ用レガシー資産)

<!-- NOTE: This was built without engineering review. Consult engineering before deploying to production. -->

製造業向けの生産管理システム (MES) を、1998年から継ぎ足しで運用されてきた ColdFusion (CFML) アプリとして再現したデモ用リポジトリです。
Devin による ColdFusion モダナイゼーション (Coppel 事例と同型の進め方) を、画面付きで実演するために作成しています。実データは含みません。

対象業務は、ポンプ/送風機の部品加工ラインを想定した以下の7画面です。

| 画面 | ファイル | 内容 |
|---|---|---|
| ダッシュボード | `app/index.cfm` | 状態別/ライン別の生産集計、納期遅れ、設備未復旧、発注点割れ |
| 製造指示 一覧 | `app/orders.cfm` | キーワード/状態/ライン検索、進捗率、納期遅れ強調 |
| 製造指示 詳細 | `app/order_detail.cfm` | 指示ヘッダ、工程実績、検査結果 |
| 工程進捗入力 | `app/progress.cfm` | 実績登録 (登録と同時に指示ヘッダの完了数を加算) |
| 品質検査 | `app/inspection.cfm` | 測定値からの自動判定 (OK/NG/再検査)、不良内容集計 |
| 設備保全 | `app/maintenance.cfm` | 次回点検日の算出、保全履歴、設備別停止時間 |
| 生産日報 | `app/report.cfm` | 印刷用の集計帳票、承認欄付き |

## 起動方法

```bash
docker compose up -d      # 初回は MySQL の初期化に1分ほどかかります
open http://localhost:8888/index.cfm
```

- `web`: Lucee 5.4 (CFML エンジン)、`app/` を webroot としてマウント
- `db`: MySQL 8.0、`db/*.sql` を初期化時に投入 (スキーマ + デモデータ)
- 停止と初期化: `docker compose down -v`

## モダナイズ済み画面: 品質検査 (Angular + REST API)

`app/inspection.cfm` を、業務ルールを保持したまま Angular + NestJS へ移行したものが `frontend/` と `api/` です。CFML 版は参照元として残しています。

| ディレクトリ | スタック | 内容 |
|---|---|---|
| `api/` | NestJS + TypeScript | 判定ロジック (`src/inspection/inspection-judgment.service.ts`)、登録/一覧/集計 API |
| `frontend/` | Angular 18 | 検査画面 (`src/app/inspection/`)。登録フォーム / 検査履歴 / 不良内容集計 |

判定ロジックは UI・コントローラから切り離した `InspectionJudgmentService.judge()` に純粋関数として実装しています。比較は `DECIMAL(8,3)` と同じ小数3桁の整数演算で行うため、浮動小数点誤差で判定が変わりません。

### エンドポイント

| メソッド | パス | 内容 |
|---|---|---|
| POST | `/api/inspections` | 検査登録 (非数値の `sunpou` は 400 + `測定値は数値で入力してください。`) |
| GET | `/api/inspections?shiji_no=&hantei=` | 検査履歴 (品目名・ライン付き) |
| GET | `/api/inspections/defect-summary` | 不良内容 集計 |
| GET | `/api/shiji-orders` | 製造指示ドロップダウン用一覧 |

検索条件はすべてパラメータバインドで組み立てており、CFML 版の文字列連結 (`preserveSingleQuotes`) は踏襲していません。例外も画面全文表示ではなく構造化された JSON エラーレスポンスを返します。

### 起動方法 (Docker)

```bash
docker compose up -d --build
open http://localhost:4200        # Angular 版 品質検査
open http://localhost:8888/inspection.cfm   # 現行 CFML 版 (比較用)
open http://localhost:3000/api/inspections  # REST API
```

`db` サービス (MySQL `mesdb`) は現行 CFML 版と共用です。

### 起動方法 (ローカル)

```bash
docker compose up -d db

cd api && npm install && MES_DB_HOST=127.0.0.1 npm run start:dev   # http://localhost:3000
cd frontend && npm install && npm start                            # http://localhost:4200 (/api は 3000 へプロキシ)
```

DB 接続情報は環境変数 `MES_DB_HOST` / `MES_DB_PORT` / `MES_DB_USER` / `MES_DB_PASSWORD` / `MES_DB_NAME` で上書きできます (既定値は `db` / `3306` / `mesuser` / `mespass` / `mesdb`)。

CORS 許可オリジンは `CORS_ORIGIN` で指定します (既定値 `http://localhost:4200`)。本 API に認証は実装していないため、`*` の指定や社内ネットワーク外への公開は行わないでください。

`frontend` サービスおよび `npm start` は Angular の開発サーバ (`ng serve`) です。デモ・検証用であり本番配信構成ではありません (本番では `npm run build` の成果物を静的配信してください)。

登録 API は測定値・規格値が数値でない場合、および文字列項目が DB の列長 (`shiji_no` 20 / `lot_no` 30 / `kensa_sha` 60 / `furyo_naiyo` 255) を超える場合に 400 とメッセージを返します (DB エラーを表に出しません)。

### テスト

```bash
cd api && npm test        # 判定ロジックの境界値テスト + 登録処理テスト (DB はモック)
cd api && npm run lint
cd frontend && npm test   # Angular コンポーネントテスト (Chrome が必要)
cd frontend && npm run build
```

`api/src/inspection/inspection-judgment.service.spec.ts` で `kijun_min=219.900 / kijun_max=220.100` を基準に境界値 (219.899 / 219.900 / 220.090 / 220.091 / 220.100 / 220.101) と浮動小数点誤差ケースを検証しています。

## モダナイズ済み画面: 生産日報 (印刷用)

`app/report.cfm` を、集計条件・並び順・注記文言を保持したまま移行したものが `api/src/report/` と `frontend/src/app/report/` です (CFML 版は参照元として残しています)。

| メソッド | パス | 内容 |
|---|---|---|
| GET | `/api/report/daily?ymd=` | ライン別集計 / 工程別実績 / 作業者別実績 / 納期遅れ明細 と出力日 |

- 不良率 (完了数ベース) と達成率 (指示数ベース) は `ReportMetricsService` に純粋関数として実装。比率は整数演算で四捨五入し、赤字表示の閾値 (`不良率 3% 以上`) も整数比較で判定するため浮動小数点誤差で表示・強調が変わりません。
- 出力日と納期遅れ判定の基準日はどちらも DB の `curdate()` (サーバ側) を使います。
- 「対象日」の絞込は CFML 版と同じく未実装で、集計 SQL には渡しません (注記文言もそのまま表示)。
- 納期遅れの条件 (`status <> '完了'` かつ `noki_ymd < curdate()`) は変更せず、暗黙結合のみ明示 `join` に書き換えています。

Angular 画面は `http://localhost:4200` のナビゲーション「日報 (印刷用)」(`#report`) から開けます。比較用の CFML 版は `http://localhost:8888/report.cfm` です。

## 意図的に残しているレガシーの特徴

移行デモの題材になるよう、実際の20年級 CFML システムでよく見る構造をそのまま入れています。

- 画面 (HTML)、業務ロジック、SQL が同一ファイルに同居。共通化はインクルードのみ
- `orders.cfm` / `inspection.cfm` / `inventory.cfm` は検索条件を文字列連結で SQL に組み立て (SQL インジェクション)
- 認証・認可が存在しない (「社内ネットワークだから」という運用前提)
- 業務ルールがマスタではなく画面に埋め込まれている
  - 検査の再検査判定 (規格上限との差が 0.010mm 未満) は `inspection.cfm` のみに存在
  - 在庫の欠品判定は `inventory.cfm`、帳票側は別基準
  - 不良率はダッシュボードが指示数ベース、日報が完了数ベースで、数字が一致しない
- `maintenance.cfm` の設備一覧はループ内でクエリを発行 (N+1)
- 進捗登録はトランザクションなし、取消不可、在庫の入出庫は履歴を残さず在庫数を直接 UPDATE
- テストコードなし、仕様書は画面上のコメントと `docs/` の申し送りメモのみ
- `onError` が例外メッセージをそのまま画面に表示

これらは「移行前に仕様を復元しないと同等性を証明できない」という論点を、画面を見ながら説明するための材料です。

## デモの進め方

`docs/demo_script.md` を参照してください。Ask Devin での資産把握から、仕様復元、Angular などモダンスタックへの移行、テストマトリクス生成までの流れを記載しています。
