# Cloudflareへ直接デプロイする手順

このサイトはCloudflare WorkersでアプリとCMSを動かし、D1に活動記録・寺院情報・確認チェックリスト、R2に写真を保存します。Cloudflare Pagesの静的アップロードだけではCMSは動作しません。Node.js 22.13以上とnpmを使用します。

公開先は `https://zazen-okayama.<アカウントのサブドメイン>.workers.dev` を想定しています。独自ドメインの購入は不要で、設定は `workers_dev: true` です。実際のURLはデプロイ時にCloudflareが返します。

## 1. 依存関係とCloudflareの準備

ソースを展開し、プロジェクトのフォルダで実行します。

```sh
npm ci
npx wrangler login
npx wrangler d1 create zazen-records
npx wrangler r2 bucket create zazen-photos
npm run cf:init
```

R2を初めて使用するアカウントは、Cloudflare側で利用開始の設定が必要になる場合があります。既存のD1/R2を使用する場合は、作成コマンドを省略し、実際のリソース名とIDを指定します。APIトークンをソースや設定ファイルに書かないでください。

`wrangler.json` に次を入力します。このリポジトリの設定は公開中の環境を指定しています。別のアカウントへデプロイする場合は、そのアカウントのID・D1・R2・Accessの値に変更してください。認証情報は書き込みません。

| 項目 | 入力する値 |
| --- | --- |
| `account_id` | CloudflareのアカウントID |
| `name` | Worker名。初期値は `zazen-okayama` |
| `d1_databases[0].database_id` | 作成したD1のUUID |
| `d1_databases[0].database_name` | 作成したD1の名前 |
| `r2_buckets[0].bucket_name` | 作成したR2の名前 |
| `vars.CF_ACCESS_TEAM_DOMAIN` | `https://実際のチーム名.cloudflareaccess.com` |
| `vars.CF_ACCESS_AUD` | 次項のAccessアプリケーションのAUD |

`AUTH_PROVIDER` は `cloudflare-access` を使用します。`DB` と `BUCKET` のバインディング名は変更しません。

## 2. CMSのログインをCloudflare Accessで設定

Cloudflareへ直接デプロイする版は、CMSへのログインにCloudflare Accessを使います。Sites固有のChatGPTログインには依存しません。

Cloudflare Zero TrustのAccessで、ホスト名・パスを指定するSelf-hostedアプリケーションを1つ作成します。Worker全体を保護すると公開ガイドもログイン必須になるため、CMSのパスだけを指定します。同じアプリケーションに、使用するホスト名の次のパスを登録します。

- `/admin` と `/admin/*`
- `/api/admin/*`

許可ポリシーを、管理者のメールアドレスに限定してください。メールのワンタイムPINや、設定済みのログインプロバイダーを使えます。同じアプリケーションに登録して、各パスで同じApplication Audience（AUD）を使います。AUDとチームドメインを `wrangler.json` に反映します。

公開済み写真の `/media/*` と閲覧用の `/api/records*`、`/api/temples`、トップページは一般向けなので、CMS用の保護パスには含めません。下書き写真は、サーバーがAccessの署名付きCookieを検証した編集者にだけ返します。メールヘッダーの値だけでは編集を許可しません。

独自ドメインを使う場合は、Workersのカスタムドメインを設定し、そのホスト名でAccessのパスを保護します。`workers.dev` を使う場合も、該当ホスト名でAccessが有効になるよう設定してください。公開するすべてのホスト名を確認し、独自ドメインだけを運用する場合は `workers_dev: false` にできます。Accessを経由しないリクエストでも、署名・発行元・AUD・期限を検証できなければCMSは拒否します。

## 3. ビルドと公開

実際のアカウントへ接続せず、ビルドとWranglerの検証だけを行う場合：

```sh
npm run cf:check
```

これはサンプル設定によるdry-runです。Cloudflareへのアップロードは行いません。実際の `wrangler.json` でビルドだけ行う場合は `npm run cf:build` を使います。

設定したアカウントに公開する場合：

```sh
npm run cf:deploy
npx wrangler secret put CMS_ADMIN_EMAIL --config wrangler.json
```

`cf:deploy` はビルド、D1への未適用マイグレーションの適用、Workerと静的ファイルのデプロイを順番に実行します。プレースホルダーのままでは公開を開始しません。秘密設定を尋ねられたら、Accessで許可した管理者メールアドレスを入力します。メールをコマンド引数やGit管理ファイルに書く必要はありません。

初回は `CMS_ADMIN_EMAIL` を設定するまで編集できません。設定後、保護したドメインの `/admin` を開き、Accessでログインします。公開ガイドの表示と、下書き・写真追加・公開・非公開の操作を確認してください。2回目以降は、変更したソースで `npm run cf:deploy` を実行します。

`wrangler.json` はアカウントの設定なので、ビルド成果物である `dist/server/wrangler.json` を直接編集しません。OG画像と共有URLは、アクセスしたホスト名に合わせて出力されます。

## 記録データについて

新しく作ったD1/R2は空の環境です。現在のSites版から投稿・アップロード写真を自動移行する処理はありません。移行する場合は、先にCMSの記事データと寺院確認記録をバックアップし、写真ファイルも保管してから別途移行します。記事・寺院確認記録のJSONバックアップには写真本体は含まれません。管理画面は `/admin`（伏谷の記録）と `/admin/temples`（お寺の確認・掲載）です。既存D1/R2を再利用する場合は、対象を確認してから設定してください。

## この配布ソースで確認していること

- Cloudflare向けのビルドとWrangler dry-run。
- Access JWTの署名、発行元、AUD、期限、Cookieによる下書き写真アクセス、偽装ヘッダーの拒否。
- 既存CMSの入力検証、下書き非公開、写真の保存と非公開、公開、編集競合などのローカル検証。

この配布物にはCloudflareアカウントの資格情報、管理者メールの秘密設定、投稿データ、実際のAccess設定は含めていません。所有アカウント上での公開とログインの最終確認は、上記の設定後に行います。

## 公式ドキュメント

- [WorkersとCloudflare Access（ホスト名・パスごとの保護）](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [WorkersのWrangler設定](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare Access JWTの検証](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [D1マイグレーション](https://developers.cloudflare.com/d1/reference/migrations/)
- [R2のWorkers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
