"""Behavioral checks for animation controls and educational-model invariants."""
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:8765/'
out=Path('.test-artifacts');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/home/han/.cache/ms-playwright/chromium-1134/chrome-linux/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':1000})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def visit(slug):
  print('Checking',slug,flush=True)
  page.goto(BASE+'chapters/'+slug+'.html',wait_until='domcontentloaded')
 # Storyboards are seekable in either direction and changing state is textual too.
 for slug in ['start','frontend','rename','memory','verification','reading']:
  visit(slug)
  initial=page.locator('.visual-caption').inner_text()
  page.locator('[data-next]').click()
  assert page.locator('.visual-caption').inner_text()!=initial
  end=int(page.locator('[data-scrub]').get_attribute('max'))
  page.locator('[data-scrub]').fill(str(end))
  assert page.locator('[data-next]').is_disabled()
  page.locator('[data-reset]').click()
  assert page.locator('[data-frame]').inner_text().startswith('1 /')
  page.locator('[data-play]').click();page.wait_for_timeout(1250)
  assert not page.locator('[data-frame]').inner_text().startswith('1 /')
  page.locator('[data-play]').click()
  frame=page.locator('[data-frame]').inner_text();page.wait_for_timeout(1250)
  assert frame==page.locator('[data-frame]').inner_text()
 visit('rename');page.locator('[data-scrub]').fill('4')
 assert 'p8 유지' in page.locator('.story-map').inner_text()
 page.locator('.visual-lab').screenshot(path=str(out/'rename-visual.png'))
 # N independent instructions, 5 stages: pipeline N+4, serial 5*N.
 visit('pipeline')
 assert page.locator('#pipe-cycle').inner_text()=='0 / 8'
 for _ in range(8):page.locator('#pipe-step').click()
 assert page.locator('#pipe-done').inner_text()=='4 / 4'
 assert page.locator('#pipe-step').is_disabled()
 page.locator('#pipe-mode').select_option('serial')
 assert page.locator('#pipe-cycle').inner_text()=='0 / 20'
 for _ in range(5):page.locator('#pipe-step').click()
 assert page.locator('#pipe-done').inner_text()=='1 / 4'
 page.locator('#pipe-count').fill('8')
 assert page.locator('#pipe-cycle').inner_text()=='0 / 40'
 page.locator('#pipe-mode').select_option('pipe')
 assert page.locator('#pipe-cycle').inner_text()=='0 / 12'
 page.locator('#pipe-count').fill('4')
 for _ in range(4):page.locator('#pipe-step').click()
 page.locator('[data-pipeline]').screenshot(path=str(out/'pipeline-visual.png'))
 page.locator('#pipe-play').click();page.wait_for_timeout(1000)
 page.locator('#pipe-play').click()
 current=page.locator('#pipe-cycle').inner_text();page.wait_for_timeout(1000)
 assert current==page.locator('#pipe-cycle').inner_text()
 # Predictor state and history stay synchronized, reset clears both.
 visit('prediction');page.locator('#branch-next').click()
 assert page.locator('[data-state="2"]').get_attribute('aria-current')=='true'
 assert page.locator('.history-item.miss').count()==1
 for _ in range(4):page.locator('#branch-next').click()
 assert page.locator('[data-state="2"]').get_attribute('aria-current')=='true'
 assert page.locator('.history-item').count()==5
 page.locator('.experiment-visual').screenshot(path=str(out/'predictor-visual.png'))
 page.locator('#reset').click();assert page.locator('.history-item').count()==0
 page.locator('#branch-play').click();page.wait_for_timeout(1050)
 assert page.locator('.history-item').count()>0
 page.locator('#branch-play').click()
 # ROB must wait for oldest LOAD; sequential commit is 4,5,6.
 visit('ooo')
 page.locator('#step').click();assert '완료 · 대기' in page.locator('.rob-slot').nth(1).inner_text()
 for _ in range(2):page.locator('#step').click()
 assert page.locator('.is-committed').count()==0
 page.locator('.experiment-visual').screenshot(path=str(out/'rob-visual.png'))
 for i in range(1,4):
  page.locator('#step').click();assert page.locator('.is-committed').count()==i
 page.locator('#reset').click();assert page.locator('.is-committed').count()==0
 # Cache tag/index/offset and replacement are real state, not decorative.
 visit('cache');page.locator('[data-address="0"]').click()
 assert page.locator('.cache-line.miss').count()==1
 page.locator('[data-address="4"]').click()
 assert page.locator('#cache-offset').inner_text()=='0100'
 assert page.locator('.cache-line.hit').count()==1
 page.locator('[data-address="64"]').click()
 assert page.locator('#cache-tag').inner_text()=='0000000001'
 assert page.locator('#cache-index').inner_text()=='00'
 assert '이전 블록 0–15' in page.locator('#cache-caption').inner_text()
 page.locator('.experiment-visual').screenshot(path=str(out/'cache-visual.png'))
 page.locator('#cache-pattern').select_option('local')
 for _ in range(4):page.locator('#cache-next').click()
 assert '적중 3회 / 미스 1회' in page.locator('#result').inner_text()
 page.locator('#cache-pattern').select_option('conflict')
 for _ in range(4):page.locator('#cache-next').click()
 assert '적중 0회 / 미스 4회' in page.locator('#result').inner_text()
 # Every page fits small displays, including dark theme and reduced motion.
 page.set_viewport_size({'width':360,'height':800})
 for slug in ['start','pipeline','frontend','prediction','rename','ooo','memory','cache','verification','reading']:
  visit(slug)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),slug
  assert page.locator('.visual-lab,.experiment-visual').count()==1,slug
 visit('pipeline');page.locator('#pipe-step').click()
 page.locator('[data-pipeline]').screenshot(path=str(out/'pipeline-mobile.png'))
 visit('cache');page.locator('.theme').click();page.locator('[data-address="64"]').click()
 page.locator('.experiment-visual').screenshot(path=str(out/'cache-mobile-dark.png'))
 page.emulate_media(reduced_motion='reduce')
 assert page.evaluate('getComputedStyle(document.querySelector(".cache-line")).transitionDuration')=='0s'
 assert not errors,errors
 b.close()
print('PASS: 10 visualizations, seek/play/pause/reset, pipeline model, predictor history, ROB commit order, cache patterns, mobile/dark/reduced motion')
