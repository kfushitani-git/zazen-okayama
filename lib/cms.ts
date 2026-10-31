import { env } from 'cloudflare:workers';
import { authProvider, getSiteUser } from './site-auth';
export class CmsError extends Error {constructor(public status:number,message:string){super(message);}}
export const categories=['活動日記','写真','お知らせ'];
export function database(){if(!env.DB)throw new CmsError(503,'保存先の準備ができていません。');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new CmsError(503,'写真の保存先の準備ができていません。');return env.BUCKET;}
export async function isEditor(){const user=await getSiteUser();const allowed=(env.CMS_ADMIN_EMAIL||'').toLowerCase().split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);return Boolean(user&&allowed.includes(user.email.toLowerCase()));}
export async function requireEditor(request?:Request){
  if(!await getSiteUser())throw new CmsError(401,authProvider()==='cloudflare-access'?'Cloudflare Accessで管理者としてログインしてください。':'ChatGPTにログインしてください。');
  if(!await isEditor())throw new CmsError(403,'このアカウントには記録の編集権限がありません。');
  if(request&&!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new CmsError(403,'このサイトの管理画面から操作してください。');}
}
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function api(fn:()=>Promise<Response>){try{return await fn();}catch(e){if(e instanceof CmsError)return json({error:e.message},e.status);console.error('CMS request failed',e instanceof Error?e.message:'Unknown error');return json({error:'処理を完了できませんでした。少し待ってからお試しください。'},500);}}
export async function readLimitedBytes(request:Request,limit:number){
  if(Number(request.headers.get('content-length'))>limit)throw new CmsError(413,'送信内容が大きすぎます。');
  const reader=request.body?.getReader();if(!reader)return new Uint8Array();
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new CmsError(413,'送信内容が大きすぎます。');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
export async function bodyJson(request:Request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new CmsError(415,'JSON形式で送信してください。');const raw=new TextDecoder().decode(await readLimitedBytes(request,110000));try{return JSON.parse(raw);}catch{throw new CmsError(400,'送信内容を読み取れません。');}}
export function recordInput(input:any){
  const title=String(input?.title||'').trim(),body=String(input?.body||'').trim(),category=String(input?.category||'活動日記'),recordDate=String(input?.recordDate||''),status=String(input?.status||'draft');
  if(!title||title.length>120)throw new CmsError(400,'タイトルを1〜120文字で入力してください。');
  if(body.length>30000)throw new CmsError(400,'本文は30,000文字以内で入力してください。');
  if(status==='published'&&!body)throw new CmsError(400,'公開する記事には本文を入力してください。');
  if(!categories.includes(category))throw new CmsError(400,'カテゴリを選択してください。');
  if(!['draft','published','archived'].includes(status))throw new CmsError(400,'保存状態が正しくありません。');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(recordDate)||!Number.isFinite(Date.parse(recordDate))||new Date(recordDate).toISOString().slice(0,10)!==recordDate)throw new CmsError(400,'記録日を正しい日付で入力してください。');
  if(!Array.isArray(input.images)||input.images.length>12)throw new CmsError(400,'写真は12枚以内で追加してください。');
  const seen=new Set();const images=input.images.map((i:any)=>{if(!i||!validId(i.id)||seen.has(i.id))throw new CmsError(400,'写真情報が正しくありません。');seen.add(i.id);return{id:i.id,alt:String(i.alt||'').trim().slice(0,200)};});return{title,body,category,recordDate,status,images};
}
export function validId(id:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);}
export async function validateMedia(images:{id:string,alt:string}[]){if(!images.length)return;const result=await database().prepare(`SELECT id FROM media WHERE id IN (${images.map(()=>'?').join(',')})`).bind(...images.map(i=>i.id)).all();if(result.results.length!==images.length)throw new CmsError(400,'保存されていない写真があります。追加し直してください。');}
export function serialize(row:any,admin=false){let images:any[]=[];try{images=JSON.parse(row.images);}catch{}const result:any={id:row.id,title:row.title,body:row.body,category:row.category,recordDate:row.record_date,author:row.author,updatedAt:row.updated_at,images:images.map(i=>({id:i.id,alt:i.alt,url:`/media/${i.id}`}))};if(admin)Object.assign(result,{status:row.status,revision:row.revision,createdAt:row.created_at});return result;}
export function detectImage(bytes:Uint8Array){if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return'image/jpeg';if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return'image/png';if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return'image/webp';return null;}
