import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { accessIssuer } from '../lib/cloudflare-access.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mode=process.argv[2]||'check';
const configPath=path.join(root,'wrangler.json');
const wrangler=path.join(root,'node_modules/wrangler/bin/wrangler.js');
function run(args,env={}) {
  const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,...env}});
  if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);
}
function validate(config,sample=false){
  if(!/^[a-z][a-z0-9-]*$/.test(config.name||''))throw new Error('Worker名を設定してください。');
  if(!sample&&!/^[a-f0-9]{32}$/i.test(config.account_id||''))throw new Error('wrangler.json の account_id をCloudflareアカウントIDに変更してください。');
  const db=config.d1_databases?.find(d=>d.binding==='DB'),bucket=config.r2_buckets?.find(b=>b.binding==='BUCKET');
  if(!db||!bucket)throw new Error('DBとBUCKETのバインディングが必要です。');
  if(!sample&&(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(db.database_id||'')||db.database_id==='00000000-0000-4000-8000-000000000000'))throw new Error('D1の実際のdatabase_idを設定してください。');
  if(!db.database_name||!bucket.bucket_name)throw new Error('D1とR2のリソース名を設定してください。');
  if(config.vars?.AUTH_PROVIDER!=='cloudflare-access')throw new Error('Cloudflare版のAUTH_PROVIDERはcloudflare-accessにしてください。');
  accessIssuer(config.vars.CF_ACCESS_TEAM_DOMAIN);
  if(!/^[a-f0-9]{64}$/i.test(config.vars.CF_ACCESS_AUD||''))throw new Error('Cloudflare AccessのApplication Audience (AUD)を設定してください。');
  if('CMS_ADMIN_EMAIL' in(config.vars||{}))throw new Error('CMS_ADMIN_EMAILはファイルへ書かず、wrangler secret putで設定してください。');
}
try {
  if(mode==='init'){
    if(fs.existsSync(configPath)){console.log('既存のwrangler.jsonを保持しました。');process.exit(0);}
    fs.copyFileSync(path.join(root,'wrangler.example.json'),configPath,fs.constants.COPYFILE_EXCL);
    console.log('wrangler.jsonを作成しました。docs/CLOUDFLARE.mdに沿ってアカウントID・D1 ID・Accessの設定を入力してください。');process.exit(0);
  }
  if(!['check','build','deploy'].includes(mode))throw new Error('Use init, check, build, or deploy.');
  let selected=configPath,config;
  if(mode==='check'){
    const folder=path.join(root,'.sites-runtime/cloudflare-check');fs.mkdirSync(folder,{recursive:true});
    config=JSON.parse(fs.readFileSync(path.join(root,'wrangler.example.json'),'utf8'));
    delete config.account_id;config.name='zazen-cloudflare-check';config.main=path.join(root,'worker/index.ts');
    config.d1_databases[0].database_id='00000000-0000-4000-8000-000000000000';config.d1_databases[0].migrations_dir=path.join(root,'drizzle');
    config.vars.CF_ACCESS_TEAM_DOMAIN='https://zazen-example.cloudflareaccess.com';config.vars.CF_ACCESS_AUD='b'.repeat(64);
    selected=path.join(folder,'wrangler.json');fs.writeFileSync(selected,JSON.stringify(config,null,2));
  }else{
    if(!fs.existsSync(configPath))throw new Error('先に npm run cf:init を実行し、wrangler.jsonを設定してください。');
    config=JSON.parse(fs.readFileSync(configPath,'utf8'));
  }
  validate(config,mode==='check');
  run([path.join(root,'scripts/run-framework.mjs'),'build'],{ZAZEN_DEPLOY_TARGET:'cloudflare',ZAZEN_CLOUDFLARE_CONFIG:selected});
  const built=path.join(root,'dist/server/wrangler.json');
  const output=JSON.parse(fs.readFileSync(built,'utf8'));
  if(output.vars?.AUTH_PROVIDER!=='cloudflare-access'||output.d1_databases?.[0]?.database_id!==config.d1_databases[0].database_id||output.r2_buckets?.[0]?.bucket_name!==config.r2_buckets[0].bucket_name)throw new Error('ビルド後のCloudflareバインディングが元の設定と一致しません。デプロイを中止しました。');
  if(mode==='check'){
    run([wrangler,'deploy','--config',built,'--dry-run','--outdir',path.join(root,'.sites-runtime/cloudflare-dry-run')]);
    console.log('Cloudflare向けビルドとWrangler dry-runが完了しました。アップロードは行っていません。');
  }else if(mode==='deploy'){
    run([wrangler,'d1','migrations','apply','DB','--remote','--config',selected]);
    run([wrangler,'deploy','--config',built]);
  }else console.log('Cloudflare向けビルドが完了しました。npm run cf:deployで公開できます。');
}catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=1;}
