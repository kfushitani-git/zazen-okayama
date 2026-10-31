'use strict';
const CHECKED = '2026-10-31';
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external = (url, label, cls = '') => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="${cls}">${label}</a>`;
const temples = JSON.parse(document.getElementById("temples-data").textContent);
const events = [
  {
    "date": "2026-11-01",
    "end": "2026-11-01T08:30:00+09:00",
    "day": "日",
    "label": "通常通り開催の案内",
    "templeId": "entsuji",
    "title": "円通寺 日曜坐禅会",
    "place": "倉敷市・円通寺",
    "time": "6:00〜8:30",
    "description": "主催者の最新のお知らせでは通常通り開催。初参加は5:40集合。前日20時までの申込み推奨です。",
    "url": "https://www.entsujizazenkai.org/",
    "link": "主催者の案内・参加申込み"
  },
  {
    "date": "2026-11-08",
    "end": "2026-11-08T06:30:00+09:00",
    "day": "日",
    "label": "終了時刻に変更",
    "templeId": "entsuji",
    "title": "円通寺 日曜坐禅会",
    "place": "倉敷市・円通寺",
    "time": "6:00–6:30",
    "description": "この日は6時半まで、と主催者が案内しています。通常の終了時刻と異なります。初参加は5:40集合。",
    "url": "https://www.entsujizazenkai.org/",
    "link": "主催者の最新案内・申込み"
  },
  {
    "date": "2026-11-09",
    "end": "2026-11-09T12:00:00+09:00",
    "day": "月",
    "label": "通常日程から変更",
    "templeId": "shorinji",
    "title": "少林寺 覚禅会",
    "place": "津山市・少林寺",
    "time": "9:00〜",
    "description": "9時から坐禅、10時から写経。参加無料。11月は第2土曜日ではなく、9日（月）の開催です。",
    "url": "https://www.shorinzenji.com/行事予定/",
    "link": "公式の開催案内を確認"
  },
  {
    "date": "2026-12-01",
    "end": "2026-12-01T12:00:00+09:00",
    "day": "火",
    "label": "通常日程から変更",
    "templeId": "shorinji",
    "title": "少林寺 覚禅会",
    "place": "津山市・少林寺",
    "time": "9:00〜",
    "description": "12月の覚禅会は1日（火）。9時から坐禅、10時から写経。第2土曜日の開催はありません。",
    "url": "https://www.shorinzenji.com/行事予定/",
    "link": "公式の開催案内を確認"
  },
  {
    "date": "2026-12-07",
    "end": "2026-12-07T23:59:59+09:00",
    "day": "月",
    "label": "夜の坐禅",
    "templeId": "shorinji",
    "title": "少林寺 夜の坐禅会",
    "place": "津山市・少林寺",
    "time": "19:00〜",
    "description": "釈尊のお覚りの前夜に行う坐禅会。終了時刻・参加条件は、お寺にご確認ください。",
    "url": "https://www.shorinzenji.com/行事予定/",
    "link": "公式の開催案内を確認"
  }
];
let saved = new Set();
try { const s = JSON.parse(localStorage.getItem('okayama-zen-saved') || '[]'); if (Array.isArray(s)) saved = new Set(s.filter(id => temples.some(t => t.id === id))); } catch {}
let selectedFilter = 'all';
let map = null;
let markers = [];
let selectedMapId = null;
let lastFocused = null;
let toastTimer;
const $ = (q) => document.querySelector(q);
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800); }
function filteredTemples() {
  const query = $('#search').value.trim().toLocaleLowerCase('ja');
  return temples.filter(t => ($('#area').value==='all' || t.area===$('#area').value) && (!query || `${t.name} ${t.reading} ${t.english} ${t.city} ${t.address} ${t.sect}`.toLocaleLowerCase('ja').includes(query)) && (selectedFilter==='all' || selectedFilter==='saved' ? selectedFilter!=='saved'||saved.has(t.id) : t[selectedFilter]));
}
function photoPanel(t, dialog = false) {
  if (t.images?.length || t.image) return `<img src="${esc(t.images?.[0]?.url || t.image)}" alt="${esc(t.images?.[0]?.alt || t.alt)}" ${dialog?'':'loading="lazy"'} width="800" height="550">`;
  return `<span class="no-photo"><span class="enso" aria-hidden="true"></span><small>${t.photoUrl?'写真は公式・観光案内へ ↗':'寺院写真は未掲載です'}</small></span>`;
}
function render() {
  const list = filteredTemples();
  $('#saved-count').textContent=saved.size;
  $('#result-count').textContent=`${list.length}件のお寺`;
  document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===selectedFilter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('#temple-grid').innerHTML=list.map(t=>`<article class="temple-card"><div class="card-image"><button class="image-open" data-open="${t.id}" aria-label="${t.name}の詳細を見る">${photoPanel(t)}</button><span class="card-area">${t.region}・${t.city}</span><button class="heart-button" data-save="${t.id}" aria-pressed="${saved.has(t.id)}" aria-label="${t.name}を${saved.has(t.id)?'保存から外す':'保存する'}">${icon('heart')}</button></div><div class="card-body"><p class="card-kicker">${t.sect}</p><h3><button class="title-button" data-open="${t.id}">${t.name}</button></h3><p class="card-description">${esc(t.description)}</p><div class="card-tags">${(t.cmsUpdated?[t.walkin?"予約不要":"参加方法を確認",...(t.chair?["椅子に対応"]:[])]:t.tags).map((tag,i)=>`<span class="tag ${i===1?'warm':''}">${esc(tag)}</span>`).join('')}</div><div class="card-facts"><p>${icon('clock')}<span>${esc(t.schedule)}${t.id==='hofukuji'&&!t.cmsUpdated?'<br>8月はお休み・初参加は7:15受付':''}</span></p><p>${icon('pin')}<span>${esc(t.address.replace('岡山県',''))}</span></p></div><div class="card-bottom"><p class="card-price">${esc(t.price)}<small>${esc(t.id==='hofukuji'&&!t.cmsUpdated?'予約制体験は1,000円':t.priceNote)}</small></p><button data-open="${t.id}">詳細・参加方法 ${icon('arrow')}</button></div></div></article>`).join('');
  $('#empty-state').hidden=list.length>0;
  $('#map-list').innerHTML=list.map(t=>`<button class="map-item ${selectedMapId===t.id?'active':''}" data-map="${t.id}" aria-label="地図で${t.name}を表示"><span class="number">${temples.indexOf(t)+1}</span><span><b>${t.name}</b><small>${t.region}・${t.city}</small></span>${icon('arrow')}</button>`).join('') || '<p class="subnote">条件に合うお寺がありません。</p>';
  updateMap(list);
}
function toggleSave(id) {
  if(!temples.some(t=>t.id===id))return;
  saved.has(id)?saved.delete(id):saved.add(id);
  let persistent=true;try {localStorage.setItem('okayama-zen-saved',JSON.stringify([...saved]));}catch{persistent=false;}
  render();
  const dialogSave=$('#dialog-content [data-save]');
  if(dialogSave?.dataset.save===id){dialogSave.setAttribute('aria-pressed',String(saved.has(id)));dialogSave.innerHTML=`${icon('heart')} ${saved.has(id)?'保存から外す':'このお寺を保存'}`;}
  toast(persistent ? saved.has(id)?'お寺を保存しました':'保存したお寺から外しました' : 'この画面の間のみ保存します（ブラウザ保存は利用できません）');
}
function openTemple(id) {
  const t=temples.find(t=>t.id===id);if(!t)return;
  lastFocused=document.activeElement;
  const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.name+' '+t.address)}`;
  const rows=[['所在地',esc(t.address)],['坐禅の時間',esc(t.fullSchedule)],['参加費',esc(t.cmsUpdated?t.price+(t.priceNote?' ／ '+t.priceNote:''):t.id==='hofukuji'?'定例500円／予約制体験1,000円':t.price+(t.id==='entsuji'?'（非会員・未成年者を除く）':''))],['参加・予約',esc(t.booking)],['拝観時間',esc(t.visit)],['アクセス',esc(t.access)],['電話',`<a href="tel:${esc(t.phone.replace(/[^+\d]/g,''))}">${esc(t.phone)}</a>`]];
  $('#dialog-content').innerHTML=`<div class="dialog-hero">${photoPanel(t,true)}</div>${t.images?.length?`<div class="temple-gallery">${t.images.map(i=>`<figure><img src="${esc(i.url)}" alt="${esc(i.alt)}" loading="lazy"><figcaption>${esc(i.alt)}${i.credit?` ／ ${esc(i.credit)}`:''}</figcaption></figure>`).join('')}</div>`:''}<div class="dialog-body"><p class="dialog-topline">${t.region}・${t.city} <span>／</span> ${t.sect}</p><h2 id="dialog-title">${t.name}</h2><p>${esc(t.description)}</p><div class="dialog-alert">${esc(t.notice)}</div><dl class="detail-table">${rows.map(([k,v])=>`<div class="detail-row"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div class="dialog-actions">${t.bookingUrl.startsWith('tel:')?`<a class="button primary" href="${esc(t.bookingUrl)}">${icon('phone')} ${esc(t.bookingLabel)}</a>`:external(t.bookingUrl,`${esc(t.bookingLabel)} ${icon('external')}`,'button primary')}${external(mapsUrl,`${icon('pin')} Googleマップで経路を調べる`,'button outline')}<button class="button outline" data-save="${t.id}" aria-pressed="${saved.has(t.id)}">${icon('heart')} ${saved.has(t.id)?'保存から外す':'このお寺を保存'}</button></div><p>${t.photoUrl?external(t.photoUrl,'公式・観光案内の写真を見る ↗'):''}　${external(t.official,'公式案内を見る ↗')}</p><div class="dialog-sources"><p>情報確認：${esc(t.checkedAt)}。受付状況・臨時変更は主催者にご確認ください。</p>${t.sources.map(s=>external(s.url,esc(s.label))).join('')}</div></div>`;
  $('#temple-dialog').showModal();document.body.style.overflow='hidden';$('#dialog-close').focus();
}
function closeTemple(){if($('#temple-dialog').open)$('#temple-dialog').close();}
$('#temple-dialog').addEventListener('close',()=>{document.body.style.overflow='';lastFocused?.focus({preventScroll:true});});
$('#dialog-close').addEventListener('click',closeTemple);
$('#temple-dialog').addEventListener('click',e=>{if(e.target===$('#temple-dialog')){const r=$('#temple-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeTemple();}});
function selectMap(id) {
  const t=temples.find(t=>t.id===id);if(!t)return;selectedMapId=id;
  document.querySelectorAll('[data-map]').forEach(b=>b.classList.toggle('active',b.dataset.map===id));
  const m=markers.find(m=>m.id===id);
  if(map&&m){map.setView([t.lat,t.lng],12);m.marker.openPopup();}else{openTemple(id);}
}
function initMap(){
  if(!window.L){$('#map').innerHTML='<p class="map-loading">地図を読み込めませんでした。お寺の詳細からGoogleマップをご利用ください。</p>';return;}
  $('#map').innerHTML='';map=L.map('map',{scrollWheelZoom:false}).setView([34.79,133.82],9);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
  updateMap(filteredTemples());
}
function updateMap(list){
  if(!map)return;
  markers.forEach(m=>map.removeLayer(m.marker));markers=[];
  list.forEach(t=>{
    const marker=L.marker([t.lat,t.lng],{icon:L.divIcon({className:'map-marker',html:String(temples.indexOf(t)+1),iconSize:[32,32],iconAnchor:[16,16]}),title:t.name,alt:t.name});
    marker.bindPopup(`<b>${t.name}</b><p>${t.city} ／ ${t.sect}<br>${esc(t.schedule)}</p><button class="popup-details" data-open="${t.id}">詳細・参加方法を見る →</button>`).addTo(map);
    marker.on('click',()=>{selectedMapId=t.id;document.querySelectorAll('[data-map]').forEach(b=>b.classList.toggle('active',b.dataset.map===t.id));});
    markers.push({id:t.id,marker});
  });
  if(list.length)map.fitBounds(L.latLngBounds(list.map(t=>[t.lat,t.lng])),{padding:[45,45],maxZoom:list.length===1?12:10});
}
function resetFilters(){selectedFilter='all';$('#search').value='';$('#area').value='all';selectedMapId=null;render();}
document.addEventListener('click',e=>{
  const saveButton=e.target.closest('[data-save]');if(saveButton){toggleSave(saveButton.dataset.save);return;}
  const openButton=e.target.closest('[data-open]');if(openButton){e.preventDefault();openTemple(openButton.dataset.open);return;}
  const filterButton=e.target.closest('[data-filter]');if(filterButton){selectedFilter=filterButton.dataset.filter;selectedMapId=null;render();return;}
  const mapButton=e.target.closest('[data-map]');if(mapButton){selectMap(mapButton.dataset.map);return;}
});
$('#search').addEventListener('input',render);$('#area').addEventListener('change',render);$('#reset').addEventListener('click',resetFilters);$('#map-reset').addEventListener('click',resetFilters);
$('#saved-nav').addEventListener('click',()=>{selectedFilter='saved';$('#search').value='';$('#area').value='all';render();$('#finder').scrollIntoView({behavior:'smooth'});});
$('#menu-toggle').addEventListener('click',()=>{const isOpen=$('#menu-toggle').getAttribute('aria-expanded')==='true';$('#menu-toggle').setAttribute('aria-expanded',String(!isOpen));$('#menu-toggle').setAttribute('aria-label',isOpen?'メニューを開く':'メニューを閉じる');$('#mobile-nav').hidden=isOpen;});
$('#mobile-nav').addEventListener('click',e=>{if(e.target.closest('a')){$('#mobile-nav').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').setAttribute('aria-label','メニューを開く');}});
document.querySelectorAll('a[href="#sources"]').forEach(a=>a.addEventListener('click',()=>{$('#sources').open=true;}));
function renderEvents(){
  const updated=temples.filter(t=>t.cmsUpdated);
  const additional=updated.filter(t=>t.nextDate).map(t=>({date:t.nextDate,end:t.nextDate+'T23:59:59+09:00',day:new Intl.DateTimeFormat('ja-JP',{weekday:'short',timeZone:'Asia/Tokyo'}).format(new Date(t.nextDate+'T12:00:00+09:00')),label:'掲載者が確認した日程',title:t.name+' 坐禅のご案内',place:t.city+'・'+t.name,time:t.nextTime,description:t.nextNote||t.fullSchedule,url:t.bookingUrl||t.official,link:t.bookingLabel||'公式案内を確認'}));
  const next=[...events.filter(e=>!updated.some(t=>t.id===e.templeId)),...additional].filter(e=>new Date(e.end)>=new Date()).sort((a,b)=>a.date.localeCompare(b.date));
  $('#events-grid').innerHTML=next.length?next.map(e=>`<article class="event-card"><div class="event-header"><time class="event-date" datetime="${esc(e.date)}">${e.date.slice(5).replace('-','.')}<small>${e.date.slice(0,4)} / ${esc(e.day)}</small></time><span class="event-label">${esc(e.label)}</span></div><h3>${esc(e.title)}</h3><p class="event-place">${esc(e.place)}　｜　${esc(e.time)}</p><p class="event-description">${esc(e.description)}</p>${external(e.url,`${esc(e.link)} ${icon('external')}`,'event-link')}</article>`).join(''):'<p>掲載日程の開催期間が終了しました。各寺院の詳細から公式の最新案内をご確認ください。</p>';
}
$('#source-links').innerHTML=temples.map(t=>`<li>${t.name}：${t.sources.map(s=>external(s.url,esc(s.label))).join(' ／ ')}</li>`).join('');
fetch('assets/credits.json').then(r=>r.json()).then(data=>{
  const list=Array.isArray(data)?data:data.images||data.photos||data.credits||[];
  const uploaded=temples.flatMap(t=>(t.images||[]).map(i=>`<p class="photo-credit">${esc(t.name)}：${esc(i.alt)}${i.credit?' ／ '+esc(i.credit):''}</p>`)).join('');
  $('#photo-credits').innerHTML=uploaded+list.map(c=>`<p class="photo-credit">${esc(c.title||c.temple||c.file||c.filename||'寺院写真')}：${esc(c.author||c.artist||'')} ／ ${external(c.source_url||c.sourceUrl||c.source||c.url||'#','写真の出典')} ／ ${external(c.license_url||c.licenseUrl||'#',esc(c.license||'ライセンス'))}。表示領域に合わせてトリミング。</p>`).join('');
}).catch(()=>{$('#photo-credits').textContent='写真：Reggaeman（曹源寺・円通寺）CC BY-SA 3.0、Fabimaru（宝福寺）CC BY-SA 4.0。詳細は写真出典ファイルをご覧ください。';});
const age=(Date.now()-new Date(`${CHECKED}T00:00:00+09:00`).getTime())/86400000;
if(age>30){$('#freshness').hidden=false;$('#freshness').textContent='掲載情報の確認から30日以上が経過しています。このガイドは自動更新ではありません。参加前に各寺院の公式サイトで最新情報をご確認ください。';}
render();renderEvents();initMap();
