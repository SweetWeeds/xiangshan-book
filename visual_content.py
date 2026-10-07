"""Original, simplified teaching storyboards; frames are logical steps, not cycles."""
from html import escape
import json
STORIES = {
 'start': dict(title='같은 명령어, 다른 내부 설계',hint='칩을 보기 전에 ISA와 구현의 경계를 먼저 찾아보세요.',nodes=['프로그램','RISC-V ISA','XiangShan 코어','프로그램 결과'],frames=[
 ('프로그램이 계산을 요청합니다.',0,['ADD x3, x1, x2','명령어의 약속','구현은 아직 선택 전','결과 대기']),
 ('ISA는 ADD의 의미를 정합니다. x1과 x2의 합을 x3에 기록합니다.',1,['x1 = 7, x2 = 5','x3 ← x1 + x2','어떻게 실행할까?','결과 대기']),
 ('XiangShan은 예측·스케줄링·연산 회로로 그 약속을 구현합니다.',2,['입력 7, 5','ADD의 의미 유지','내부에서 연산 수행','결과 대기']),
 ('내부 구조가 달라도 소프트웨어가 관찰하는 ADD 결과는 같아야 합니다.',3,['입력 7, 5','ISA 계약 충족','올바르게 커밋','x3 = 12'])]),
 'frontend': dict(title='예측한 경로가 틀렸다면?',hint='다음 단계를 눌러 잘못된 경로의 작업이 폐기되는 순간을 찾아보세요.',nodes=['BPU','FTQ / Fetch','백엔드','복구'],frames=[
 ('분기 B의 목적지를 0x200으로 예측합니다.',0,['B → 0x200 예측','대기','B의 실제 결과 미정','정상']),
 ('예측 경로의 명령어 W0, W1을 가져옵니다. 아직 확정된 실행이 아닙니다.',1,['0x200 경로','W0 · W1 가져옴','분기 B 실행 중','정상']),
 ('실행 결과, 분기 B의 올바른 다음 주소는 0x104입니다.',2,['예측 실패','W0 · W1 잘못된 경로','B → 0x104 확인','리다이렉트 요청']),
 ('잘못된 경로의 더 젊은 작업을 폐기하고 필요한 상태를 복구합니다.',3,['새 주소 수신','W0 · W1 폐기 ✕','B 이후 상태 복구','0x104로 재시작']),
 ('올바른 경로의 C0, C1을 새로 가져옵니다. 단계 번호는 실제 회복 사이클 수가 아닙니다.',1,['0x104 경로','C0 · C1 가져옴','올바른 작업 실행','복구 완료 ✓'])]),
 'rename': dict(title='x1의 두 버전을 눈으로 따라가기',hint='I1이 읽는 물리 레지스터가 I2 때문에 바뀌는지 확인하세요.',nodes=['명령어','매핑 x1','매핑 x2','물리 레지스터'],frames=[
 ('처음에는 x1이 p1을 가리킵니다. 물리 레지스터 번호는 예시입니다.',1,['아직 rename 전','x1 → p1','x2 → p2','p1: 이전 x1']),
 ('I0: ADD x1, x4, x5가 새 목적지 p8을 할당받습니다.',1,['I0: 목적지 p8','x1 → p8','x2 → p2','p8: I0가 만들 값']),
 ('I1: ADD x2, x1, x6는 현재 x1의 버전 p8을 입력으로 기억합니다.',2,['I1: 입력 p8, 목적지 p9','x1 → p8','x2 → p9','I1은 p8 준비를 기다림']),
 ('I2: ADD x1, x7, x8은 x1의 새 버전 p10을 만듭니다.',1,['I2: 목적지 p10','x1 → p10','x2 → p9','p8과 p10은 별개']),
 ('I1의 입력은 여전히 p8입니다. 이름 재사용은 분리되지만 I0 → I1의 RAW 의존성은 남습니다.',3,['I1: 입력 p8 유지','현재 x1 → p10','x2 → p9','I0 → p8 → I1'])]),
 'memory': dict(title='캐시에 쓰기 전, Store에서 Load로',hint='같은 주소의 앞선 Store가 아직 캐시에 반영되지 않았을 때를 관찰하세요.',nodes=['Store Queue','주소 비교','뒤의 Load','D-cache'],frames=[
 ('이 예제에서 주소 A의 캐시 값은 7입니다. 앞선 Store S0는 A에 42를 쓸 예정입니다.',0,['S0: [A] ← 42','대기','L1: [A] 읽기 대기','[A] = 7']),
 ('S0의 주소와 데이터가 준비되었습니다. 아직 캐시는 갱신되지 않았습니다.',0,['주소 A · 값 42 준비','대기','L1: 주소 A 준비','[A] = 7']),
 ('L1보다 앞선 Store 중 주소가 겹치는 올바른 전달 대상을 확인합니다.',1,['S0: A / 42','A = A · 전달 가능','S0의 데이터를 선택','이전 값 7']),
 ('조건이 충족되어 Store의 값 42를 Load에 전달합니다. 이전 캐시 값 7을 선택하면 안 됩니다.',2,['S0 → 42 전달','순서·주소 일치','L1 결과 = 42 ✓','이전 값 7']),
 ('Store는 이후 커밋과 쓰기 처리를 거쳐 캐시에 반영됩니다. 실제 큐·병합·충돌 처리는 생략한 모형입니다.',3,['S0 쓰기 처리 완료','순서 유지','L1 결과 = 42','[A] = 42 ✓'])]),
 'verification': dict(title='검증 흐름에서 비교 지점 찾기',hint='DUT와 참조 모델에 같은 프로그램을 주었을 때 무엇을 비교하는지 살펴보세요.',nodes=['Chisel + Config','생성 RTL / DUT','참조 모델','DiffTest 비교'],frames=[
 ('먼저 소스 커밋과 Config를 선택합니다. Config가 바뀌면 생성 회로도 달라질 수 있습니다.',0,['소스 + 구성 고정','생성 전','동일 ISA의 참조 모델','비교 전']),
 ('Elaboration과 RTL 생성 도구로 DUT의 하드웨어 기술을 만듭니다.',1,['하드웨어 구성','생성 RTL','참조 모델 준비','비교 전']),
 ('DUT 시뮬레이션과 참조 모델에서 같은 테스트 프로그램을 실행합니다.',2,['테스트 입력 동일','DUT 실행','참조 실행','관찰 상태 수집']),
 ('비교 대상의 레지스터 등 아키텍처 상태가 일치하는지 확인합니다.',3,['실행 조건 기록','관찰 결과 A','참조 결과 A','일치 ✓']),
 ('실행한 테스트가 일치해도 모든 입력에 대한 RTL 등가성 증명은 아닙니다.',3,['다른 테스트도 필요','테스트한 실행 경로','참조 결과','증명 범위를 구분'])]),
 'reading': dict(title='소스 읽기: valid와 ready를 따라가기',hint='일반적인 ready/valid 인터페이스 예제입니다. 두 신호가 동시에 1인 단계만 전송됩니다.',nodes=['Producer','valid','ready','Consumer'],frames=[
 ('valid = 0이면 전달할 유효한 항목이 없습니다. ready = 1이어도 전송은 없습니다.',1,['데이터 없음','0 · 유효 항목 없음','1 · 받을 수 있음','전송 없음']),
 ('Producer가 A를 준비했지만 Consumer가 막혀 있습니다. 이 예제는 대기 중 A를 유지합니다.',2,['A 준비','1 · A 유효','0 · 대기 요청','아직 전송 없음']),
 ('valid와 ready가 모두 1이면 핸드셰이크가 성립합니다.',3,['A 전달','1','1','A 수신 ✓']),
 ('전송 후 Producer는 다음 항목 B를 제시할 수 있습니다. 실제 인터페이스의 유지 조건은 모듈 계약을 확인하세요.',0,['다음 항목 B','1 · B 유효','다음 상태에 따라 결정','A 처리 중'])])
}
def storyboard(slug):
 s=STORIES[slug]
 nodes=''.join(f'<div class="story-node" data-node="{i}"><small>{escape(name)}</small><strong>{escape(s["frames"][0][2][i])}</strong></div>' for i,name in enumerate(s['nodes']))
 payload=json.dumps(s,ensure_ascii=False).replace('<','\\u003c')
 return f'''<section class="visual-lab storyboard" id="visual-guide"><p class="eyebrow">VISUAL WALKTHROUGH</p><h2>{s['title']}</h2><p class="visual-hint">{s['hint']}</p><div class="story-map">{nodes}</div><div class="story-track" aria-hidden="true"><span></span></div><div class="visual-controls"><button data-play>▶ 재생</button><button data-next>다음 단계 →</button><button data-reset>처음으로</button><label>속도 <select data-speed><option value="1800">느리게</option><option value="1100" selected>보통</option><option value="650">빠르게</option></select></label></div><label class="scrubber-label">단계 <output data-frame>1 / {len(s['frames'])}</output><input data-scrub type="range" min="0" max="{len(s['frames'])-1}" value="0"></label><p class="visual-caption" role="status">{escape(s['frames'][0][0])}</p><p class="model-note">기능 설명을 위한 순서도입니다. 단계 수는 실제 파이프라인 지연이나 회로 배선을 의미하지 않습니다.</p><script type="application/json" class="story-data">{payload}</script></section>'''

def pipeline():
 return '''<section class="visual-lab" id="experiment" data-pipeline><p class="eyebrow">ANIMATED LAB / PIPELINE</p><h2>겹쳐 실행하면 무엇이 달라질까요?</h2><p class="visual-hint">같은 명령어를 한 개씩 끝낼 때와 단계별로 겹쳐 처리할 때를 비교하세요. 명령어 수를 늘려 처리량의 차이를 관찰해 보세요.</p><div class="visual-controls"><label>실행 방식 <select id="pipe-mode"><option value="pipe">파이프라인</option><option value="serial">한 명령씩</option></select></label><label>명령어 수 <input id="pipe-count" type="range" min="2" max="8" value="4"><output id="pipe-count-value">4</output></label></div><div class="pipe-stages" aria-label="개념상 다섯 단계"><span>F · 가져오기</span><span>D · 해석</span><span>I · 발행</span><span>E · 실행</span><span>C · 커밋</span></div><div class="pipe-lanes" id="pipe-lanes"></div><div class="timeline-scroll" tabindex="0" role="region" aria-label="명령어별 사이클 시간표"><div id="pipe-timeline"></div></div><div class="visual-controls"><button id="pipe-play">▶ 재생</button><button id="pipe-step">1사이클 →</button><button id="pipe-reset">초기화</button><label>속도 <select id="pipe-speed"><option value="1300">느리게</option><option value="800" selected>보통</option><option value="400">빠르게</option></select></label></div><div class="visual-metrics"><div><small>현재 / 전체 사이클</small><strong id="pipe-cycle">0 / 8</strong></div><div><small>완료 명령어</small><strong id="pipe-done">0 / 4</strong></div><div><small>전체 구간 IPC</small><strong id="pipe-ipc">0.50</strong></div></div><p class="visual-caption" id="pipe-caption" role="status"></p><p class="model-note">독립적인 명령어, 단계당 1사이클, 폭 1, 대기 없는 5단계 교육 모형입니다. XiangShan의 실제 단계 수·폭·IPC와 다릅니다.</p><noscript>파이프라인 모형에서 N개 명령어는 N+4사이클, 순차 모형에서는 5N사이클이 필요합니다.</noscript></section>'''
