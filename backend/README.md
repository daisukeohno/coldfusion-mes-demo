# 品質検査 REST API (mes-inspection-api)

現行の ColdFusion 画面 `app/inspection.cfm` を Spring Boot (Java 17) へ移行したバックエンド。
現行画面は突合検証のため削除せず並行稼働させる。

## 判定ルール (業務ルールの正本)

判定は `jp.co.seizo.mes.inspection.InspectionJudgmentService#judge` のみが実装する
(DB / Web 層に依存しない純粋関数。フロントエンドは判定を持たない)。
評価順序は現行 CFML と同一で、この順に評価する。

1. 判定 `hantei` の初期値は `OK`。
2. `sunpou < kijun_min` または `sunpou > kijun_max` のとき `NG`。
3. ここまで `OK` のままで、かつ `(kijun_max - sunpou) < 0.010` のとき `再検査`。

### 閾値 0.010 と「再検査」の由来

ルール3は 2011年3月の暫定運用に由来する (`app/Application.cfc` のコメント「2011/03 佐藤: 検査ロット対応 (暫定)」)。
規格上限ぎりぎりの製品を現場判断で再検査に回していた運用をそのまま画面ロジックに埋め込んだもので、
**仕様書には記載がない**。移行時も挙動を変えないため、次の点を厳密に保持している。

- 比較は **厳密不等号 `<`**。差がちょうど 0.010 の場合は `再検査` にならず `OK`。
  (例: min=219.900 / max=220.100 のとき sunpou=220.090 は OK、220.091 は 再検査)
- ルール2で `NG` が確定した場合、ルール3は適用しない (上限超過は差が負になるが `NG` のまま)。
- 上限ちょうど (220.100) は差 0.000 のため `再検査`。
- 比較前に `sunpou` / `kijun_min` / `kijun_max` を t_kensa の `DECIMAL(8,3)` に合わせて
  scale=3 / HALF_UP で丸める。DB に格納される値と判定に使う値を一致させるため
  (例: 220.0905 → 220.091 → 再検査、220.0904 → 220.090 → OK)。

境界値は `src/test/java/jp/co/seizo/mes/inspection/InspectionJudgmentServiceTest.java` で固定している。

## 入力バリデーション

測定値 `sunpou` が数値でない (空を含む) 場合は登録せず、現行と同じメッセージ
`測定値は数値で入力してください。` を HTTP 400 で返す。

## エンドポイント

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/api/inspections?shiji_no=&hantei=` | 検査履歴一覧 (`kensa_ymd desc, kensa_id desc`)。両パラメータは任意絞込 |
| GET | `/api/inspections/defect-summary` | 不良内容集計 (`hantei <> 'OK'` かつ `furyo_naiyo <> ''`、件数降順) |
| GET | `/api/orders/for-inspection` | 製造指示ドロップダウン用一覧 (`shiji_no desc`) |
| POST | `/api/inspections` | 検査登録。判定はサーバ側で決定し、`hantei` と「検査結果を登録しました。判定は {hantei} です。」相当のメッセージを返す |

`kensa_ymd` はサーバ現在日付 (`curdate()`)。SQL は全てパラメータバインドしており、
現行 CFML の文字列連結 (SQL インジェクションの余地があった) は踏襲していない。

## 起動

```bash
# DB (既存 docker-compose の db)
docker compose up -d db

MES_DB_HOST=127.0.0.1 mvn spring-boot:run   # http://localhost:8080/api/inspections
mvn test                                    # 境界値テスト + MockMvc テスト
```

接続情報は環境変数で上書きできる (既定値は `app/Application.cfc` と同じ):
`MES_DB_HOST` (既定 `db`)、`MES_DB_PORT` (3306)、`MES_DB_NAME` (mesdb)、
`MES_DB_USER` (mesuser)、`MES_DB_PASSWORD` (mespass)、`SERVER_PORT` (8080)。
