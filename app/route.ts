import homeHtml from '../content/home.html?raw';
import {publicTemples} from '../lib/temples';
export const dynamic = 'force-dynamic';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function GET(request:Request) {
  const origin=new URL(request.url).origin,temples:any[]=await publicTemples();
  const data=JSON.stringify(temples).replaceAll('<','\\u003c');
  const html=homeHtml.replaceAll('https://zazen-okayama.k-fushitani.workers.dev',origin)
    .replace('<!-- TEMPLE_DATA -->',`<script id="temples-data" type="application/json">${data}</script>`)
    .replace(/<img data-hero-temple="([a-z]+)" src="[^"]*" alt="[^"]*"/g,(original,id)=>{
      const image=temples.find(t=>t.id===id)?.images?.[0];
      return image?`<img data-hero-temple="${id}" src="${escape(image.url)}" alt="${escape(image.alt)}"`:original;
    });
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
