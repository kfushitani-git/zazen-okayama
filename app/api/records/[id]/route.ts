import {api,database,json,serialize,validId,CmsError} from '../../../../lib/cms';
export const dynamic='force-dynamic';
export function GET(request:Request,{params}:{params:Promise<{id:string}>}){return api(async()=>{const{id}=await params;if(!validId(id))throw new CmsError(404,'記録が見つかりません。');const row=await database().prepare("SELECT * FROM records WHERE id=? AND status='published'").bind(id).first();if(!row)throw new CmsError(404,'この記録は公開されていません。');return json({record:serialize(row)});});}
