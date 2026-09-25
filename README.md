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

## 移行版 (品質検査画面)

`app/inspection.cfm` を Spring Boot REST API (`backend/`) + Angular (`frontend/`) に移行したものを同梱しています。
判定ロジック (OK / NG / 再検査) は `InspectionJudgmentService` に切り出し、境界値テストで旧画面との同等性を担保しています。
保持した業務ルール・API 仕様・テストの意図は `docs/inspection_migration.md` を参照してください。

```bash
docker compose up -d db
(cd backend && mvn spring-boot:run)          # http://localhost:8080/api/inspections
(cd frontend && npm install && npm start)    # http://localhost:4200
```

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
