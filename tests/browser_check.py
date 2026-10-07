from playwright.sync_api import sync_playwright
from pathlib import Path
BASE='http://127.0.0.1:8765/'
out=Path('.test-artifacts');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/home/han/.cache/ms-playwright/chromium-1134/chrome-linux/chrome',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE)
 page.screenshot(path=str(out/'home-desktop.png'),full_page=True)
 page.locator('#search').fill('캐시')
 assert page.locator('.chapter-card:visible').count()==1
 page.locator('#search').fill('존재하지않는검색어')
 assert page.locator('#no-results').is_visible()
 page.locator('#search').fill('')
 assert page.locator('.chapter-card:visible').count()==10
 page.locator('.theme').click();assert page.locator('html').get_attribute('data-theme')=='dark'
 page.reload();assert page.locator('html').get_attribute('data-theme')=='dark'
 page.locator('.theme').click()
 page.goto(BASE+'chapters/prediction.html')
 for _ in range(4):page.locator('#taken').click()
 assert page.locator('[data-state="3"]').get_attribute('aria-current')=='true'
 page.locator('#not-taken').click()
 assert page.locator('[data-state="2"]').get_attribute('aria-current')=='true'
 page.locator('#reset').click();assert '관찰 0회' in page.locator('#result').inner_text()
 page.locator('[data-option="1"]').click();assert '다시' in page.locator('.quiz-feedback').inner_text()
 page.locator('[data-option="0"]').click();assert '정답입니다' in page.locator('.quiz-feedback').inner_text()
 page.locator('#mark-read').click();page.reload();assert page.locator('#mark-read').get_attribute('aria-pressed')=='true'
 page.goto(BASE);assert '1 / 10' in page.locator('#progress-label').inner_text()
 page.locator('#clear-progress').click();assert '0 / 10' in page.locator('#progress-label').inner_text()
 page.goto(BASE+'chapters/ooo.html')
 page.locator('#step').click();assert '커밋 0/3' in page.locator('#result').inner_text()
 for _ in range(5):page.locator('#step').click()
 assert '커밋 3/3' in page.locator('#result').inner_text();assert page.locator('#step').is_disabled()
 page.locator('#reset').click();assert 'Cycle 0' in page.locator('#result').inner_text()
 page.goto(BASE+'chapters/cache.html')
 page.locator('[data-address="0"]').click();assert 'MISS' in page.locator('#result').inner_text()
 page.locator('[data-address="4"]').click();assert 'HIT' in page.locator('#result').inner_text()
 page.locator('[data-address="64"]').click();assert 'MISS' in page.locator('#result').inner_text()
 page.locator('[data-address="0"]').click();assert 'MISS' in page.locator('#result').inner_text()
 assert '적중 1회 / 미스 3회' in page.locator('#result').inner_text()
 page.locator('#reset').click();assert '접근 0회' in page.locator('#result').inner_text()
 page.set_viewport_size({'width':390,'height':844})
 for path in ['']+['chapters/'+x.name for x in Path('site/chapters').glob('*.html')]:
  page.goto(BASE+path)
  assert page.locator('h1').count()==1
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'Overflow: {path}'
 page.goto(BASE);page.screenshot(path=str(out/'home-mobile.png'),full_page=True)
 page.goto(BASE+'chapters/prediction.html#experiment');page.screenshot(path=str(out/'lab-mobile.png'),full_page=True)
 assert not errors,errors
 browser.close()
 print('PASS: desktop/mobile, all 10 chapters, search, theme persistence, reading progress, quizzes and 3 experiments; no JS errors')
