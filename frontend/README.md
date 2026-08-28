# 品質検査 Angular フロントエンド

`app/inspection.cfm` の品質検査画面を Angular の standalone component
として移行した画面です。既存 CFML は削除せず、REST API を介して同じ
MySQL `mesdb` の検査データを表示・登録します。

## 起動

先に MySQL と API を起動します。

```bash
# リポジトリルート
docker compose up -d db

# api/
MES_DB_HOST=127.0.0.1 npm run start:dev

# frontend/
npm install
npm start
```

`http://localhost:4200` を開きます。開発サーバーは `/api` を
`http://localhost:3000` へプロキシします。

## 画面と旧資産の対応

| Angular | `app/inspection.cfm` |
|---|---|
| 製造指示プルダウン付き登録フォーム | 70–106 行 |
| 判定結果メッセージ | 66–68 行 |
| すべて / NG / 再検査の履歴絞込 | 108–136 行 |
| 不良内容集計 | 137–148 行 |
| `InspectionService` の API 呼び出し | 旧画面内の SQL |

判定は Angular に実装していません。フォーム値を API へ送り、サーバーが返す
`hantei` だけを表示するため、業務ルールの正は API の純粋関数に一元化されます。

画面には旧画面と同じ「規格上限との差が 0.010mm 未満の場合は再検査
(2011年 暫定運用)」を表示しています。判定順序と境界値の詳細は
`api/README.md` を参照してください。

## 検証

```bash
npm run lint
npm test
npm run build
```

Karma + Jasmine の service spec で REST API の URL・body・絞込パラメータを、
component spec で初期データ表示、登録結果メッセージ、履歴絞込を検証します。
