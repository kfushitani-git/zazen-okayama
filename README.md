# 座禅-zazen-

岡山県内で坐禅を体験できるお寺を、写真・開催日時・料金・予約方法・地図から探せるサイトです。代表・伏谷の活動記録と、お寺への確認記録を管理するCMSを備えています。

- [公開サイト](https://zazen-okayama.k-fushitani.workers.dev/)
- [お寺の確認・掲載CMS](https://zazen-okayama.k-fushitani.workers.dev/admin/temples)
- [伏谷の活動日記・写真・お知らせCMS](https://zazen-okayama.k-fushitani.workers.dev/admin)

## 構成

Cloudflare WorkersでサイトとAPI、D1で記事・寺院情報・確認チェックリスト、R2で追加写真を管理します。CMSはCloudflare Accessで保護し、サーバーでJWTの署名・発行元・AUD・期限・管理者メールを確認します。

GitHubにはソースコードと公開用の初期データを置きます。投稿データ、未公開の確認結果、内部メモ、アップロード写真の実体、認証情報は含みません。

## CMSで更新する

`/admin/temples` で開催日時、料金、予約方法、初参加、椅子、アクセス、写真の掲載許可、今後の連絡先を記録できます。確認結果・日付・方法・内部メモは管理者だけに表示されます。「確認結果・下書きを保存」で非公開のまま保存し、「掲載情報を公開」で読者向けの情報と写真を反映します。写真の公開には説明文と掲載許可の確認が必要です。不明な日時・料金は「要確認」と記載します。

`/admin` では、活動日記・写真・お知らせを作成し、下書き保存・公開・非公開への変更ができます。

## 開発と検証

Node.js 22.13以上とnpmを使用します。

```sh
npm ci
node node_modules/typescript/bin/tsc --noEmit
npm run test:access
npm run cf:check
```

`cf:check` はサンプル設定でビルドとWrangler dry-runを行います。本番へのアップロードやデータ変更は行いません。GitHub Actionsでも同じ検証を実行します。

ローカルのCMS統合検証には、ローカルD1へ `drizzle/` のマイグレーションを順番に適用し、開発用 `.dev.vars` に `CMS_ADMIN_EMAIL=seedy@sites.test` を設定して `npm run dev` を起動します。`node tests/cms.integration.mjs` と `node tests/temples.integration.mjs` はlocalhost専用です。本番URLでは実行しません。

## Cloudflareへ反映する

`wrangler.json` は公開中のWorker・D1・R2・Accessアプリを指定しています。アカウントID・リソースID・AUDは認証用の秘密情報ではありません。APIトークンと `CMS_ADMIN_EMAIL` の値はCloudflareの秘密設定で管理します。

```sh
npx wrangler login
npm run cf:deploy
```

`cf:deploy` はビルド、未適用のD1マイグレーション、Workerと静的ファイルの公開を順番に実行します。適用済みSQL・Drizzleメタデータは変更せず、新しいスキーマ変更にはマイグレーションを追加してください。

Cloudflare Workers Buildsで既存の `zazen-okayama` に接続する場合は、ブランチ `main`、ルート `/`、デプロイコマンド `npm run cf:deploy` を使用します。ビルドはこのコマンドに含まれます。D1のマイグレーションを実行できる権限も必要です。接続後はmainへの更新で公開できます。

[詳しい初期設定](docs/CLOUDFLARE.md) ／ [GitHub連携の公式ガイド](https://developers.cloudflare.com/workers/ci-cd/builds/)

## 寺院情報と写真

初期の寺院情報は `data/temples.json`、日付指定の開催案内は `public/app.js` にあります。基礎情報は2026年10月31日に確認したものです。公式発表を確認して更新し、未確認の内容は断定しません。

既存写真の撮影者・出典・利用条件は [public/assets/credits.json](public/assets/credits.json) に記載しています。再利用時は、それぞれのライセンスと表示条件に従ってください。
