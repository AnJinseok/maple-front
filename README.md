# Maple Front

이직 포트폴리오용 프론트엔드 프로젝트입니다. [Maple API](https://github.com/AnJinseok/maple-api)와 함께 사용하는 게임 데이터 조회 웹입니다.

## About (프로젝트 개요)

- **데이터**: Python 스크래핑 → API(Spring Boot) → **이 저장소(React)** 로 이어지는 파이프라인의 마지막 단계입니다.
- **역할**: 맵·몬스터·NPC·퀘스트·아이템·고확 등을 검색·상세 조회하는 UI 제공.

---

## 요구 사항

- **Node.js** 18.x 이상 (20 LTS 권장)  
  → [nodejs.org](https://nodejs.org) LTS 다운로드

---

## 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버: **http://localhost:5173**

---

## 기술 스택

- **React 18**
- **Vite 7** — HMR, 빠른 개발 서버
- **React Router**
- **MUI (Material UI)** — UI 컴포넌트
- **ESLint**

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint 실행 |

---

## API 연동

- **개발/빌드 공통**: `.env` 에 `VITE_API_BASE_URL=/api` 설정 (같은 서버 Nginx 사용 시)
- Nginx 없이 API 직접 호출 시: `.env` 삭제 또는 주석 처리 → 기본값 `hostname:19080/api` 사용

---

## 프로덕션 빌드 및 배포

```bash
npm run build
```

`dist/` 를 Nginx 등으로 서빙하세요. API 저장소의 **[DEPLOY.md](https://github.com/AnJinseok/maple-api/blob/main/DEPLOY.md)** 에 API + Front 함께 배포하는 순서가 정리되어 있습니다.

---

## 로그 (서버에서 개발 서버 실행 시)

```bash
chmod +x scripts/run-dev-with-log.sh
./scripts/run-dev-with-log.sh
```

출력이 `logs/front.log` 에 저장됩니다.
