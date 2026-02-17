---
name: front-feature-comparison-workflow
description: Build new front-end feature comparison pages in ui-lab using ComparisonTemplate, anchor-based code mapping, and runnable side-by-side demos. Use when user asks to compare a new React or Next feature with explanatory code and examples.
---

# Front Feature Comparison Workflow

## Overview

`ui-lab`에서 신규 기능 비교를 추가할 때, 공통 비교 템플릿과 앵커 기반 코드 하이라이트를 사용해 일관된 "설명 + 실행 데모" 페이지를 만든다.

## When To Use

- 사용자가 React/Next 신규 기능 비교 페이지를 요청할 때
- "코드 비교 + 실제 동작 예제 + 설명"을 함께 구성해야 할 때
- 기존 `front-feature/react/optimistic` 또는 `front-feature/react/activity` 패턴을 확장할 때

## Workflow

1. 카탈로그 등록
- React 기능이면 `app/front-feature/react/page.tsx`에 카드 항목 추가
- Next 기능이면 `app/front-feature/nextjs/page.tsx`에 카드 항목 추가
- `since`, `status`, `href`를 명시하고 `available` 항목만 링크를 건다

2. 라우트 골격 생성
- 경로: `app/front-feature/<domain>/<feature>/`
- 서버 페이지(`page.tsx`)에서 좌/우 데모 코드 파일을 읽어 클라이언트 비교 페이지로 전달한다

3. 비교 전용 클라이언트 페이지 구현
- 파일 예: `.../<feature>/FeatureClientPage.tsx`
- `ComparisonTemplate`을 사용해 `leftCode`, `rightCode`, `topics`, `headerActions`, `leftComponent`, `rightComponent`를 연결한다
- 성능 지표가 목적이 아니면 benchmark 용어/수치는 넣지 않는다

4. 좌/우 데모 컴포넌트 분리
- `components/Traditional...tsx` 와 `components/Modern...tsx`(또는 기능명 기반)로 분리
- 동일한 입력/동일한 액션 조건에서 차이를 보여주고, UI는 최소한으로 유지한다

5. 앵커 기반 코드 하이라이트 구성
- 코드 파일에 범위 마커를 추가한다:
  - JSX 주석 또는 일반 주석 내부의 `[cmp:<anchor-key>:start]` / `[cmp:<anchor-key>:end]`
- 클라이언트 페이지에서 코드 문자열을 파싱해 `leftLines/rightLines`를 계산한다
- 마커 누락 시 fallback 라인 배열을 둬서 화면이 깨지지 않게 한다

6. 설명 품질 보강
- 토픽은 최소 3개(핵심 차이, 상태/부작용, 유지보수 포인트)
- 각 설명은 "무엇이 다른가"와 "왜 의미가 있는가"를 동시에 담는다

## File Pattern

- `app/front-feature/<domain>/<feature>/page.tsx` (Server Component)
- `app/front-feature/<domain>/<feature>/<Feature>ClientPage.tsx` (`'use client'`)
- `app/front-feature/<domain>/<feature>/components/*.tsx` (좌/우 데모)

## Quality Gate

- `yarn lint` 통과
- `yarn build` 통과
- 코드뷰에서 양쪽 hover 시 토픽 설명/스크롤 매칭이 자연스러운지 확인

## References

- 작업 전 `references/checklist.md`를 열어 최소 체크리스트를 확인한다.
