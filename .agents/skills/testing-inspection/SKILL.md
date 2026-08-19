---
name: testing-inspection
description: How to run and E2E-test the SEIZO-MES quality inspection screen (legacy CFML app/inspection.cfm and the Angular frontend/ + NestJS api/ migration), including boundary-value cases, judgment rules, and known legacy/new behavior differences.
---

# 品質検査画面 (inspection) の E2E テスト

## 起動手順 (このリポジトリの Angular/NestJS 移行版)

```bash
cd <repo>
docker compose up -d db web           # MySQL 8 + Lucee(CFML 旧画面 http://localhost:8888/inspection.cfm)
cd api && MES_DB_HOST=127.0.0.1 npm run start:dev    # NestJS http://localhost:3000
cd frontend && npm start                             # Angular http://localhost:4200 (/api を 3000 にプロキシ)
```

注意点:
- DB 初期化に 1 分程度かかる。`docker exec <db container> mysql -umesuser -pmespass mesdb -e "select count(*) from t_kensa;"` で準備完了を確認する。
- `MES_DB_HOST=127.0.0.1` が使えるのは compose の `db` に `ports: ["3306:3306"]` がある場合のみ。無い場合は
  `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <db container>` の IP を `MES_DB_HOST` に渡す。
- `npm run start:dev` は watch モードなので `pkill` しても再起動する。API 停止をテストしたい場合は
  `curl -s -m 3 -o /dev/null -w "%{http_code}" localhost:3000/api/inspections` が `000` になるまで子プロセスも kill する。
- DB データは volume に永続化される。件数期待値は「絶対値」ではなく「テスト開始時の件数からの増減」で判定するとよい。

## 判定ルール (規格下限/上限は画面入力値、マスタ化されていない)

- 範囲外 (`< 下限` または `> 上限`) → `NG`
- 範囲内で `上限 - 測定値 < 0.010` → `再検査` (2011年 暫定運用)
- それ以外 → `OK`

代表的な境界値テストケース (規格 219.900 / 220.100):

| 測定値 | 新実装 (Angular+NestJS) | 旧 CFML |
|---|---|---|
| 219.899 | NG | NG |
| 219.900 | OK | OK |
| 220.090 | OK | **再検査** (差異あり) |
| 220.091 | 再検査 | 再検査 |
| 220.100 | 再検査 | 再検査 |
| 220.101 | NG | NG |
| 220.1004 | 再検査 (DECIMAL(8,3) へ丸め) | NG (生比較) |
| abc | 「測定値は数値で入力してください。」 | 同文言 |

### 既知の新旧差異 (等価性テスト時は必ず確認)

1. `220.090` (上限との差がちょうど 0.010): CFML は `(220.100 - 220.090) LT 0.010` を倍精度で評価し
   `0.009999999999990905 < 0.010` となるため **再検査**。新実装は整数ミリ単位で比較するため **OK**。
   仕様文言 (「0.010mm 未満」) 的には新実装が正しいが、旧画面の実運用結果とは変わるので回帰として報告する。
   同種の誤差は他の値でも起こり得る (例: `上限 - 測定値` がちょうどしきい値になる任意の組合せ)。
2. 小数 4 桁以上 (`220.1004` など): 新実装は DECIMAL(8,3) 相当へ丸めてから判定、CFML は生値比較。

## UI テストのコツ

- Angular 版はメッセージ行 (`<b>`) の有無でフォームの y 座標が 10〜15px ずれる。クリック前に必ず
  スクリーンショット/DOM で入力欄と「判定・登録」ボタンの位置を再確認する (誤クリックで履歴の
  指示番号リンクを踏み、shiji_no 絞込が掛かってしまう事故が起きやすい)。
- xdotool 経由の日本語入力は欠落することがある。不良内容などのテキストは ASCII (`E2E-TEST-DEFECT` 等) を使う。
- 行色: `NG` = 赤 (`class="late"`)、`再検査` = 黄 (`class="warn"`)。
- 入力検証 (400) の文言:
  - 測定値非数値 → `測定値は数値で入力してください。`
  - 規格下限/上限非数値 → `規格下限・規格上限は数値で入力してください。`
  - 列長超過 → `lot_no は 30 文字以内で入力してください。` (`shiji_no` 20 / `lot_no` 30 / `kensa_sha` 60 / `furyo_naiyo` 255)
- API 停止時は赤字エラーが出て履歴 0 件・不良集計空・製造指示ドロップダウン空になるのが期待動作。

## Devin Secrets Needed

なし (ローカル DB は mesuser/mespass/mesdb、root は rootpass)。
