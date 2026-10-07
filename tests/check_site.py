from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
root=Path(__file__).resolve().parents[1]/'site'
class Page(HTMLParser):
 def __init__(self): super().__init__();self.links=[];self.ids=set()
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  for k in ['href','src']:
   if k in a:self.links.append(a[k])
files={p:Page() for p in root.rglob('*.html')}
for p,parser in files.items():parser.feed(p.read_text())
for p,parser in files.items():
 for link in parser.links:
  url=urlsplit(link)
  if url.scheme or url.netloc:continue
  path=unquote(url.path)
  if path.startswith('/xiangshan-book/'):target=root/path.removeprefix('/xiangshan-book/')
  elif path:target=(p.parent/path).resolve()
  else:target=p
  if target.is_dir():target/= 'index.html'
  assert target.exists(),f'{p.name}: broken link {link}'
  if url.fragment and target in files: assert url.fragment in files[target].ids, f'{p}: missing fragment {link}'
assert len(list((root/'chapters').glob('*.html')))==10
assert all('class="quiz"' in p.read_text() for p in (root/'chapters').glob('*.html'))
print(f'PASS: {len(files)} HTML pages, local assets and anchors, 10 chapter quizzes')
