# Maple Front (1.web)

게임 데이터 조회 웹 UI. [Maple API](https://github.com/AnJinseok/maple-api)와 연동해 맵·몬스터·NPC·퀘스트·아이템·고확 등을 검색·상세 조회합니다.

---

## 개요

| 구분 | 기술 |
|------|------|
| 프레임워크 | React 18, Vite 7 |
| UI | MUI (Material UI), React Router |
| 린트 | ESLint |

---

## 요구 사항

- **Node.js** 18.x 이상 (20 LTS 권장)

---

## 설치 및 실행

```bash
npm install
npm run dev
```

- 개발 서버: **http://localhost:5173**

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 → `dist/` |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint 실행 |

---

## API 연동

- **Nginx 리버스 프록시 사용 시**: `.env` 에 `VITE_API_BASE_URL=/api` (또는 프로덕션 API 주소)
- **API 직접 호출**: `.env` 미설정 시 기본값 `http://{hostname}:19080/api` 사용

정적 이미지(몬스터/NPC/맵 등)는 `VITE_STATIC_ORIGIN` 으로 기준 URL 지정 가능합니다.

---

## 배포

1. `npm run build` 후 `dist/` 를 Nginx 등으로 서빙
2. API·Front 함께 배포 순서는 API 저장소 **[DEPLOY.md](https://github.com/AnJinseok/maple-api/blob/main/DEPLOY.md)** 참고
3. HTTPS(Let's Encrypt) 설정은 **`deploy/SSL-SETUP.md`** 참고

---

## 기타

- **개발 서버 로그** (서버에서 실행 시): `./scripts/run-dev-with-log.sh` → `logs/front.log`
- **파비콘**: `public/favicon.png` (프로젝트에서 관리)
