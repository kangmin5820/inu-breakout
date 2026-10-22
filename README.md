# INU 벽돌깨기

운동건강학부 · 202202056 · 이강민

게임 실행: https://inu-breakout-chi.vercel.app/

소스 저장소(비공개): https://github.com/kangmin5820/inu-breakout

Next.js로 제작한 3 RED BRICK CHALLENGE입니다. 빨간 벽돌 3개를 깨면 성공하고, 성공한 기록만 Google Sheets에 저장합니다.

## 실행

Node.js 22 이상이 필요합니다.

```sh
npm ci
```

`.env.example`을 `.env.local`로 복사하고 서버용 Google 서비스 계정과 충분히 긴 무작위 `GAME_SESSION_SECRET`을 설정합니다. 연결할 시트를 해당 서비스 계정에 편집자로 공유합니다.

```sh
npm run dev -- --port 3200
```

http://localhost:3200 에서 확인합니다. 같은 Wi-Fi의 모바일 기기에서는 개발 서버가 표시한 Network 주소를 사용합니다.

## 검사

```sh
npm test
npm run lint
npm run build
npm run start -- --port 3200
```

## 주요 기능

- 이름을 입력하는 시작 화면, 대학 마스코트, 제작자 학과·학번·이름
- 무작위 5행 × 8열 벽돌, 정확히 30%인 빨간 벽돌 12개
- 빨간 벽돌 3개를 깨면 성공, 생명 3개 소진 시 실패
- PC는 좌우 방향키로만 패들 이동, 모바일은 좌우 스와이프
- 처음 한 번의 3·2·1 카운트다운, 일시정지·계속·다시 시작·종료
- 게임 플레이 중의 시간만 `00:00` 형식으로 측정
- 성공 시 폭죽과 완료 시간, Google Sheets 저장 및 빠른 TOP 3
- 첨부한 Hyper_Speed_Run.mp3 배경음악(볼륨 18%)과 벽돌 타격 효과음

## 파일

- `public/Mascot.jpg`: 제공된 횃불이 이미지 원본
- `public/Hyper_Speed_Run.mp3`: 제공된 배경음악 원본
- `src/lib/engine.ts`: 캔버스 크기와 독립적인 게임 물리·충돌·목표 상태
- `src/components/GameCanvas.tsx`: 고해상도 캔버스, 키보드 및 터치 입력
- `src/app/api/session`: HTTP-only 서명 게임 세션
- `src/app/api/scores`: Google Sheets 기록 저장·TOP 3 조회
- `DEVELOPMENT.md`: 개발 과정과 실제 요청·설계 프롬프트 정리

## Google Sheets

기록용 시트: https://docs.google.com/spreadsheets/d/1XqujCdJc4HUxqVVU18Bao7yQEXWBIvXB_npbwr1Px4o/edit?usp=drivesdk

공용 예시 시트는 읽기 전용 참고 자료로 유지했습니다. 본인 소유 복사본의 `시트1` A:C를 기록 저장소로 사용합니다. 헤더는 `timestamp`, `name`, `finishtime`입니다. 기존 공용 기록을 복사본에서 비우는 작업과 게임 서버 계정에 복사본 편집 권한을 주는 작업은 사용자의 명시적 승인을 받았습니다.

`.env.local`, 비밀키, `node_modules`, `.next`는 소스 ZIP 및 Git에 포함하지 않습니다. 배포 시 같은 환경변수를 별도로 서버에 설정해야 합니다. 서명 세션과 경과시간 검증은 기본 입력 검증이며 완전한 부정행위 방지 시스템은 아닙니다.

## 배포

Vercel의 `inu-breakout` 프로젝트를 `main` 브랜치에 연결했습니다. Root Directory는 `./`, 프레임워크는 Next.js입니다. 승인받은 Google 환경변수 네 개와 `GAME_SESSION_SECRET`는 Production 환경의 민감정보로 등록했습니다. 소스에는 실제 비밀값이 없습니다.

배포된 앱에서 페이지·이미지·음악 응답과 서버 세션 생성, Sheets 기록 저장 및 랭킹 재조회를 확인했습니다. 임시 검증 기록은 정리했습니다. 사용자가 실제 휴대폰에서 배포 주소 접속과 좌우 스와이프 패들 조작이 정상임을 확인했습니다 (2026-10-22).
