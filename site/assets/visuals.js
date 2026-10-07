/* Original educational visualizations. Values are teaching-model assumptions. */
(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const controllers = [];
 function player(button, advance, finished, delay, element) {
  let timer = null;
  const stop = () => { clearTimeout(timer); timer = null; button.textContent = '▶ 재생'; button.setAttribute('aria-pressed','false'); };
  const tick = () => { advance(); if (finished()) stop(); else timer = setTimeout(tick,delay()); };
  button.onclick = () => {if (timer !== null) { stop(); return; } if (finished()) return; button.textContent='Ⅱ 일시정지';button.setAttribute('aria-pressed','true');timer=setTimeout(tick,delay());};
  button.setAttribute('aria-pressed','false');
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(element);
  controllers.push(stop);
  return stop;
 }
 window.addEventListener('pagehide',()=>controllers.forEach(stop=>stop()));
 document.querySelectorAll('.storyboard').forEach(panel => {
  const data=JSON.parse(panel.querySelector('.story-data').textContent);
  const q=s=>panel.querySelector(s);
  let frame=0;
  const draw=()=>{
   const [caption,active,values]=data.frames[frame];
   panel.querySelectorAll('.story-node').forEach((node,i)=>{node.classList.toggle('is-active',i===active);node.setAttribute('aria-current',String(i===active));node.querySelector('strong').textContent=values[i];});
   q('.story-track span').style.left=`${active/3*100}%`;
   q('[data-frame]').textContent=`${frame+1} / ${data.frames.length}`;
   q('[data-scrub]').value=frame;
   q('.visual-caption').textContent=caption;
   q('[data-next]').disabled=frame===data.frames.length-1;
  };
  const next=()=>{frame=Math.min(frame+1,data.frames.length-1);draw();};
  const stop=player(q('[data-play]'),next,()=>frame===data.frames.length-1,()=>Number(q('[data-speed]').value),panel);
  q('[data-next]').onclick=()=>{stop();next();};
  q('[data-reset]').onclick=()=>{stop();frame=0;draw();};
  q('[data-scrub]').oninput=e=>{stop();frame=Number(e.target.value);draw();};
  draw();
 });
 const pipe=document.querySelector('[data-pipeline]');
 if(pipe) {
  const q=s=>pipe.querySelector(s);
  let count=4,cycle=0,mode='pipe';
  const stages=['F','D','I','E','C'];
  const start=i=>mode==='pipe'?i:i*5;
  const total=()=>mode==='pipe'?count+4:count*5;
  const draw=()=>{
   q('#pipe-lanes').querySelectorAll('.instruction-token').forEach((token,i)=>{
    const stage=cycle-start(i)-1;
    token.style.left=`${Math.max(0,Math.min(4,stage))*20}%`;
    token.className=`instruction-token instruction-${i%4} ${stage<0?'not-started':stage>4?'retired':''}`;
    token.textContent=stage>4?`I${i} ✓`:`I${i} · ${stage<0?'대기':stages[stage]}`;
   });
   q('#pipe-timeline').querySelectorAll('[data-time]').forEach(cell=>{
    const t=Number(cell.dataset.time);cell.classList.toggle('future',t>cycle);cell.classList.toggle('now',t===cycle);
   });
   const done=Array.from({length:count},(_,i)=>cycle>=start(i)+5).filter(Boolean).length;
   q('#pipe-cycle').textContent=`${cycle} / ${total()}`;q('#pipe-done').textContent=`${done} / ${count}`;
   q('#pipe-ipc').textContent=(count/total()).toFixed(2);
   q('#pipe-step').disabled=cycle===total();
   q('#pipe-caption').textContent=cycle===0?`시작 전입니다. 이 모형에서 ${count}개 명령어는 ${mode==='pipe'?'겹쳐 처리하면':'한 개씩 처리하면'} ${total()}사이클이 걸립니다. 재생이나 1사이클 버튼을 눌러 보세요.`:cycle===total()?`모두 완료했습니다. 한 명령어의 지연은 여전히 5사이클입니다. ${mode==='pipe'?'겹침으로 전체 처리 시간을 줄였습니다.':'파이프라인으로 바꾸어 전체 시간을 비교해 보세요.'}`:`사이클 ${cycle}: ${done}개 커밋 완료. 각 행은 같은 명령어의 진행을 나타냅니다. ${mode==='pipe'?'서로 다른 명령어가 다른 단계에서 동시에 진행합니다.':'현재 명령어를 끝낸 뒤 다음 명령어를 시작합니다.'}`;
  };
  const setup=()=>{
   count=Number(q('#pipe-count').value);mode=q('#pipe-mode').value;cycle=0;q('#pipe-count-value').textContent=count;
   q('#pipe-lanes').innerHTML=Array.from({length:count},(_,i)=>`<div class="instruction-lane"><span class="instruction-token instruction-${i%4}">I${i}</span></div>`).join('');
   q('#pipe-timeline').style.setProperty('--cycles',total());
   q('#pipe-timeline').innerHTML='<span class="time-label">명령 / C</span>'+Array.from({length:total()},(_,i)=>`<span class="time-label" data-time="${i+1}">${i+1}</span>`).join('')+Array.from({length:count},(_,i)=>`<span class="time-label">I${i}</span>`+Array.from({length:total()},(_,t)=>{const s=t-start(i);return `<span class="time-cell ${s>=0&&s<5?'stage-'+s:''}" data-time="${t+1}">${s>=0&&s<5?stages[s]:''}</span>`;}).join('')).join('');draw();
  };
  const advance=()=>{cycle=Math.min(cycle+1,total());draw();};
  const stop=player(q('#pipe-play'),advance,()=>cycle===total(),()=>Number(q('#pipe-speed').value),pipe);
  q('#pipe-step').onclick=()=>{stop();advance();};q('#pipe-reset').onclick=()=>{stop();setup();};
  q('#pipe-mode').onchange=q('#pipe-count').oninput=()=>{stop();setup();};
  setup();
 }
 const root=document.querySelector('#sim-root');
 if(!root || !root.visualState)return;
 const kind=root.visualState.kind;
 const visual=document.createElement('div');visual.className='experiment-visual';
 root.prepend(visual);
 const q=s=>visual.querySelector(s);
 if(kind==='predictor') {
  visual.innerHTML='<h3>예측 상태의 이동과 관찰 이력</h3><div class="prediction-rail" aria-hidden="true"><span class="state-cursor">현재 상태</span></div><div class="rail-labels"><span>00<br>강한 N</span><span>01<br>약한 N</span><span>10<br>약한 T</span><span>11<br>강한 T</span></div><p class="visual-hint">T 관찰 → 오른쪽, N 관찰 → 왼쪽. 양 끝에서는 더 이동하지 않습니다.</p><div class="visual-controls"><label>결과 패턴 <select id="branch-pattern"><option value="loop">반복문: T T T T N</option><option value="alternate">교대: T N T N</option><option value="taken">항상 T</option></select></label><button id="branch-play">▶ 재생</button><button id="branch-next">패턴 1회 →</button></div><div class="history-strip" id="branch-history" aria-label="최근 실제 결과와 예측 적중 여부"></div><div class="accuracy-bar"><span></span></div><p class="visual-hint" id="accuracy-caption"></p>';
  let history=[],position=0;
  const sequence=()=>q('#branch-pattern').value==='loop'?[true,true,true,true,false]:q('#branch-pattern').value==='alternate'?[true,false]:[true];
  const next=()=>{const a=sequence();document.querySelector(a[position%a.length]?'#taken':'#not-taken').click();position++;};
  const stop=player(q('#branch-play'),next,()=>position>=20,()=>850,visual);
  q('#branch-next').onclick=()=>{stop();next();};
  q('#branch-pattern').onchange=()=>{stop();position=0;document.querySelector('#reset').click();};
  const draw=s=>{
   if(s.total===0){stop();history=[];position=0;}
   else {const match=s.message.match(/실제 ([TN])/);history.push({actual:match?match[1]:'?',hit:s.message.includes('적중')});history=history.slice(-16);}
   q('.state-cursor').style.left=`${s.state*25}%`;
   q('#branch-history').innerHTML=history.length?history.map((v,i)=>`<span class="history-item ${v.hit?'hit':'miss'}" title="${s.total-history.length+i+1}번째 관찰: ${v.hit?'적중':'실패'}">${v.actual}<small>${v.hit?'✓':'✕'}</small></span>`).join(''):'<span class="visual-hint">아래 T/N 버튼을 누르거나 패턴을 재생해 보세요.</span>';
   q('.accuracy-bar span').style.width=`${s.total?s.hits/s.total*100:0}%`;
   q('#accuracy-caption').textContent=`예측 적중 ${s.hits} / ${s.total} · 막대는 누적 적중률, 위 칸은 최근 16개 관찰입니다. 자동 재생은 패턴 20회 후 멈춥니다.`;
  };
  root.addEventListener('visualchange',e=>draw(e.detail));draw(root.visualState);
 }
 if(kind==='rob') {
  visual.innerHTML='<h3>완료와 커밋을 나란히 보기</h3><div class="rob-legend"><span class="key-running">실행</span><span class="key-waiting">완료 후 대기</span><span class="key-commit">커밋</span></div><div class="timeline-scroll" tabindex="0" role="region" aria-label="비순차 실행 시간표"><div id="rob-timeline"></div></div><div class="rob-slots" id="rob-slots"></div><div class="visual-controls"><button id="rob-play">▶ 재생</button><label>속도 <select id="rob-speed"><option value="1500">느리게</option><option value="900" selected>보통</option></select></label></div><p class="visual-hint">채워진 칸은 지금까지의 진행입니다. 미래 칸은 흐리게 표시합니다. 대기 중인 완료 결과도 ROB의 선두를 건너뛰어 커밋하지 않습니다.</p>';
  const stop=player(q('#rob-play'),()=>document.querySelector('#step').click(),()=>root.visualState.committed===3,()=>Number(q('#rob-speed').value),visual);
  const draw=s=>{
   if(s.cycle===0)stop();
   q('#rob-timeline').innerHTML='<span class="time-label">명령 / C</span>'+Array.from({length:6},(_,i)=>`<span class="time-label">${i+1}</span>`).join('')+s.instructions.map((x,i)=>`<span class="time-label">${x.name}</span>`+Array.from({length:6},(_,t)=>{const c=t+1,commitAt=4+i;const state=c===commitAt?'commit':c<commitAt&&c>=x.latency?'waiting':c<x.latency?'running':'empty';return `<span class="rob-cell ${state} ${c>s.cycle?'future':''}">${state==='commit'?'✓':state==='waiting'?'대기':state==='running'?'실행':''}</span>`;}).join('')).join('');
   q('#rob-slots').innerHTML=s.instructions.map((x,i)=>`<div class="rob-slot ${i<s.committed?'is-committed':i===s.committed?'is-head':''}"><small>${i===s.committed?'HEAD → ':''}I${i}</small><strong>${i<s.committed?'커밋 ✓':s.cycle>=x.latency?'완료 · 대기':'실행 중'}</strong></div>`).join('');
  };
  document.querySelector('#step').addEventListener('click',()=>{if(root.visualState.committed===3)stop();});
  root.addEventListener('visualchange',e=>draw(e.detail));draw(root.visualState);
 }
 if(kind==='cache') {
  visual.innerHTML='<h3>주소의 어느 비트가 라인을 고를까요?</h3><div class="address-bits"><div><small>태그 · 상위 10비트</small><strong id="cache-tag">0000000000</strong></div><div><small>인덱스 · 2비트</small><strong id="cache-index">00</strong></div><div><small>오프셋 · 4비트</small><strong id="cache-offset">0000</strong></div></div><div class="cache-route"><span class="route-cpu">CPU 요청</span><span class="route-arrow">→</span><span class="route-cache">캐시 확인</span><span class="route-arrow">→</span><span class="route-memory">메모리</span><i class="transfer-dot" aria-hidden="true"></i></div><div class="cache-bank" id="cache-bank"></div><div class="visual-controls"><label>주소 패턴 <select id="cache-pattern"><option value="local">같은 블록: 0, 4, 8, 12</option><option value="conflict">충돌: 0, 64, 0, 64</option><option value="stream">순차 블록: 0, 16, 32, 48</option></select></label><button id="cache-play">▶ 재생</button><button id="cache-next">패턴 1회 →</button></div><p class="visual-caption" id="cache-caption" role="status">주소를 읽으면 해당 라인과 주소 비트를 함께 강조합니다.</p>';
  let position=0,transfer=null;
  const patterns={local:[0,4,8,12],conflict:[0,64,0,64],stream:[0,16,32,48]};
  const next=()=>{const seq=patterns[q('#cache-pattern').value];document.querySelector('#address').value=seq[position%seq.length];document.querySelector('#access-form').requestSubmit();position++;};
  const stop=player(q('#cache-play'),next,()=>position>=12,()=>1100,visual);
  q('#cache-next').onclick=()=>{stop();next();};q('#cache-pattern').onchange=()=>{stop();position=0;document.querySelector('#reset').click();};
  const draw=s=>{
   if(!s.access){stop();position=0;}
   const a=s.access,address=a?.address??0;
   q('#cache-tag').textContent=(address>>6).toString(2).padStart(10,'0');q('#cache-index').textContent=((address>>4)&3).toString(2).padStart(2,'0');q('#cache-offset').textContent=(address&15).toString(2).padStart(4,'0');
   q('#cache-bank').innerHTML=s.lines.map((block,i)=>`<div class="cache-line ${a?.index===i?(a.hit?'hit':'miss'):''}"><small>라인 ${i} · ${i.toString(2).padStart(2,'0')}</small><strong>${block===null?'비어 있음':`${block*16}–${block*16+15}`}</strong><span>${block===null?'valid = 0':`태그 ${Math.floor(block/4)} · valid = 1`}</span><div class="byte-cells">${Array.from({length:16},(_,j)=>`<i class="${a?.index===i&&(address&15)===j?'selected':''}"></i>`).join('')}</div></div>`).join('');
   q('.route-memory').classList.toggle('bypassed',!a||a.hit);
   q('#cache-caption').textContent=!a?'주소를 읽으면 해당 라인과 주소 비트를 함께 강조합니다.':a.hit?`HIT: 라인 ${a.index}의 태그가 일치합니다. 메모리를 읽지 않고 오프셋 ${address&15}의 바이트를 선택합니다.`:`MISS: 라인 ${a.index}에 ${a.block*16}–${a.block*16+15} 블록을 채웁니다. ${a.previous!==null?`이전 블록 ${a.previous*16}–${a.previous*16+15}를 교체합니다.`:'비어 있던 라인을 사용합니다.'} 자동 재생은 12회 후 멈춥니다.`;
   if(transfer)transfer.cancel();
   if(a&&!reduced.matches)transfer=q('.transfer-dot').animate([{left:'4%',opacity:1},{left:a.hit?'48%':'91%',opacity:1},{left:'4%',opacity:0}],{duration:850,easing:'ease-in-out'});
  };
  root.addEventListener('visualchange',e=>draw(e.detail));draw(root.visualState);
 }
})();
