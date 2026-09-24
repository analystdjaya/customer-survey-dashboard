/* Customer Satisfaction Survey 2026: scoped static data, reactive filters, defensible denominators. */
'use strict';
const $=(q,root=document)=>root.querySelector(q);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={'FS DIAMOND JAKARTA':'FS DIA JKT','FS TRADING JAKARTA':'FS TRD JKT','FS FINE FOOD JAKARTA':'FS FF JKT','FS QSR JAKARTA':'FS QSR JKT'};
const fmtUnit=s=>names[s]||s.replace(/\b\w/g,x=>x.toUpperCase());
const clean=s=>String(s??'').toLocaleLowerCase('id').replace(/\s+/g,' ').trim();
const valid=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=10;
const ratio=(a,b)=>b>0?a/b*100:null;
const round=n=>Number.isFinite(n)?Math.round(n)+'%':'-';
const avg=(rows,key)=>{let xs=rows.map(r=>r[key]).filter(valid);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null};
const score=v=>Number.isFinite(v)?v.toFixed(2)+' <small>/10</small>':'-';
const npsBand=n=>n===null?'-':n>80?'Elite':n>50?'Excellent':n>20?'Favourable':n>=0?'Good':'Improvement needed';
const npsExplanation={Elite:'Mayoritas pelanggan sangat antusias merekomendasikan perusahaan; tingkat rekomendasi bersih berada di atas 80 poin.',Excellent:'Pelanggan yang merekomendasikan perusahaan jauh lebih banyak daripada yang tidak merekomendasikan.',Favourable:'Pelanggan yang bersedia merekomendasikan perusahaan lebih banyak daripada yang tidak; masih terdapat ruang untuk meningkatkan pengalaman pelanggan.',Good:'Pelanggan yang merekomendasikan perusahaan sedikit lebih banyak atau sama dengan yang tidak; pengalaman pelanggan masih dapat ditingkatkan.','Improvement needed':'Responden yang tidak merekomendasikan perusahaan lebih banyak dibandingkan dengan yang sangat bersedia merekomendasikan.','-':'Belum ada jawaban NPS valid pada pilihan filter ini.'};


function kpiIcon(name){
 const icons={
  respondents:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="22" cy="22" r="9" fill="currentColor"/><circle cx="42" cy="24" r="8" fill="currentColor" opacity=".92"/><path d="M8 48c0-8.3 6.7-15 15-15h0c8.3 0 15 6.7 15 15v3H8z" fill="currentColor"/><path d="M34 49c0-6.6 5.4-12 12-12h0c6.6 0 12 5.4 12 12v2H34z" fill="currentColor" opacity=".92"/></svg>`,
  star:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6l7.6 15.5 17.1 2.5-12.4 12.1 2.9 17L32 45.2 16.8 53l2.9-17L7.4 24l17.1-2.5z" fill="#f8b834" stroke="#f2a500" stroke-width="1.5"/></svg>`,
  sales:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="18" r="10" fill="currentColor"/><path d="M14 50c0-9.9 8.1-18 18-18s18 8.1 18 18v4H14z" fill="currentColor"/><path d="M28 33h8l4 8-8 7-8-7z" fill="#f2f6fb"/><path d="M30 35h4l-1 6 3 8h-8l3-8z" fill="#1b57a0"/></svg>`,
  truck:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 18h28v22H8z" fill="currentColor"/><path d="M36 24h10l9 10v6H36z" fill="currentColor" opacity=".95"/><path d="M45 27h6l4 5h-10z" fill="#f2f6fb" opacity=".9"/><circle cx="21" cy="45" r="6" fill="#2b6cb8" stroke="currentColor" stroke-width="4"/><circle cx="49" cy="45" r="6" fill="#2b6cb8" stroke="currentColor" stroke-width="4"/></svg>`,
  headset:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 31c0-10 8-18 18-18s18 8 18 18v8h-6V31c0-6.6-5.4-12-12-12s-12 5.4-12 12v8h-6z" fill="currentColor"/><rect x="10" y="31" width="10" height="18" rx="5" fill="currentColor"/><rect x="44" y="31" width="10" height="18" rx="5" fill="currentColor"/><path d="M42 48c-1 4-4.5 6-9.5 6H29v-5h3.5c2.2 0 3.7-.4 4.7-2z" fill="currentColor"/></svg>`
 };
 return icons[name]||'';
}
// Sheet 2 is the SOLE source for Reasons, Top Complaint Areas, quotes, and Key Insights.
// Sentiment and subcategories are curated in the workbook; never reclassify raw comments.
const categories=['DELIVERY','PRODUCT','SALES','SERVICE','OTHERS'];
const teamByCategory={DELIVERY:'Logistic',PRODUCT:'Supply Chain / Quality',SALES:'Sales',SERVICE:'Sales / Customer Service',OTHERS:'Tim Terkait'};
const reasonKey=r=>JSON.stringify([String(r.soldTo),String(r.unit),String(r.type)]);
function filteredReasons(rows=filteredRows()){
 const keys=new Set(rows.map(reasonKey));
 return (payload.reasons||[]).filter(r=>keys.has(reasonKey(r)));
}
function aggregateReasons(items,kind){
 const selected=items.filter(x=>x.kind===kind),tally=Object.fromEntries(categories.map(c=>[c,0]));
 for(const item of selected)tally[item.cat]=(tally[item.cat]||0)+1;
 return {count:selected.length,tally}; // Share of classified REASON ROWS, not share of respondents.
}
function commonQuotes(items,kind,max=3){
 // ALWAYS use Sheet 2 Original Response. A response can be classified as both
 // positive and negative; such responses must not disappear from the quote box.
 // Prefer single-sentiment originals, then include mixed-sentiment originals.
 const groups=new Map();
 for(const item of items){
  const text=String(item.text||'').trim();if(!text)continue;
  const key=JSON.stringify([item.soldTo,item.unit,item.type,text]);
  if(!groups.has(key))groups.set(key,{text,kinds:new Set(),catsByKind:new Map()});
  const group=groups.get(key);group.kinds.add(item.kind);
  if(!group.catsByKind.has(item.kind))group.catsByKind.set(item.kind,new Set());
  group.catsByKind.get(item.kind).add(item.cat);
 }
 const tally=aggregateReasons(items,kind).tally,seen=new Set(),out=[];
 for(const group of groups.values()){
  if(!group.kinds.has(kind))continue;
  const normalized=clean(group.text);if(seen.has(normalized))continue;
  seen.add(normalized);
  const cats=[...(group.catsByKind.get(kind)||[])];
  out.push({text:group.text,mixed:group.kinds.size>1,
   importance:Math.max(0,...cats.map(cat=>tally[cat]||0))});
 }
 return out.sort((a,b)=>Number(a.mixed)-Number(b.mixed)||b.importance-a.importance||b.text.length-a.text.length).slice(0,max);
}
function topNegativeSubcategories(items,limit=3){
 // Cascade Pareto: select top negative CATEGORIES first (same sorting as the
 // Reasons for Dissatisfaction bars); then select the leading negative
 // SUBCATEGORY WITHIN EACH selected category. Show exactly one per category.
 // Contributions in each insight use the same total-negative-reason denominator
 // as the category bars; the chart's category share determines the ranking.
 const negatives=items.filter(x=>x.kind==='negative'&&categories.includes(x.cat));
 const byCategory=new Map(categories.map(cat=>[cat,0]));
 const bySubcategory=new Map();
 for(const item of negatives){
  byCategory.set(item.cat,byCategory.get(item.cat)+1);
  const subcat=String(item.subcat||'').trim();
  if(!subcat)continue;
  const key=JSON.stringify([item.cat,subcat]);
  bySubcategory.set(key,(bySubcategory.get(key)||0)+1);
 }
 // categoryBars sorts by count descending and preserves original category order
 // when counts tie, so use the identical rule here.
 const rankedCategories=categories.filter(cat=>byCategory.get(cat)>0)
  .sort((a,b)=>byCategory.get(b)-byCategory.get(a));
 return rankedCategories.slice(0,limit).map(cat=>{
  const rankedSubcats=[...bySubcategory.entries()]
   .map(([key,n])=>({key:JSON.parse(key),n}))
   .filter(x=>x.key[0]===cat)
   .sort((a,b)=>b.n-a.n||a.key[1].localeCompare(b.key[1],'id'));
  if(!rankedSubcats.length)return null;
  const winner=rankedSubcats[0];
  return {cat,subcat:winner.key[1],n:winner.n,
   contribution:negatives.length?winner.n/negatives.length*100:0,
   categoryCount:byCategory.get(cat),
   categoryContribution:negatives.length?byCategory.get(cat)/negatives.length*100:0};
 }).filter(Boolean);
}
const subcatLabels={
 'Delivery timeliness':'Ketepatan waktu pengiriman',
 'Delivery coordination':'Koordinasi pengiriman',
 'Delivery stability':'Konsistensi pengiriman',
 'Delivery handling':'Penanganan barang saat pengiriman',
 'Delivery staff attitude':'Sikap petugas pengiriman',
 'Stock availability':'Ketersediaan stok produk',
 'Expired/Near-expiry product':'Produk kedaluwarsa atau mendekati kedaluwarsa',
 'Product quality issue':'Kualitas atau kondisi produk',
 'Inconsistent responsiveness':'Konsistensi respons tim Sales',
 'Order issue':'Kendala pemesanan',
 'Complaint handling':'Penanganan komplain',
 'Limited service':'Keterbatasan layanan',
 'Loyalty support':'Dukungan program loyalitas',
 'TOP payment system':'Sistem termin pembayaran',
 'General improvement needed':'Perbaikan layanan secara umum',
 'Price competitiveness':'Daya saing harga',
 'Price fairness':'Kewajaran harga',
 'Price increase':'Kenaikan harga',
 'Price adjustment':'Penyesuaian harga',
 'Discount price issue':'Kendala diskon atau potongan harga',
 'Price approval':'Persetujuan harga'
};
let payload=null, customerNames=new Map(), state={types:new Set(),customers:new Set(),units:new Set()};
const allRows=()=>payload.rows;
const filteredRows=()=>payload.rows.filter(r=>(!state.units.size||state.units.has(r.unit))&&(!state.types.size||state.types.has(r.type))&&(!state.customers.size||state.customers.has(r.soldTo)));
function safeLabel(k,v){return `<div class="filter"><label>${esc(k)}</label>${v}</div>`}
function targetSet(id){return id==='unit'?state.units:id==='type'?state.types:state.customers}
function filterName(id,x){return id==='unit'?fmtUnit(x):id==='customer'?customerNames.get(x)||x:x}
// Draft selections are isolated from applied filters until the OK button is clicked.
let draftFilters=new Map();
function multiFilter(id,label,options,chosen,display,locked=false){
 let selected=options.filter(x=>chosen.has(x));
 let shown=locked?display(options[0]):selected.length===0?'All':selected.length===1?display(selected[0]):selected.length+' selected';
 return `<div class="filter ${id==='customer'?'sold':''}"><label>${esc(label)}</label><button type="button" class="filter-open" data-menu="${id}" aria-expanded="false" ${locked?'disabled title="Filter terkunci untuk unit ini"':''}>${esc(shown)} ▾</button><div class="filter-menu" id="menu-${id}" hidden><input type="search" class="filter-search" placeholder="Search text..." aria-label="Search ${esc(label)}"><div class="filter-toolbar"><button type="button" class="filter-all" data-all="${id}">Select All</button><button type="button" class="filter-clear" data-clear="${id}">Clear Filter</button></div><div class="filter-options"></div><div class="filter-bottom"><button type="button" class="filter-cancel" data-cancel="${id}">Cancel</button><button type="button" class="filter-ok" data-ok="${id}">OK</button></div></div></div>`;
}
function drawFilterOptions(id){
 const menu=$('#menu-'+id),draft=draftFilters.get(id),available=(payload.divisionFilterLocked&&id==='unit')?payload.units:getChoices(id);
 const query=clean(menu.querySelector('.filter-search').value);
 const visible=available.filter(x=>clean(filterName(id,x)).includes(query));
 menu.querySelector('.filter-options').innerHTML=visible.map(x=>`<label class="filter-opt"><input type="checkbox" data-value="${esc(x)}" ${draft.has(x)?'checked':''}><span>${esc(filterName(id,x))}</span></label>`).join('')||'<p class="filter-empty">Tidak ada pilihan yang sesuai</p>';
}
function closeFilter(id){const menu=$('#menu-'+id);if(menu)menu.hidden=true;const trigger=document.querySelector(`[data-menu="${id}"]`);if(trigger)trigger.setAttribute('aria-expanded','false');draftFilters.delete(id)}
function openFilter(id){for(const key of ['unit','type','customer'])if(key!==id)closeFilter(key);
 const menu=$('#menu-'+id);if(!menu.hidden){closeFilter(id);return}
 draftFilters.set(id,new Set(targetSet(id)));menu.querySelector('.filter-search').value='';drawFilterOptions(id);menu.hidden=false;
 document.querySelector(`[data-menu="${id}"]`).setAttribute('aria-expanded','true');menu.querySelector('.filter-search').focus();
}
function getChoices(exclude){
 const byOther=payload.rows.filter(r=>
  (exclude==='unit'||!state.units.size||state.units.has(r.unit))&&
  (exclude==='type'||!state.types.size||state.types.has(r.type))&&
  (exclude==='customer'||!state.customers.size||state.customers.has(r.soldTo)));
 return {
  unit:[...new Set(byOther.map(r=>r.unit))].filter(Boolean).sort(),
  type:[...new Set(byOther.map(r=>r.type))].filter(Boolean).sort(),
  customer:[...new Set(byOther.map(r=>r.soldTo))].filter(Boolean).sort()
 }[exclude];
}
function reconcileFilters(changed){
 // A change to one filter invalidates selections that no longer exist in others.
 // Use a fixed order starting with the just-changed dimension.
 for(const id of ['unit','type','customer'].filter(x=>x!==changed)){
  const avail=new Set(getChoices(id));
  const target=id==='unit'?state.units:id==='type'?state.types:state.customers;
  for(const val of [...target])if(!avail.has(val))target.delete(val);
 }
}
function renderFrame(){
 const locked=payload.divisionFilterLocked===undefined?(payload.scope!=='national'&&payload.scope!=='all-branches'):payload.divisionFilterLocked;
 const unitChoices=locked?payload.units:getChoices('unit');
 const allTypes=getChoices('type');
 const customerChoices=getChoices('customer');
 const scopeTitle=payload.viewName||(payload.scope==='national'?'National':payload.scope==='all-branches'?'All Branches':fmtUnit(payload.scope));
 const unitFilter=multiFilter('unit','Division / Branch',unitChoices,state.units,fmtUnit,locked);
 const typeFilter=multiFilter('type','Customer Type',allTypes,state.types,x=>x);
 const customerFilter=multiFilter('customer','Customer (Sold-to)',customerChoices,state.customers,x=>customerNames.get(x)||x);
 $('#app').innerHTML=`<header class="header"><div class="header-titles"><h1>Customer Satisfaction Survey 2026</h1><div class="subtitle">${esc(scopeTitle)}</div></div><div class="header-actions">${unitFilter}${typeFilter}${customerFilter}<button type="button" class="download" id="download">⇩ &nbsp; Download Raw Data (Excel)</button><button type="button" class="logout" id="logout">↪ Logout</button></div><img class="brand" src="assets/diamond.png" alt="Diamond"></header><main class="body"><div class="watermark" aria-hidden="true">CONFIDENTIAL</div><div id="results"></div></main><footer class="footer"><img class="joy" src="assets/delivering-joy.png" alt="delivering joy"><span>Last updated: ${esc(payload.updated)} &nbsp; · &nbsp; Confidential – For Internal Use Only</span></footer>`;
 for(const btn of document.querySelectorAll('.filter-open'))btn.addEventListener('click',()=>openFilter(btn.dataset.menu));
 for(const menu of document.querySelectorAll('.filter-menu')){
  const id=menu.id.slice(5);
  menu.querySelector('.filter-search').addEventListener('input',()=>drawFilterOptions(id));
  menu.querySelector('.filter-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyFilter(id)}else if(e.key==='Escape')closeFilter(id)});
  menu.querySelector('.filter-options').addEventListener('change',e=>{if(e.target.matches('input[type=checkbox]')){const draft=draftFilters.get(id);if(e.target.checked)draft.add(e.target.dataset.value);else draft.delete(e.target.dataset.value)}});
  menu.querySelector('[data-all]').addEventListener('click',()=>{const q=clean(menu.querySelector('.filter-search').value);const opts=getChoices(id).filter(x=>clean(filterName(id,x)).includes(q));const draft=draftFilters.get(id);for(const x of opts)draft.add(x);drawFilterOptions(id)});
  menu.querySelector('[data-clear]').addEventListener('click',()=>{draftFilters.get(id).clear();drawFilterOptions(id)});
  menu.querySelector('[data-cancel]').addEventListener('click',()=>closeFilter(id));
  menu.querySelector('[data-ok]').addEventListener('click',()=>applyFilter(id));
 }
 $('#download').addEventListener('click',downloadExcel);
 $('#logout').addEventListener('click', () => {
  window.__CSS_PREVIEW_DATA__ = null;
  payload = null;
  window.location.replace(
    new URL('./?logout=' + Date.now(), window.location.href).href
  );
});
}
function onFilterEscape(e){if(e.key==='Escape')for(const id of ['unit','type','customer'])closeFilter(id)}
function applyFilter(id){
 const selection=draftFilters.get(id);if(!selection)return;
 const target=targetSet(id);target.clear();for(const x of selection)target.add(x);
 closeFilter(id);reconcileFilters(id);renderFrame();renderResults();
}
function categoryBars(tally,den,positive=false){let order=categories.slice().sort((a,b)=>tally[b]-tally[a]);return order.map(c=>{let n=den?100*tally[c]/den:null;return `<div class="barrow"><span>${esc(c)}</span><div class="track"><div class="fill ${positive?'positive':''}" style="width:${n===null?0:Math.min(n,100)}%"></div></div><b>${round(n)}</b></div>`}).join('')}
function quoteHtml(quotes,negative=false){if(!quotes.length)return `<div class="quote empty">Tidak ada komentar yang sesuai dengan pilihan filter.</div>`;return `<div class="quote ${negative?'negative':''}">${quotes.map(x=>`<q>${esc(x.text.length>170?x.text.slice(0,169)+'…':x.text)}</q>`).join('')}${quotes.some(x=>x.mixed)?'<small class="muted">Komentar asli dapat memuat pujian dan keluhan sekaligus; klasifikasi mengikuti Detail Reason.</small>':''}</div>`}
function renderResults(){
 let rows=filteredRows(),count=rows.length,feedbackItems=filteredReasons(rows),pos=aggregateReasons(feedbackItems,'positive'),neg=aggregateReasons(feedbackItems,'negative');
 let npsValid=rows.filter(r=>valid(r.nps)),p=npsValid.filter(r=>r.nps>=9).length,pass=npsValid.filter(r=>r.nps>=7&&r.nps<9).length,d=npsValid.filter(r=>r.nps<7).length;
 let nps=npsValid.length?100*(p-d)/npsValid.length:null,band=npsBand(nps);
 let issue=rows.filter(r=>r.issue==='PERNAH'),reported=issue.filter(r=>r.reported==='YA'),handling=reported.filter(r=>valid(r.handling));
 // Satisfaction with handling: 8–10 / 10, conditional on valid answered complaint-handling score.
 let satisfied=handling.filter(r=>r.handling>=8).length;
 let issuePct=ratio(issue.length,count),reportPct=ratio(reported.length,issue.length),handlingPct=ratio(satisfied,handling.length);
 let complaintMentions=neg.tally; // Negative classifications from Detail Reason (Sheet 2).
 let negativeQuote=commonQuotes(feedbackItems,'negative'),positiveQuote=commonQuotes(feedbackItems,'positive');
 let ranked=topNegativeSubcategories(feedbackItems);
 let insights=ranked.map((item,i)=>`<div class="insight"><div class="rank">${i+1}</div><div><b>${esc(subcatLabels[item.subcat]||item.subcat)}</b><span>Kategori ${esc(item.cat)}: ${item.categoryCount} dari ${neg.count} alasan negatif (${item.categoryContribution.toFixed(2)}%). Subkategori terbanyak: ${esc(item.subcat)} (${item.n} alasan; ${item.contribution.toFixed(2)}% dari seluruh alasan negatif).</span><span class="team">Tim Terkait <em>${esc(teamByCategory[item.cat]||'Tim Terkait')}</em></span></div></div>`).join('')||'<div class="insight">Belum ada klasifikasi alasan negatif untuk pilihan filter ini.</div>';
 const validScoreCount=k=>rows.filter(r=>valid(r[k])).length;
 const kpis=[[kpiIcon('respondents'),'Total Respondents',String(count)],[kpiIcon('star'),'Overall CSAT',score(avg(rows,'csat'))],[kpiIcon('sales'),'Sales Team',score(avg(rows,'sales'))],[kpiIcon('truck'),'Logistic',score(avg(rows,'logistic'))],[kpiIcon('headset'),'Customer Service',score(avg(rows,'cs'))]];
 $('#results').innerHTML=`<section class="panel"><div class="section-header"><h2>Key Results</h2><span>Overall satisfaction score and performance by area (on a scale of 10)</span></div><div class="kpi-grid">${kpis.map(([ico,name,value],i)=>`<div class="kpi"><div class="kpi-icon">${ico}</div><div><span class="name">${name}</span><strong>${value}</strong>${i>0?`<small class="muted">${validScoreCount(['','csat','sales','logistic','cs'][i])} valid responses</small>`:''}</div></div>`).join('')}</div></section>
 <section class="panel"><div class="section-header"><h2>Net Promoter Score (NPS)</h2><span>How likely are customers to recommend us?</span></div><div class="nps-wrap"><div class="nps-main"><div class="nps-score"><b>NPS Score</b><strong>${round(nps)}</strong><span class="chip">${esc(band)}</span><small>${npsValid.length} valid NPS responses</small></div><div class="nps-break"><span class="face green">☺</span><div>Promoters<strong>${round(ratio(p,npsValid.length))}</strong><small>Score 9–10</small></div></div><div class="nps-break"><span class="face amber">●</span><div>Passives<strong>${round(ratio(pass,npsValid.length))}</strong><small>Score 7–8</small></div></div><div class="nps-break"><span class="face red">☹</span><div>Detractors<strong>${round(ratio(d,npsValid.length))}</strong><small>Score 0–6</small></div></div></div><div class="guide"><strong>NPS Category Guide</strong>${[['> 80%','Elite'],['50–80%','Excellent'],['20–50%','Favourable'],['0–20%','Good'],['< 0%','Improvement needed']].map(([range,label])=>`<div class="guide-line ${label===band?'active':''}"><span>${range}</span><span>${label}</span></div>`).join('')}</div></div><div class="interpret">💡 <b>Interpretasi:</b> ${esc(npsExplanation[band])} NPS = persentase Promoters dikurangi persentase Detractors.</div></section>
 <section class="panel"><div class="section-header"><h2>Complaint Handling</h2><span>Experience and satisfaction with complaint handling</span></div><div class="complaints"><div class="issue-cards"><div class="issue"><span class="ico">⚠</span><div>Experienced an issue<strong>${round(issuePct)}</strong><small>${issue.length} dari ${count} responden</small></div></div><div class="issue"><span class="ico">●</span><div>Reported a complaint<strong>${round(reportPct)}</strong><small>${reported.length} dari ${issue.length} yang pernah bermasalah</small></div></div><div class="issue"><span class="ico">✔</span><div>Satisfied with handling<strong>${round(handlingPct)}</strong><small>${satisfied} dari ${handling.length} jawaban valid (skor 8–10)</small></div></div></div><div class="chart-side"><strong>Top Complaint Areas <small class="muted">(berdasarkan klasifikasi alasan negatif)</small></strong>${categoryBars(complaintMentions,neg.count)}</div></div></section>
 <div class="reasons-grid"><section class="panel"><div class="section-header"><h2>Reasons for Satisfaction</h2><span>What customers appreciate the most</span></div><div class="reasons-content"><div>${categoryBars(pos.tally,pos.count,true)}<small class="muted">${pos.count} alasan positif yang diklasifikasikan</small></div>${quoteHtml(positiveQuote)}</div></section><section class="panel"><div class="section-header"><h2>Reasons for Dissatisfaction</h2><span>What customers are most concerned about</span></div><div class="reasons-content"><div>${categoryBars(neg.tally,neg.count)}<small class="muted">${neg.count} alasan negatif yang diklasifikasikan</small></div>${quoteHtml(negativeQuote,true)}</div></section></div>
 <section class="panel"><div class="section-header"><h2>Key Insights</h2><span>Main takeaways from customer feedback</span></div><div class="insight-grid">${insights}</div></section>`;
}
function downloadExcel(){
 const rows=filteredRows(),reasonRows=filteredReasons(rows);
 // Preserve ALL original survey fields (Sheet 1), plus ALL manually classified
 // detail rows (Sheet 2) for the same filtered Sold-to + unit + customer type.
 const rawLookup=new Map((payload.rows||[]).map((r,i)=>[r, (payload.rawRows||[])[i]]));
 const surveyRows=rows.map(r=>rawLookup.get(r));
 const detailKeys=new Map();
 (payload.reasons||[]).forEach((r,i)=>detailKeys.set(r,i));
 const detailRows=reasonRows.map(r=>payload.reasonRows[detailKeys.get(r)]);
 if(!payload.rawHeaders||!payload.reasonHeaders||!surveyRows.every(Array.isArray)||!detailRows.every(Array.isArray)){
  alert('Data untuk kedua sheet belum lengkap. Silakan perbarui data dashboard.');return;
 }
 const workbook=[
  {name:'Raw Survey',rows:[...(payload.rawCodeHeader?[payload.rawCodeHeader]:[]),payload.rawHeaders,...surveyRows]},
  {name:'Detail Reason',rows:[...(payload.reasonCodeHeader?[payload.reasonCodeHeader]:[]),payload.reasonHeaders,...detailRows]}
 ];
 const unitName=payload.scope==='national'?'National':payload.scope==='all-branches'?'All_Branches':payload.scope.replace(/[^a-z0-9]+/gi,'_');
 saveFile(createXlsx(workbook),`CSS_2026_${unitName}_filtered.xlsx`);
}
// Create a real .xlsx with two sheets directly in the browser, without remote
// scripts/CDNs, and preserve numeric score cells for Excel analysis.
function createXlsx(sheets){
 const xmlEsc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
 const colName=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
 const sheetXml=rows=>'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+rows.map((cells,i)=>'<row r="'+(i+1)+'">'+cells.map((value,j)=>{
  if(value===null||value===undefined||value==='')return '';
  let ref=colName(j)+(i+1);
  if(i>0&&typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}"><v>${value}</v></c>`;
  // Preserve identifiers as TEXT even when consisting only of digits.
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(value)}</t></is></c>`;
 }).join('')+'</row>').join('')+'</sheetData></worksheet>';
 const files=[
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((sheet,i)=>`<sheet name="${xmlEsc(sheet.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+'</Relationships>'],
  ...sheets.map((sheet,i)=>[`xl/worksheets/sheet${i+1}.xml`,sheetXml(sheet.rows)])
 ];
 return zipUncompressed(files);
}
function zipUncompressed(files){
 const encoder=new TextEncoder(),chunks=[],central=[];let offset=0;
 const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0});
 const crc32=b=>{let c=0xFFFFFFFF;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
 const u16=(b,p,n)=>{b[p]=n&255;b[p+1]=(n>>>8)&255};const u32=(b,p,n)=>{u16(b,p,n);u16(b,p+2,n>>>16)};
 files.forEach(([name,content])=>{
  const nb=encoder.encode(name),data=encoder.encode(content),crc=crc32(data),local=new Uint8Array(30+nb.length);
  u32(local,0,0x04034b50);u16(local,4,20);u32(local,14,crc);u32(local,18,data.length);u32(local,22,data.length);u16(local,26,nb.length);local.set(nb,30);
  chunks.push(local,data);
  const c=new Uint8Array(46+nb.length);u32(c,0,0x02014b50);u16(c,4,20);u16(c,6,20);u32(c,16,crc);u32(c,20,data.length);u32(c,24,data.length);u16(c,28,nb.length);u32(c,42,offset);c.set(nb,46);central.push(c);
  offset+=local.length+data.length;
 });
 const centralSize=central.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22);
 u32(end,0,0x06054b50);u16(end,8,files.length);u16(end,10,files.length);u32(end,12,centralSize);u32(end,16,offset);
 return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function saveFile(blob,filename){let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function init(){try{payload=window.__CSS_PREVIEW_DATA__||await(await fetch('data.json',{cache:'no-store'})).json();if(!payload||!Array.isArray(payload.rows))throw Error('Data hasil build tidak tersedia');customerNames=new Map(payload.rows.map(r=>[r.soldTo,r.customer||r.soldTo]));renderFrame();renderResults();document.addEventListener('keydown',onFilterEscape)}catch(e){$('#app').innerHTML=`<div class="error"><h2>Dashboard mengalami kendala</h2><p>${esc(e.message)}</p><p>Jika membuka index.html dari folder lokal, gunakan file preview.html. Jika masalah berlanjut, periksa Console browser.</p></div>`;console.error(e)}}
init();
