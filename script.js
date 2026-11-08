const WORDS = "the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line".split(" ");
const $ = id => document.getElementById(id);
const el = {words:$('words'),hidden:$('hidden'),stage:$('stage'),msg:$('focusMsg'),time:$('sTime'),wpm:$('sWpm'),acc:$('sAcc'),prog:$('prog'),result:$('result'),foot:$('foot')};
let duration = 30, list = [], idx = 0, typed = [], cur = '', started = false, done = false;
let timer = null, startTs = 0, keys = 0, okKeys = 0, samples = [];

function store(get, key, val){
  try { if (get) return localStorage.getItem(key); localStorage.setItem(key, val); } catch(e){ return null; }
}
function newWords(){
  list = Array.from({length:260}, () => WORDS[Math.floor(Math.random()*WORDS.length)]);
}
function renderAll(){
  el.words.innerHTML = list.map((w,i) =>
    '<span class="w" data-i="'+i+'">'+[...w].map(c=>'<span class="l">'+c+'</span>').join('')+'</span>').join(' ');
  paint();
}
function paintWord(i){
  const w = el.words.children[i]; if(!w) return;
  const target = list[i];
  const t = i < idx ? typed[i] : (i === idx ? cur : '');
  let html = '';
  for (let k=0;k<target.length;k++){
    let cls = 'l';
    if (k < t.length) cls += t[k] === target[k] ? ' ok' : ' bad';
    if (i === idx && !done && k === t.length) cls += ' cur';
    html += '<span class="'+cls+'">'+target[k]+'</span>';
  }
  for (let k=target.length;k<t.length;k++) html += '<span class="l extra">'+t[k]+'</span>';
  if (i === idx && !done && t.length >= target.length) html = html.replace(/(<span class="l[^"]*)("[^>]*>[^<]*<\/span>)$/, '$1 cur-end$2');
  w.innerHTML = html;
  w.classList.toggle('miss', i < idx && typed[i] !== target);
}
function paint(){
  paintWord(idx); if (idx>0) paintWord(idx-1);
  const w = el.words.children[idx];
  if (w) el.words.scrollTop = Math.max(0, w.offsetTop - el.words.offsetTop - 33);
}
function stats(){
  let correct = 0, wrong = 0;
  for (let i=0;i<idx;i++){
    const t = typed[i], g = list[i];
    for (let k=0;k<t.length;k++) (t[k]===g[k]) ? correct++ : wrong++;
    if (t.length < g.length) wrong += g.length - t.length;
    if (t === g) correct++; // the space after a correct word
  }
  for (let k=0;k<cur.length;k++) (cur[k]===list[idx][k]) ? correct++ : wrong++;
  return {correct, wrong};
}
function wpmNow(){
  const m = Math.max((Date.now()-startTs)/60000, 1/600);
  let c = 0;
  for (let i=0;i<idx;i++) if (typed[i]===list[i]) c += list[i].length+1;
  for (let k=0;k<cur.length;k++) if (cur[k]===list[idx][k]) c++;
  return Math.round(c/5/m);
}
function accNow(){ return keys ? Math.round(okKeys/keys*100) : 100; }
function tick(){
  const elapsed = (Date.now()-startTs)/1000;
  const left = Math.max(0, Math.ceil(duration - elapsed));
  el.time.textContent = left;
  el.prog.style.width = Math.min(100, elapsed/duration*100)+'%';
  el.wpm.textContent = wpmNow();
  el.acc.textContent = accNow()+'%';
  const sec = Math.floor(elapsed);
  if (sec > samples.length && sec <= duration) samples.push(wpmNow());
  if (elapsed >= duration) finish();
}
function start(){
  started = true; startTs = Date.now();
  timer = setInterval(tick, 200);
}
function finish(){
  if (done) return;
  done = true; clearInterval(timer);
  const {correct, wrong} = stats();
  const wpm = Math.round(correct/5/(duration/60));
  const raw = Math.round((correct+wrong)/5/(duration/60));
  $('rWpm').textContent = wpm;
  $('rAcc').textContent = accNow();
  $('rCorrect').textContent = correct;
  $('rWrong').textContent = wrong;
  $('rRaw').textContent = raw;
  let wc = 0; for (let i=0;i<idx;i++) if (typed[i]===list[i]) wc++;
  $('rWords').textContent = wc;
  const key = 'typewise-best-'+duration;
  const prev = parseInt(store(true,key),10);
  const isBest = !prev || wpm > prev;
  if (isBest) store(false,key,String(wpm));
  $('rBest').innerHTML = isBest
    ? 'New personal best for '+label()+'.<span class="tag">Best</span>'
    : 'Your best for '+label()+' is '+prev+' WPM.';
  drawChart();
  el.stage.style.display = 'none'; el.foot.style.display = 'none';
  el.result.style.display = 'block';
  el.hidden.blur();
  $('again').focus();
}
function label(){ return duration===120 ? '2 minutes' : duration+' seconds'; }
function drawChart(){
  const s = samples.length > 1 ? samples : [0, parseInt($('rWpm').textContent,10)];
  const W = 900, H = 170, pad = 28, max = Math.max(10, ...s) * 1.15;
  const x = i => pad + i/(s.length-1)*(W-pad*2);
  const y = v => H-pad - v/max*(H-pad*2);
  const pts = s.map((v,i)=>x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
  let g = '';
  for (let k=0;k<=3;k++){
    const v = max*k/3, yy = y(v);
    g += '<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+yy+'" y2="'+yy+'" stroke="var(--line)"/><text x="0" y="'+(yy+4)+'" font-size="11" fill="var(--muted)">'+Math.round(v)+'</text>';
  }
  const c = $('chart'); c.setAttribute('viewBox','0 0 '+W+' '+H);
  c.innerHTML = g + '<polyline points="'+pts+'" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<text x="'+pad+'" y="'+(H-4)+'" font-size="11" fill="var(--muted)">0s</text><text x="'+(W-pad)+'" y="'+(H-4)+'" font-size="11" text-anchor="end" fill="var(--muted)">'+duration+'s</text>';
}
function reset(){
  clearInterval(timer);
  idx = 0; typed = []; cur = ''; started = false; done = false; keys = 0; okKeys = 0; samples = [];
  newWords();
  el.words.scrollTop = 0; el.hidden.value = '';
  el.time.textContent = duration; el.wpm.textContent = 0; el.acc.textContent = '100%'; el.prog.style.width = '0';
  el.result.style.display = 'none'; el.stage.style.display = ''; el.foot.style.display = '';
  renderAll();
  const best = parseInt(store(true,'typewise-best-'+duration),10);
  el.foot.firstElementChild.nextElementSibling.textContent = best ? 'Best for '+label()+': '+best+' WPM' : 'The timer starts when you type your first letter';
}
function focusTest(){ el.hidden.focus(); }

el.hidden.addEventListener('focus', () => { el.words.classList.remove('blur'); el.msg.style.display = 'none'; });
el.hidden.addEventListener('blur', () => { if (!done){ el.words.classList.add('blur'); el.msg.style.display = 'grid'; } });
el.stage.addEventListener('click', focusTest);
el.stage.addEventListener('keydown', e => { if (e.target === el.stage && e.key.length === 1) focusTest(); });
el.hidden.addEventListener('input', e => {
  if (done) return;
  if (!started) start();
  let v = el.hidden.value;
  if (e.inputType && e.inputType.startsWith('insert') && e.data && e.data !== ' '){
    keys++;
    if (e.data === list[idx][cur.length]) okKeys++;
  }
  if (v.includes(' ')){
    const word = v.replace(/\s+/g,'');
    if (word.length){
      typed[idx] = word; cur = ''; idx++; el.hidden.value = '';
      paint(); paintWord(idx);
      return;
    }
    v = ''; el.hidden.value = '';
  }
  cur = v.slice(0, list[idx].length + 8);
  if (cur !== v) el.hidden.value = cur;
  paintWord(idx);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Tab'){ e.preventDefault(); reset(); focusTest(); return; }
  if (e.key === 'Escape'){ reset(); return; }
  if (!done && document.activeElement !== el.hidden && e.key.length === 1 && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'BUTTON'){ focusTest(); }
});
$('dur').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  duration = parseInt(b.dataset.t,10);
  [...$('dur').children].forEach(x => x.setAttribute('aria-pressed', x===b));
  reset(); focusTest();
});
$('again').addEventListener('click', () => { reset(); focusTest(); });
$('theme').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
});
reset();
