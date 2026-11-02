(function(){
const SETS=(window.PSAT_SETS||[]).sort((a,b)=>a.id-b.id);
const K='psatVocab.v1',app=document.getElementById('app'),bar=document.getElementById('bar'),crumb=document.getElementById('crumb');
const blank=()=>({history:[],words:{},completed:{}});
let S;try{S=JSON.parse(localStorage.getItem(K))||blank()}catch(e){S=blank()}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const ALL={};SETS.forEach(s=>s.words.forEach(w=>{ALL[w.w]=w}));
const hl=(t,w)=>esc(t).replace(new RegExp('\\b('+w.slice(0,Math.max(4,w.length-2))+'\\w*)','ig'),'<b>$1</b>');
const setP=p=>bar.style.width=(p*100)+'%';
let sess=null;
function home(){sess=null;setP(0);crumb.textContent='';
 const ws=Object.values(S.words),seen=ws.length,tot=Object.keys(ALL).length,done=Object.keys(S.completed).length;
 const acc=ws.reduce((a,w)=>a+w.correct,0),att=ws.reduce((a,w)=>a+w.correct+w.wrong,0);
 const weak=Object.entries(S.words).filter(([k,v])=>v.wrong>0&&ALL[k]).sort((a,b)=>(b[1].wrong-b[1].correct/2)-(a[1].wrong-a[1].correct/2)).slice(0,10).map(e=>e[0]);
 const rec=S.history.slice(-5).reverse();
 app.innerHTML=`<div class="card"><h1>Hi! Ready to learn?</h1><p class="mut">10 words, then a 20-question PSAT-style quiz.</p>
 <div class="stats"><div class="stat"><b>${seen}/${tot}</b><span>words seen</span></div><div class="stat"><b>${done}/${SETS.length}</b><span>sets done</span></div><div class="stat"><b>${att?Math.round(acc*100/att):0}%</b><span>accuracy</span></div></div>
 <div class="btns col"><button class="btn" id="go">${done<SETS.length?'Start next set':'Practice again'}</button>
 ${weak.length?`<button class="btn sec" id="weak">Review weak words (${weak.length})</button>`:''}</div></div>
 <h2>Sets</h2>${['High priority','PrepScholar','More words'].map((t,ti)=>{const g=SETS.filter(s=>(s.tier||'More words')===t);if(!g.length)return '';const dn=g.filter(s=>S.completed[s.id]).length;const open=g.some(s=>!S.completed[s.id])&&!SETS.filter(s=>(s.tier||'More words')!==t&&SETS.indexOf(s)<SETS.indexOf(g[0])).some(s=>!S.completed[s.id]);return `<details class="tier" ${open?'open':''}><summary><span>${t}</span><small>${dn}/${g.length} sets · ${g.reduce((a,s)=>a+s.words.length,0)} words</small></summary><div class="sets">${g.map(s=>`<button class="set ${S.completed[s.id]?'done':''}" data-id="${s.id}">${s.id}<small>${S.completed[s.id]?'Best '+S.completed[s.id].best:'New'}</small></button>`).join('')}</div></details>`}).join('')}
 <h2>Recent scores</h2>${rec.length?`<ul class="list card">${rec.map(h=>`<li><span>${esc(h.set)} <span class="mut">· ${new Date(h.date).toLocaleDateString()}</span></span><b>${h.score}/${h.total}</b></li>`).join('')}</ul>`:'<p class="mut">No quizzes yet.</p>'}
 <div class="btns"><button class="btn dan" id="reset">Reset progress</button></div>`;
 app.querySelector('#go').onclick=()=>{const n=SETS.find(s=>!S.completed[s.id])||SETS[0];start(n.words,n.title,n.id)};
 const wb=app.querySelector('#weak');if(wb)wb.onclick=()=>start(weak.map(w=>ALL[w]),'Weak words',null);
 app.querySelectorAll('.set').forEach(b=>b.onclick=()=>{const s=SETS.find(x=>x.id==b.dataset.id);start(s.words,s.title,s.id)});
 app.querySelector('#reset').onclick=()=>{if(confirm('Erase all progress, scores and stats? This cannot be undone.')){S=blank();save();home()}};
}
function start(words,title,id){
 const qs=shuf(words.flatMap(w=>w.q.map(q=>{const o=shuf(q.c.map((c,i)=>({c,ok:i===q.a})));return{...q,form:q.word||w.w,word:w.w,opts:o}})));
 sess={words,title,id,i:0,qs,qi:0,score:0,missed:[]};learn();window.scrollTo(0,0)}
function learn(){const {words,i}=sess,w=words[i];crumb.textContent=`${sess.title} · Learn ${i+1} of ${words.length}`;setP((i+1)/(words.length+sess.qs.length));
 app.innerHTML=`<div class="card"><p class="word">${esc(w.w)}</p><span class="pos">${esc(w.pos)}</span><p class="def">${esc(w.def)}</p>
 <ol class="ex">${w.ex.map(e=>`<li>${hl(e,w.w)}</li>`).join('')}</ol>
 <div class="btns"><button class="btn sec" id="back" ${i?'':'disabled'}>Back</button><button class="btn" id="next">${i<words.length-1?'Next':'Start quiz'}</button></div></div>`;
 app.querySelector('#back').onclick=()=>{sess.i--;learn()};
 app.querySelector('#next').onclick=()=>{if(i<words.length-1){sess.i++;learn()}else quiz();window.scrollTo(0,0)}}
function quiz(){const q=sess.qs[sess.qi],n=sess.qs.length;crumb.textContent=`${sess.title} · Question ${sess.qi+1} of ${n}`;setP((sess.words.length+sess.qi+1)/(sess.words.length+n));
 const prompt=q.t==='fill'?'Which choice completes the text with the most logical and precise word?':`As used in the text, what does “${esc(q.form)}” most nearly mean?`;
 const passage=q.t==='fill'?esc(q.p).replace('______','<b>______</b>'):hl(q.p,q.form);
 app.innerHTML=`<div class="card"><div class="passage">${passage}</div><p class="prompt">${q.t==='fill'?prompt:prompt}</p>
 <div id="chs">${q.opts.map((o,k)=>`<button class="ch" data-k="${k}"><span class="l">${'ABCD'[k]}</span><span>${esc(o.c)}</span></button>`).join('')}</div><div id="fb"></div></div>`;
 app.querySelectorAll('.ch').forEach(b=>b.onclick=()=>answer(+b.dataset.k))}
function answer(k){const q=sess.qs[sess.qi],ok=q.opts[k].ok,bs=app.querySelectorAll('.ch');
 bs.forEach((b,j)=>{b.disabled=true;if(q.opts[j].ok)b.classList.add('ok');else if(j===k)b.classList.add('bad')});
 const st=S.words[q.word]||(S.words[q.word]={seen:0,correct:0,wrong:0,last:null});st.seen++;st.last=new Date().toISOString();ok?st.correct++:st.wrong++;
 if(ok)sess.score++;else if(!sess.missed.includes(q.word))sess.missed.push(q.word);save();
 const ci=q.opts.findIndex(o=>o.ok),last=sess.qi===sess.qs.length-1;
 document.getElementById('fb').innerHTML=`<div class="fb ${ok?'ok':'bad'}"><strong>${ok?'✓ Correct!':'✗ Not quite — the answer is '+'ABCD'[ci]+') '+esc(q.opts[ci].c)}</strong>${esc(q.e)}</div>
 <div class="btns"><button class="btn" id="nx">${last?'See results':'Next'}</button></div>`;
 const nx=document.getElementById('nx');nx.focus({preventScroll:true});nx.scrollIntoView({behavior:'smooth',block:'nearest'});
 nx.onclick=()=>{if(last)end();else{sess.qi++;quiz()}window.scrollTo(0,0)}}
function end(){const {score,qs,missed,title,id}=sess;setP(1);crumb.textContent=title+' · Results';
 S.history.push({date:new Date().toISOString(),set:title,score,total:qs.length});
 if(id!=null){const c=S.completed[id];S.completed[id]={best:Math.max(score,c?c.best:0),date:new Date().toISOString()}}save();
 const msg=score===qs.length?'Perfect! 🎉':score>=16?'Great work!':score>=12?'Good effort — keep going.':'Review and try again.';
 const nextSet=id!=null?SETS.find(s=>s.id>id):SETS.find(s=>!S.completed[s.id]);
 app.innerHTML=`<div class="card"><p class="mut" style="text-align:center;margin:0">${esc(title)}</p><p class="big">${score}/${qs.length}</p><p style="text-align:center;font-weight:700">${msg}</p>
 <h2>Missed words</h2>${missed.length?`<div class="chips">${missed.map(w=>`<span class="chip">${esc(w)}</span>`).join('')}</div>`:'<p class="mut">None — you got every question right!</p>'}
 <div class="btns col">${missed.length?'<button class="btn" id="rm">Retry missed words</button>':''}${nextSet?'<button class="btn '+(missed.length?'sec':'')+'" id="ns">Next set</button>':''}<button class="btn sec" id="hm">Home</button></div></div>`;
 const rm=app.querySelector('#rm');if(rm)rm.onclick=()=>start(missed.map(w=>ALL[w]),'Retry missed',null);
 const ns=app.querySelector('#ns');if(ns)ns.onclick=()=>start(nextSet.words,nextSet.title,nextSet.id);
 app.querySelector('#hm').onclick=home}
document.getElementById('homeBtn').onclick=()=>{if(!sess||confirm('Leave this session? Answers so far are saved.'))home()};
// testing hook
window.__psat={answer,state:()=>sess,home};
home();
})();
