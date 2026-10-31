(()=>{
 'use strict';
 const byId=id=>document.getElementById(id),rEsc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let records=[],offset=0,hasMore=false,filter='all',busy=false,lastFocus=null;
 function render(){
  const visible=records.filter(p=>filter==='all'||p.category===filter);
  byId('records-grid').innerHTML=visible.length?visible.map(p=>`<article class="record-card"><button class="record-image" data-record="${rEsc(p.id)}" aria-label="${rEsc(p.title)}を読む">${p.images[0]?`<img src="${rEsc(p.images[0].url)}" alt="${rEsc(p.images[0].alt||p.title)}" loading="lazy">`:`<span class="enso" aria-hidden="true"></span><span>${rEsc(p.category)}</span>`}</button><div class="record-card-body"><p><time datetime="${rEsc(p.recordDate)}">${rEsc(p.recordDate.replaceAll('-','.'))}</time><span>${rEsc(p.category)}</span></p><h3><button data-record="${rEsc(p.id)}">${rEsc(p.title)}</button></h3><p class="record-excerpt">${rEsc(p.body.slice(0,100))}${p.body.length>100?'…':''}</p><button class="text-link" data-record="${rEsc(p.id)}">記録を読む →</button></div></article>`).join(''):`<div class="record-empty"><span class="enso" aria-hidden="true"></span><h3>${records.length?'このカテゴリの記録はまだありません。':'ここから、記録が始まります。'}</h3><p>${records.length?'ほかのカテゴリもご覧ください。':'代表・伏谷の活動日記、写真、お知らせをお届けします。'}</p></div>`;
  byId('records-more').hidden=!hasMore;
  document.querySelectorAll('[data-record-filter]').forEach(b=>{const active=b.dataset.recordFilter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 }
 async function load(){if(busy)return;busy=true;byId('records-more').disabled=true;try{const response=await fetch(`/api/records?limit=6&offset=${offset}${filter!=='all'?'&category='+encodeURIComponent(filter):''}`,{credentials:'same-origin'});if(!response.ok)throw new Error();const data=await response.json();records.push(...data.records);offset+=data.records.length;hasMore=data.hasMore;render();}catch{byId('records-grid').innerHTML='<p class="record-empty">記録を読み込めませんでした。<button class="text-link" id="records-retry">もう一度読み込む →</button></p>';}finally{busy=false;byId('records-more').disabled=false;}}
 function displayRecord(p){
  lastFocus=document.activeElement;
  byId('record-content').innerHTML=`<article class="record-detail"><p class="record-detail-meta">${rEsc(p.recordDate.replaceAll('-','.'))} ／ ${rEsc(p.category)} ／ 代表・${rEsc(p.author)}</p><h2 id="record-dialog-title">${rEsc(p.title)}</h2>${p.images[0]?`<figure><img src="${rEsc(p.images[0].url)}" alt="${rEsc(p.images[0].alt||p.title)}">${p.images[0].alt?`<figcaption>${rEsc(p.images[0].alt)}</figcaption>`:''}</figure>`:''}<div class="record-body">${rEsc(p.body)}</div><div class="record-gallery">${p.images.slice(1).map(i=>`<figure><img src="${rEsc(i.url)}" alt="${rEsc(i.alt||'記録の写真')}" loading="lazy">${i.alt?`<figcaption>${rEsc(i.alt)}</figcaption>`:''}</figure>`).join('')}</div><p class="record-author">代表・伏谷の記録</p></article>`;
  byId('record-dialog').showModal();document.body.style.overflow='hidden';byId('record-close').focus();
 }
 async function openRecord(id){const cached=records.find(p=>p.id===id);if(cached)return displayRecord(cached);try{const response=await fetch(`/api/records/${encodeURIComponent(id)}`);if(!response.ok)throw new Error();displayRecord((await response.json()).record);}catch{byId('records-grid').innerHTML='<p class="record-empty">この記録は公開されていないか、見つかりませんでした。</p>';}}
 document.addEventListener('click',e=>{const button=e.target.closest('[data-record]');if(button){openRecord(button.dataset.record);return;}const chip=e.target.closest('[data-record-filter]');if(chip){if(busy)return;filter=chip.dataset.recordFilter;records=[];offset=0;hasMore=false;render();load();return;}if(e.target.closest('#records-retry'))load();});
 byId('records-more').addEventListener('click',load);byId('record-close').addEventListener('click',()=>byId('record-dialog').close());
 byId('record-dialog').addEventListener('close',()=>{document.body.style.overflow='';lastFocus?.focus({preventScroll:true});});
 byId('record-dialog').addEventListener('click',e=>{if(e.target!==byId('record-dialog'))return;const r=byId('record-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)byId('record-dialog').close();});
 load();const requested=new URLSearchParams(location.search).get('record');if(requested)openRecord(requested);
})();
