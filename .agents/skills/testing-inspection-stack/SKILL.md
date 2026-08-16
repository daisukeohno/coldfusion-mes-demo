---
name: testing-inspection-stack
description: 品質検査画面 (現行 ColdFusion / 移行版 Spring Boot API + Angular) をローカルで起動し E2E 検証する手順と落とし穴。
---

# 検査スタックのローカル検証

## 起動 (3サービス)

```bash
docker compose up -d                                    # MySQL + 現行 Lucee -> http://localhost:8888/inspection.cfm
(cd api && MES_DB_HOST=127.0.0.1 mvn -B spring-boot:run)     # -> http://localhost:8080/api/inspections
(cd web-angular && npm install && npm start)            # -> http://localhost:4200 (/api を 8080 へプロキシ)
```

- `db` サービスは `127.0.0.1:3306` を公開する。古い compose でポート未公開の場合はコンテナ IP を使う:
  `MES_DB_HOST=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' coldfusion-mes-demo-db-1)`
- DB 資格情報はローカルデモ用: `mesdb` / `mesuser` / `mespass`。認証は既存・移行版ともになし。

## テスト / ビルド

```bash
(cd api && mvn -B test)          # 境界値テストを含む
cd web-angular && npm run build
```

- Maven Central が HTTP 429 を返すことがある。`~/.m2/settings.xml` で `https://maven-central.storage-download.googleapis.com/maven2` を central の mirror にする。
- `mvn -o` は spring-boot plugin の解決に失敗するのでオンラインで実行する。

## 検証時の落とし穴

- **220.090 で新旧の判定が違う**: 現行 `.cfm` は `(kijun_max - sunpou) LT 0.010` を浮動小数で評価するため `再検査`。移行版は BigDecimal の厳密比較なので `OK`。境界の同等性を確認する際はこの差を前提にする。
- **日付**: DB / アプリは `TZ=Asia/Tokyo`。`curdate()` は JST なので UTC での午後には翻日になる。
- **日本語入力**: xdotool 経由の日本語入力は不安定。不良内容など自由入力は ASCII (例 `SCRATCH`) を使うか、seed データの既存値を選ぶ。
- **レガシー画面のズレ**: 送信後にメッセージ行が入りフォーム位置が下にずれる。送信ごとに座標を再取得し、件数の増加で登録成否を確認する。
- 既存画面と移行版は同一 DB を参照するので、一方で登録した行を他方の履歴で照合できる。
