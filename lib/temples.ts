import baseTemples from '../data/temples.json';
import {CmsError,database,validId} from './cms';

import {checklistQuestions} from './temple-questions';
const specific:Record<string,string>={hofukuji:'2026年11月は11/8（日）か11/9（月）か。通常の第2日曜と年間予定の記載が一致していません。',sogenji:'一般向け日曜坐禅会の現在の受入状況を確認。修行道場への入門・滞在とは別に確認してください。',zuiunji:'現在の開催日・参加費・予約方法を確認してください。',daitsuji:'拝観料と坐禅体験の参加費・開催時刻を分けて確認してください。',entsuji:'11/8の早期終了、初参加の集合時刻、会員・未成年者の料金条件を確認してください。',shorinji:'通常の第2土曜と異なる11/9・12/1の開催案内、12/7夜の終了時刻を確認してください。',shoukinji:'宗派公式の毎週火曜19–20時の案内が現在も有効か確認。寺院サイトを閲覧できない場合は電話で確認してください。',honkoji:'子ども向け坐禅教室の対象年齢、大人の参加可否、基本500円の適用条件を確認してください。',yotoin:'予約できる日時、坐禅体験の料金、受入人数と連絡しやすい時刻を確認してください。',kannonji:'毎月1日の参拝9時・坐禅9時半の流れ、無料定例会と予約制体験の違いを確認してください。',senkoji:'月例坐禅会の次回開催日・時刻・料金を確認してください。'};
const textFields:Record<string,number>={description:500,schedule:180,fullSchedule:2500,price:100,priceNote:250,booking:2500,bookingLabel:100,bookingUrl:1500,visit:400,access:1500,address:250,phone:40,notice:2500,photoUrl:1500,checkedAt:10,nextDate:10,nextTime:100,nextNote:800};
export type TemplePhoto={id:string;alt:string;credit:string;permissionConfirmed:boolean};
export type TempleDraft=Record<string,any>&{images:TemplePhoto[]};
function date(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
function url(value:string,tel=false){if(!value)return true;if(tel&&/^tel:\+?[\d()-]{5,30}$/.test(value))return true;try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function findTemple(id:string){const t=baseTemples.find(t=>t.id===id);if(!t)throw new CmsError(404,'お寺が見つかりません。');return t;}
function initial(t:any):TempleDraft {const draft:any={images:[],nextDate:'',nextTime:'',nextNote:''};for(const field of Object.keys(textFields))draft[field]=t[field]||'';for(const f of ['morning','night','walkin','chair'])draft[f]=Boolean(t[f]);return draft;}
export function adminTemple(t:any,row?:any){return {id:t.id,name:t.name,city:t.city,official:t.official,sources:t.sources,baseImage:t.image||'',baseAlt:t.alt||'',draft:row?JSON.parse(row.draft):initial(t),checklist:row?JSON.parse(row.checklist):checklistQuestions.map(q=>({id:q.id,state:'pending',answer:'',date:'',method:''})),specific: specific[t.id]||'',privateNotes:row?.private_notes||'',revision:row?.revision||0,published:Boolean(row?.published),updatedAt:row?.updated_at||null};}
export async function adminTemples(){const {results}=await database().prepare('SELECT * FROM temple_updates').all();return baseTemples.map(t=>adminTemple(t,results.find(r=>r.temple_id===t.id)));}
export function templeInput(raw:any){
  if(!['save','publish','unpublish'].includes(raw?.action)||!Number.isInteger(raw.revision)||raw.revision<0)throw new CmsError(400,'保存方法・更新情報が正しくありません。');
  if(!raw.draft||typeof raw.draft!=='object')throw new CmsError(400,'掲載情報を入力してください。');
  const draft:TempleDraft={images:[]};for(const [key,max]of Object.entries(textFields)){const value=String(raw.draft[key]??'').trim();if(value.length>max)throw new CmsError(400,`入力が長すぎます（${key}）。`);draft[key]=value;}
  for(const f of ['morning','night','walkin','chair'])draft[f]=raw.draft[f]===true;
  if(!url(draft.bookingUrl,true)||!url(draft.photoUrl))throw new CmsError(400,'リンクは正しいhttp(s)のURLか電話リンクを入力してください。');
  if(draft.phone&&!/^[+\d()\-\s]{5,40}$/.test(draft.phone))throw new CmsError(400,'電話番号の形式を確認してください。');
  for(const f of ['checkedAt','nextDate'])if(draft[f]&&!date(draft[f]))throw new CmsError(400,'正しい確認日・次回開催日を入力してください。');
  if(!Array.isArray(raw.draft.images)||raw.draft.images.length>12)throw new CmsError(400,'写真は12枚まで追加できます。');
  const ids=new Set();draft.images=raw.draft.images.map((i:any)=>{if(!i||!validId(i.id)||ids.has(i.id))throw new CmsError(400,'写真情報が正しくありません。');ids.add(i.id);return {id:i.id,alt:String(i.alt||'').trim().slice(0,200),credit:String(i.credit||'').trim().slice(0,250),permissionConfirmed:i.permissionConfirmed===true};});
  if(raw.action==='publish'){
    if(!draft.schedule||!draft.price||!draft.booking||!draft.address||!draft.checkedAt)throw new CmsError(400,'公開には日時・料金・予約方法・所在地・情報確認日を入力してください。不明な項目は「要確認」と記載できます。');
    if(draft.images.some(i=>!i.permissionConfirmed||!i.alt))throw new CmsError(400,'公開する写真には説明文を入力し、掲載許可を確認してください。');
    if(draft.nextDate&&!draft.nextTime)throw new CmsError(400,'次回開催日を掲載する場合は開催時刻も入力してください。');
  }
  if(!Array.isArray(raw.checklist)||raw.checklist.length!==checklistQuestions.length)throw new CmsError(400,'確認チェックリストが正しくありません。');
  const checklist=checklistQuestions.map(q=>{const matches=raw.checklist.filter((c:any)=>c?.id===q.id);if(matches.length!==1)throw new CmsError(400,'確認項目が重複・不足しています。');const c=matches[0];if(!['pending','confirmed','recheck','na'].includes(c.state))throw new CmsError(400,'確認状態を選択してください。');const answer=String(c.answer||'').trim(),checkedDate=String(c.date||''),method=String(c.method||'');if(answer.length>2500||!['','電話','現地','メール','公式サイト','その他'].includes(method)||checkedDate&&!date(checkedDate))throw new CmsError(400,'確認結果・確認日・確認方法を確認してください。');if(['confirmed','na'].includes(c.state)&&(!answer||!checkedDate||!method))throw new CmsError(400,'確認済み・対象外の項目には、結果・確認日・確認方法を入力してください。');return{id:q.id,state:c.state,answer,date:checkedDate,method};});
  const privateNotes=String(raw.privateNotes||'').trim();if(privateNotes.length>5000)throw new CmsError(400,'内部メモは5,000文字以内で入力してください。');
  return {draft,checklist,privateNotes};
}
export async function publicTemples(){const {results}=await database().prepare('SELECT temple_id,published,updated_at FROM temple_updates WHERE published IS NOT NULL').all();return baseTemples.map(t=>{const row=results.find(r=>r.temple_id===t.id);if(!row)return t;const draft=JSON.parse(String(row.published));const safe:any={};for(const key of [...Object.keys(textFields),'morning','night','walkin','chair'])if(key in draft)safe[key]=draft[key];return {...t,...safe,cmsUpdated:true,images:(draft.images||[]).map((i:TemplePhoto)=>({id:i.id,url:`/media/${i.id}`,alt:i.alt,credit:i.credit}))};});}
