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

## 참고

- React Fast Refresh는 [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) (Babel)을 사용합니다.
- 프로덕션 빌드 시 TypeScript·타입 기반 ESLint를 쓰려면 [Vite TS 템플릿](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) 및 [typescript-eslint](https://typescript-eslint.io) 문서를 참고하세요.
