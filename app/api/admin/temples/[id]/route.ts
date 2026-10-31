import {api,requireEditor,database,json,bodyJson,validateMedia,CmsError} from '../../../../../lib/cms';
import {findTemple,templeInput,adminTemple} from '../../../../../lib/temples';
export const dynamic='force-dynamic';
export function PUT(request:Request,{params}:{params:Promise<{id:string}>}){return api(async()=>{
  await requireEditor(request);const{id}=await params,t=findTemple(id),raw=await bodyJson(request),input=templeInput(raw);await validateMedia(input.draft.images);
  const now=new Date().toISOString(),draft=JSON.stringify(input.draft),checklist=JSON.stringify(input.checklist),published=raw.action==='publish'?draft:null;let result;
  if(raw.revision===0){result=await database().prepare('INSERT INTO temple_updates (temple_id,draft,published,checklist,private_notes,revision,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?) ON CONFLICT(temple_id) DO NOTHING').bind(id,draft,published,checklist,input.privateNotes,now,now).run();}
  else {result=await database().prepare("UPDATE temple_updates SET draft=?,published=CASE WHEN ?='save' THEN published ELSE ? END,checklist=?,private_notes=?,revision=revision+1,updated_at=? WHERE temple_id=? AND revision=?").bind(draft,raw.action,published,checklist,input.privateNotes,now,id,raw.revision).run();}
  if(!result.meta.changes)throw new CmsError(409,'別の画面で更新されています。入力内容を控えて、一覧を読み込み直してください。');
  const row=await database().prepare('SELECT * FROM temple_updates WHERE temple_id=?').bind(id).first();return json({temple:adminTemple(t,row)});
});}
