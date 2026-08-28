# 品質検査 REST API

`app/inspection.cfm` の品質検査登録・履歴・不良集計を Express + TypeScript
へ移行した REST API です。既存の ColdFusion 画面と `t_kensa` はそのまま残し、
同じ MySQL `mesdb` を利用します。

## 起動

```bash
npm install
MES_DB_HOST=127.0.0.1 npm run start:dev
```

Docker Compose のネットワーク内から起動する場合、`MES_DB_HOST=db` を指定します。

| 環境変数 | 既定値 |
|---|---|
| `PORT` | `3000` |
| `MES_DB_HOST` | `db` |
| `MES_DB_PORT` | `3306` |
| `MES_DB_NAME` | `mesdb` |
| `MES_DB_USER` | `mesuser` |
| `MES_DB_PASSWORD` | `mespass` |
| `MES_DB_CONNECTION_LIMIT` | `10` |

## API

- `POST /api/inspections`
- `GET /api/inspections?shiji_no=&hantei=`
- `GET /api/inspections/defect-summary`
- `GET /api/orders`

一覧の絞込を含む SQL はすべてプレースホルダを利用します。

## 保持した判定ルール

判定は `src/services/inspectionJudgment.ts` の純粋関数 `judge` に集約し、
DB・HTTP から独立させています。値は整数ミリ（0.001 mm 単位）へ変換して比較し、
浮動小数点誤差を避けます。

1. 測定値が数値でなければ登録しない。
2. 判定を `OK` で初期化する。
3. 測定値が下限未満または上限超過なら `NG`。
4. まだ `OK` で、上限との差が厳密に 0.010 mm 未満なら `再検査`。

したがって、下限ちょうどは `OK`、上限ちょうどは `再検査`、上限との差が
ちょうど 0.010 mm なら `OK` です。再検査ルールは上限側だけに適用します。
これは `app/inspection.cfm` 9–21 行の判定順序と境界を維持したものです。

## 検証

```bash
npm test
npm run lint
npm run build
```

Jest では指定された境界値と、登録時に保存される判定、非数値エラー、
履歴一覧の絞込を検証します。API 結合テストの DB 層はモックです。
