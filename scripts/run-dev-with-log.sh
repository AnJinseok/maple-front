#!/usr/bin/env bash
# 프론트 개발 서버 실행 + 로그 파일 저장 (서버에서 사용)
# 사용: ./scripts/run-dev-with-log.sh 또는 bash scripts/run-dev-with-log.sh
cd "$(dirname "$0")/.."
mkdir -p logs
npm run dev 2>&1 | tee logs/front.log
