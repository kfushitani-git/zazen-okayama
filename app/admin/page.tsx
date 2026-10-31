import {requireChatGPTUser} from '../chatgpt-auth';
import {isEditor} from '../../lib/cms';
import {authProvider,getSiteUser} from '../../lib/site-auth';
import CmsEditor from './cms-editor';
import './cms.css';
export const dynamic='force-dynamic';
export default async function AdminPage(){
  const access=authProvider()==='cloudflare-access';
  if(!access)await requireChatGPTUser('/admin');
  const user=await getSiteUser();
  if(!user||!await isEditor())return <main className="cms-denied"><a href="/">座禅-zazen-</a><h1>記録の管理</h1><p>{access?'このアカウントには編集権限がありません。Cloudflare Accessで許可された管理者のメールアドレスでログインしてください。初回はCloudflare Accessの設定を完了してから、保護したドメインの /admin を開いてください。':'このアカウントには編集権限がありません。サイト所有者のChatGPTアカウントでログインしてください。'}</p><a href={access?'/cdn-cgi/access/logout':'/signout-with-chatgpt?return_to=%2Fadmin'} target="_top">ログインし直す</a></main>;
  return <CmsEditor/>;
}
