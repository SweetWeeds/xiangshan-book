from pathlib import Path
import shutil
root=Path(__file__).parent
out=root/'docs'
out.mkdir(exist_ok=True)
shutil.copytree(root/'site',out,dirs_exist_ok=True)
print('Copied site/ to docs/ for GitHub Pages.')
