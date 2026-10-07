'use strict';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const storage = {
 get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
 set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
};
const theme = storage.get('xsbook-theme', null);
if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.dataset.theme = 'dark';
$('.theme')?.addEventListener('click', () => {
 const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
 document.documentElement.dataset.theme = next;
 storage.set('xsbook-theme', next);
 updateThemeLabel();
});
function updateThemeLabel() { $('.theme')?.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? '라이트 모드 전환' : '다크 모드 전환'); }
updateThemeLabel();
const allowed = ['start','pipeline','frontend','prediction','rename','ooo','memory','cache','verification','reading'];
const rawRead = storage.get('xsbook-read', []);
let read = Array.isArray(rawRead) ? [...new Set(rawRead.filter(x => allowed.includes(x)))] : [];
function updateProgress() {
 if ($('#progress')) $('#progress').value = read.length;
 if ($('#progress-label')) $('#progress-label').textContent = `읽음 표시 ${read.length} / 10`;
 $$('.chapter-card').forEach(card => {
  const done = read.includes(card.dataset.chapter);
  card.classList.toggle('read', done);
  card.querySelector('.card-arrow').textContent = done ? '✓' : '↗';
 });
 const button = $('#mark-read');
 if (button) { const done = read.includes($('article').dataset.slug); button.textContent = done ? '읽음 표시됨 ✓ · 취소하기' : '이 장을 읽었어요 ✓'; button.classList.toggle('saved', done); button.setAttribute('aria-pressed', String(done)); }
}
$('#mark-read')?.addEventListener('click', () => {
 const slug = $('article').dataset.slug;
 read = read.includes(slug) ? read.filter(x => x !== slug) : [...read, slug];
 const saved = storage.set('xsbook-read', read);
 updateProgress();
 $('#save-status').textContent = saved ? '이 브라우저에 읽음 표시를 저장했습니다.' : '브라우저 저장 공간을 사용할 수 없어 현재 페이지에서만 표시합니다.';
});
$('#clear-progress')?.addEventListener('click', () => {read = [];storage.set('xsbook-read', read);updateProgress();});
updateProgress();
$('#search')?.addEventListener('input', event => {
 const query = event.target.value.trim().toLocaleLowerCase();
 let count = 0;
 $$('.chapter-card').forEach(card => { card.hidden = !card.dataset.search.toLocaleLowerCase().includes(query); if (!card.hidden) count++; });
 $('#no-results').hidden = count > 0;
 $('#search-result').textContent = query ? `${count}개 장을 찾았습니다.` : '';
});
$$('.quiz [data-option]').forEach(button => button.addEventListener('click', () => {
 const quiz = button.closest('.quiz');
 quiz.querySelectorAll('button').forEach(x => {x.classList.remove('correct', 'wrong');x.setAttribute('aria-pressed','false');});
 const correct = button.dataset.option === quiz.dataset.answer;
 button.classList.add(correct ? 'correct' : 'wrong');button.setAttribute('aria-pressed','true');
 quiz.querySelector('.quiz-feedback').textContent = correct ? `정답입니다. ${quiz.dataset.why}` : '다시 생각해 보세요. 본문의 핵심 정리에서 단서를 찾아보세요.';
}));
const root = $('#sim-root');
const sim = $('[data-sim]')?.dataset.sim;
if (sim === 'predictor') {
 let state = 1, total = 0, hits = 0;
 const labels = ['강한 Not taken', '약한 Not taken', '약한 Taken', '강한 Taken'];
 root.innerHTML = `<div class="counter-states">${labels.map((x,i)=>`<div data-state="${i}"><strong>${i.toString(2).padStart(2,'0')}</strong>${x}</div>`).join('')}</div><p id="prediction"></p><div class="sim-controls"><button id="taken">Taken 관찰 ↑</button><button id="not-taken">Not taken 관찰 ↓</button><button id="reset">초기화</button></div><div class="sim-result" id="result" role="status"></div><pre class="sim-log" id="log" aria-label="최근 관찰 기록"></pre>`;
 const draw = (message) => {$$('[data-state]').forEach(e=>{e.classList.toggle('active',+e.dataset.state===state);e.setAttribute('aria-current',String(+e.dataset.state===state));});$('#prediction').textContent = `다음 예측: ${state >= 2 ? 'Taken' : 'Not taken'} · ${labels[state]}`;$('#result').textContent = message + ` 관찰 ${total}회 / 적중 ${hits}회${total ? ` (${Math.round(hits/total*100)}%)` : ''}`;};
 const observe = (actual) => {const prediction = state >= 2;const prev = state;total++;if (prediction === actual) hits++;state = Math.max(0,Math.min(3,state + (actual?1:-1)));const message = `갱신 전 예측 ${prediction?'T':'N'} → 실제 ${actual?'T':'N'}: ${prediction===actual?'적중':'실패'}.`;$('#log').textContent = `${total}. ${message} 상태 ${prev} → ${state}\n` + $('#log').textContent.split('\n').slice(0,11).join('\n');draw(message);};
 $('#taken').onclick=()=>observe(true);$('#not-taken').onclick=()=>observe(false);
 $('#reset').onclick=()=>{state=1;total=0;hits=0;$('#log').textContent='';draw('약한 Not taken에서 시작합니다.');};draw('약한 Not taken에서 시작합니다.');
}
if (sim === 'rob') {
 let cycle = 0, committed = 0;
 const instructions = [{name:'I0 · LOAD',latency:4},{name:'I1 · ADD',latency:1},{name:'I2 · MUL',latency:2}];
 root.innerHTML = '<p>세 명령어는 서로 독립적이며 cycle 0에 모두 발행되었다고 가정합니다. 사이클 끝에 최대 1개를 커밋합니다. 메모리 지연은 예시값입니다.</p><div class="sim-controls"><button id="step">1사이클 진행 →</button><button id="reset">초기화</button></div><div class="sim-table"><table><thead><tr><th scope="col">프로그램 순서</th><th scope="col">실행 상태</th><th scope="col">커밋 상태</th></tr></thead><tbody id="rob-rows"></tbody></table></div><div class="sim-result" id="result" role="status"></div>';
 const draw=()=>{$('#rob-rows').innerHTML=instructions.map((x,i)=>`<tr><td>${x.name}</td><td>${cycle>=x.latency?'완료 ✓':`실행 중 (${x.latency-cycle}사이클 남음)`}</td><td>${i<committed?'커밋 ✓':cycle>=x.latency?'순서 대기':'완료 대기'}</td></tr>`).join('');$('#result').textContent=`Cycle ${cycle} · 완료 ${instructions.filter(x=>cycle>=x.latency).length}/3 · 커밋 ${committed}/3. ${committed===3?'모든 명령어가 프로그램 순서로 커밋되었습니다.':cycle>0&&cycle<4?'뒤의 연산이 완료되어도 선두 LOAD가 끝날 때까지 커밋을 기다립니다.':'완료 상태를 확인하고 선두부터 커밋합니다.'}`;$('#step').disabled=committed===3;};
 $('#step').onclick=()=>{cycle++;if(committed<3&&cycle>=instructions[committed].latency)committed++;draw();};$('#reset').onclick=()=>{cycle=0;committed=0;draw();};draw();
}
if (sim === 'cache') {
 let lines = [null,null,null,null], accesses=0,hits=0;
 root.innerHTML='<p>직접 사상 · 4라인 × 16바이트 = 64바이트 · 읽기만 수행 · 처음에는 비어 있습니다.</p><form class="sim-controls" id="access-form"><label for="address">바이트 주소 <input id="address" type="number" min="0" max="65535" step="1" value="0" required></label><button type="submit">읽기 →</button><button type="button" id="reset">초기화</button></form><div class="sim-controls"><button data-address="0">주소 0</button><button data-address="4">주소 4</button><button data-address="64">주소 64</button></div><div class="sim-table"><table><thead><tr><th scope="col">라인 인덱스</th><th scope="col">태그</th><th scope="col">저장된 주소 구간</th></tr></thead><tbody id="cache-rows"></tbody></table></div><div class="sim-result" id="result" role="status"></div>';
 const draw=(message)=>{$('#cache-rows').innerHTML=lines.map((b,i)=>`<tr><td>${i}</td><td>${b===null?'—':Math.floor(b/4)}</td><td>${b===null?'비어 있음':`${b*16}–${b*16+15}`}</td></tr>`).join('');$('#result').textContent=`${message} 접근 ${accesses}회 / 적중 ${hits}회 / 미스 ${accesses-hits}회.`;};
 const access=(address)=>{if(!Number.isInteger(address)||address<0||address>65535)return;const block=Math.floor(address/16),index=block%4,hit=lines[index]===block;accesses++;if(hit)hits++;lines[index]=block;draw(`주소 ${address} → 블록 ${block} → 인덱스 ${index}: ${hit?'HIT · 적중':'MISS · 미스'}.`);};
 $('#access-form').onsubmit=e=>{e.preventDefault();access(Number($('#address').value));};$$('[data-address]').forEach(b=>b.onclick=()=>{$('#address').value=b.dataset.address;access(+b.dataset.address);});
 $('#reset').onclick=()=>{lines=[null,null,null,null];accesses=0;hits=0;draw('캐시가 비어 있습니다.');};draw('주소 0, 4, 64 순서로 읽어 보세요.');
}
