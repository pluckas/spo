(()=>{'use strict';
document.querySelectorAll('.research-table-preview').forEach(section=>{
 const button=section.querySelector('.research-table-toggle');
 const rows=Array.from(section.querySelectorAll('tbody tr, .publication-list > li')).filter(row=>row.matches('li')||row.querySelector('td'));
 if(!button||rows.length<=3)return;
 const extraRows=rows.slice(3);
 const setExpanded=expanded=>{
  extraRows.forEach(row=>{row.hidden=!expanded;});
  button.setAttribute('aria-expanded',String(expanded));
  button.textContent=expanded?'Show fewer':button.dataset.expandLabel;
 };
 setExpanded(false);button.hidden=false;
 button.addEventListener('click',()=>{
  const expanded=button.getAttribute('aria-expanded')!=='true';
  setExpanded(expanded);
  if(!expanded)section.scrollIntoView({block:'nearest'});
 });
});
// YouTube requires an HTTP referrer, which file previews cannot provide.
if(location.protocol==='file:'){
 document.querySelectorAll('iframe[src*="youtube.com/embed/"],iframe[src*="youtube-nocookie.com/embed/"]').forEach(frame=>{
  const video=new URL(frame.src).pathname.split('/').pop();
  if(!/^[\w-]{11}$/.test(video))return;
  const link=document.createElement('a');
  link.href='https://www.youtube.com/watch?v='+video;
  link.target='_blank';link.rel='noopener noreferrer';link.className='video-local-link';
  link.textContent='▶ Watch '+(frame.title||'this video')+' on YouTube';
  const figure=frame.closest('figure'),caption=figure&&figure.querySelector('figcaption');
  if(caption&&caption.querySelector('a[href="'+link.href+'"]'))caption.remove();
  frame.replaceWith(link);
 });
}
const dialog=document.querySelector('#lightbox');
if(dialog){
 const img=dialog.querySelector('img'),caption=dialog.querySelector('p'),close=dialog.querySelector('button');
 const viewport=document.createElement('div');viewport.className='lightbox-viewport';
 img.before(viewport);viewport.append(img);
 img.tabIndex=0;img.setAttribute('role','button');
 function setZoom(zoomed){
  viewport.classList.toggle('is-zoomed',zoomed);
  img.setAttribute('aria-pressed',String(zoomed));
  img.setAttribute('aria-label',zoomed?'Fit image to screen':'Zoom image to actual size');
  img.title=zoomed?'Click to fit image to screen':'Click to zoom to actual size';
  viewport.scrollTop=viewport.scrollLeft=0;
 }
 img.addEventListener('click',()=>setZoom(!viewport.classList.contains('is-zoomed')));
 img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setZoom(!viewport.classList.contains('is-zoomed'));}});
 let photos=[],current=0;
 const controls=document.createElement('div');controls.className='lightbox-controls';controls.hidden=true;
 const previous=document.createElement('button'),next=document.createElement('button'),position=document.createElement('span');
 previous.type=next.type='button';previous.textContent='← Previous';next.textContent='Next →';
 previous.setAttribute('aria-label','Previous image');next.setAttribute('aria-label','Next image');
 position.setAttribute('aria-live','polite');position.setAttribute('aria-atomic','true');
 controls.append(previous,position,next);dialog.append(controls);
 dialog.setAttribute('aria-label','Enlarged image');caption.id='lightbox-caption';dialog.setAttribute('aria-describedby',caption.id);
 function display(index){
  setZoom(false);
  current=(index+photos.length)%photos.length;
  const a=photos[current],thumbnail=a.querySelector('img'),title=a.dataset.title||(thumbnail?thumbnail.alt:'Historical equipment');
  img.src=a.href;img.alt=title;
  caption.hidden=!!a.closest('.history-gallery')&&!a.dataset.caption;
  caption.textContent=caption.hidden?'':(a.dataset.caption||(a.closest('figure')&&a.closest('figure').querySelector('figcaption')?a.closest('figure').querySelector('figcaption').textContent:title));
  if(caption.hidden)dialog.removeAttribute('aria-describedby');else dialog.setAttribute('aria-describedby',caption.id);
  position.textContent=(current+1)+' / '+photos.length;
 }
 function openGroup(gallery,selected){
  photos=Array.from(gallery.querySelectorAll('a'));dialog.classList.add('gallery-viewer');
  controls.hidden=photos.length<2;display(Math.max(0,photos.indexOf(selected)));dialog.showModal();
 }
 document.addEventListener('click',e=>{
  const a=e.target.closest('a');if(!a)return;
  if(a.dataset.openSlideshow){
   const gallery=document.getElementById(a.dataset.openSlideshow);
   if(gallery&&gallery.querySelector('a')){e.preventDefault();const selected=Array.from(gallery.querySelectorAll('a')).find(photo=>photo.href===a.href);openGroup(gallery,selected);}
   return;
  }
  if(!a.querySelector('img')||! /\.(jpe?g|png|gif|webp)(\?|$)/i.test(a.href))return;
  e.preventDefault();
  const gallery=a.closest('.history-gallery, .equipment-slideshow, .gallery');
  if(gallery){openGroup(gallery,a);return;}
  photos=[a];dialog.classList.add('gallery-viewer');controls.hidden=true;display(0);dialog.showModal();
 });
 previous.addEventListener('click',()=>display(current-1));next.addEventListener('click',()=>display(current+1));
 dialog.addEventListener('keydown',e=>{
  if(photos.length<2)return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();display(current+(e.key==='ArrowLeft'?-1:1));}
 });
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
}
// Keep archive navigation compact and reachable above entries on small screens.
if(typeof matchMedia==='function'){
 const compact=matchMedia('(max-width:800px)');
 const updateGroups=()=>document.querySelectorAll('.sidebar-group').forEach(group=>{group.open=!compact.matches;});
 updateGroups();compact.addEventListener('change',updateGroups);
}
const source=document.querySelector('#search-data');if(!source)return;
const data=JSON.parse(source.textContent),q=document.querySelector('#search'),cat=document.querySelector('#category'),year=document.querySelector('#year'),month=document.querySelector('#month'),results=document.querySelector('#results'),count=document.querySelector('#result-count'),summary=document.querySelector('#filter-summary'),clear=document.querySelector('#clear-filters'),params=new URLSearchParams(location.search);
q.value=params.get('q')||'';cat.value=params.get('category')||'';year.value=params.get('year')||'';month.value=params.get('month')||'';if(month.value)year.value=month.value.slice(0,4);
function el(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function render(){
 const words=q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
 const found=data.filter(p=>(!cat.value||p.categories.includes(cat.value))&&(!month.value||p.date.slice(0,7)===month.value)&&(!year.value||p.year===year.value)&&words.every(w=>(p.title+' '+p.text+' '+p.categories.join(' ')).toLowerCase().includes(w)));
 results.replaceChildren();count.textContent=found.length+' '+(found.length===1?'entry':'entries');
 for(const p of found){let a=el('article',null,'post-card entry-preview'),ey=el('div',null,'eyebrow'),h=el('h2'),link=el('a',p.title);link.href=p.url;h.append(link);const date=el('time',p.displayDate);date.dateTime=p.date;ey.textContent=p.categories.join(' / ')||'Journal entry';let excerpt=el('p',p.text.slice(0,240)+(p.text.length>240?'…':'')),meta=el('div',null,'card-meta');let read=el('a','Read entry →','permalink');read.href=p.url;read.setAttribute('aria-label','Read entry: '+p.title);meta.append(date,read);a.append(ey,h);if(excerpt.textContent)a.append(excerpt);a.append(meta);results.append(a);}
 if(!found.length)results.append(el('p','No entries found. Try another search or show all entries.'));
 const filters=[];if(q.value.trim())filters.push('Search: '+q.value.trim());if(cat.value)filters.push('Category: '+cat.value);
 if(month.value){const parts=month.value.split('-').map(Number);filters.push(new Date(parts[0],parts[1]-1,1).toLocaleDateString('en-AU',{month:'long',year:'numeric'}));}else if(year.value)filters.push('Year: '+year.value);
 summary.textContent=filters.join(' · ');summary.hidden=!filters.length;clear.hidden=!filters.length;
 const u=new URL(location.href);for(const [key,value] of [['q',q.value],['category',cat.value],['year',year.value],['month',month.value]]){if(value)u.searchParams.set(key,value);else u.searchParams.delete(key);}try{history.replaceState(null,'',u);}catch(e){}
}
document.querySelector('#search-form').addEventListener('submit',e=>{e.preventDefault();render();});q.addEventListener('input',render);render();
})();
