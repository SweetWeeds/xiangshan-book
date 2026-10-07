# XiangShan Book

한국어로 읽고 실험하는 XiangShan 입문 교과서.

**배포:** https://sweetweeds.github.io/xiangshan-book/

10개 장, 4개 교육용 실험(파이프라인 비교·2비트 분기 예측·ROB·직접 사상 캐시)과 6개 단계별 시각화, 장별 퀴즈, 목차 검색, 브라우저 내 읽음 표시, 라이트/다크 테마를 제공합니다. Kunminghu V2 공식 문서를 참고한 비공식 학습 자료입니다. 실험은 실제 XiangShan의 성능이나 타이밍을 재현하지 않습니다.

## 수정 및 미리보기

Python 3만으로 페이지를 생성합니다. 프런트엔드 빌드 의존성은 없습니다.

```sh
python3 build.py
python3 -m http.server 8080 --directory site
```

- `content.py`: 한국어 본문, 퀴즈, 출처
- `build.py`: 정적 HTML 생성
- `visual_content.py`: ISA·리다이렉트·Rename·메모리 전달·검증·핸드셰이크의 단계별 설명
- `site/assets/visuals.js`, `visuals.css`: 애니메이션, 시간표, 상태·주소 시각화
- `site/assets/`: CSS, JavaScript, SVG
- `diagrams/core.mmd`: 개념도 원본 (Mermaid, Kroki로 검증·출력)
- `tests/check_site.py`: 내부 링크 및 콘텐츠 검사
- `tests/browser_check.py`: Playwright 브라우저 동작 검사
- `tests/visual_check.py`: 시각화 재생·정지·초기화·모델 불변식·모바일 검사

## 배포

GitHub Pages는 `main` 브랜치의 `/docs`를 사용합니다. `site/`가 웹 원본이며 아래 명령으로 생성 및 배포 파일을 갱신합니다.

```sh
python3 build.py
python3 tests/check_site.py
python3 prepare_deploy.py
```

변경 사항을 커밋하고 `main`에 push하면 Pages가 다시 배포됩니다. `docs/`에는 웹 공개 파일만 포함합니다.

## 참고와 저작권

- 학습 구성 참고: [ComputerBook](https://computerbook.euiyun.com/)의 개념 설명·실험·퀴즈 학습 방식. 원본 사이트의 코드와 에셋을 복제하지 않았습니다.
- 기술 참고: [XiangShan](https://github.com/OpenXiangShan/XiangShan), [Kunminghu V2 설계 문서](https://docs.xiangshan.cc/projects/design/en/kunminghu-v2/), [DiffTest](https://github.com/OpenXiangShan/difftest).
- 공식 설계 문서: The XiangShan Team / Beijing Institute of Open Source Chip, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 이 사이트는 내용을 한국어 개념 설명과 단순화한 교육 예제로 재구성했습니다. 공식 문서의 전체 번역이 아닙니다.
- XiangShan 공식 사이트와는 독립된 비공식 학습 프로젝트입니다.

## 시각 자료와 애니메이션

ComputerBook의 CPU 성능·메모리 장에서 사용하는 시간표, 패턴 선택, 상태 강조, 결과 수치의 학습 방식을 참고해 독자적으로 구현했습니다. 원본 코드·그림은 복제하지 않았습니다.

- 파이프라인: 명령어 수 2–8개, 순차/겹침 비교, 이동 토큰, 사이클 시간표, IPC.
- 예측: 2비트 상태 이동, 최근 관찰 적중/실패 이력, 반복/교대/항상 Taken 패턴.
- ROB: 실행·완료 대기·커밋 시간표와 HEAD 이동.
- 캐시: 16비트 주소의 태그/인덱스/오프셋, 4개 라인, 선택 바이트, 충돌 교체, 접근 패턴.
- 6개 개념 그림: 재생/정지, 다음 단계, 초기화, 속도, 단계 슬라이더.

자동 재생은 사용자가 시작하며 화면 밖 또는 백그라운드로 이동하면 멈춥니다. OS의 동작 줄이기 설정에서는 이동 효과를 생략하고 상태를 즉시 표시합니다. 모델 가정은 각 실험에 표시합니다.
