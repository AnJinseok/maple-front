# Maple Front

React + Vite 기반 메이플 관련 프론트엔드 프로젝트입니다.

## 기술 스택

- **React 18**
- **Vite 7** — HMR 지원, 빠른 개발 서버
- **ESLint** — 코드 검사

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint 실행 |

## 사용 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 프로덕션 빌드 (리눅스 서버 배포)

```bash
# API 주소 설정: .env.production.example 을 참고해 .env.production 생성
# (같은 서버 Nginx 사용 시 VITE_API_BASE_URL=/api)
npm run build
```

빌드 결과 `dist/` 를 Nginx 등으로 서빙하면 됩니다. **API 저장소의 [DEPLOY.md](https://github.com/AnJinseok/maple-api/blob/main/DEPLOY.md)** 에 리눅스 서버에서 API + Front 함께 받아서 실행하는 전체 순서가 정리되어 있습니다.

## 참고

- React Fast Refresh는 [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) (Babel)을 사용합니다.
- 프로덕션 빌드 시 TypeScript·타입 기반 ESLint를 쓰려면 [Vite TS 템플릿](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) 및 [typescript-eslint](https://typescript-eslint.io) 문서를 참고하세요.
