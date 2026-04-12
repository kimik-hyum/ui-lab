# ui-lab monorepo

Yarn Berry(workspaces) 기반 모노레포입니다.

## Workspace

- `apps/lab-shell`: 기존 ui-lab Next.js 관리/비교 허브 앱
- `apps/next-lab`: Next.js 실험 앱
- `apps/sveltekit-lab`: SvelteKit 실험 앱

## Requirements

- Node.js 20+
- Yarn 4.x

## Install

```bash
yarn install
```

## Development

```bash
# lab-shell (기본)
yarn dev

# next-lab (3001)
yarn dev:next-lab

# sveltekit-lab (3002)
yarn dev:sveltekit-lab
```

## Build

```bash
# 전체 workspace build
yarn build

# lab-shell만 build
yarn build:lab-shell
```

## Lighthouse Comparison (Next vs SvelteKit)

루트에서 아래 명령으로 `apps/next-lab`과 `apps/sveltekit-lab`의 동일 경로를 측정합니다.

```bash
# 빠른 1회 측정
yarn perf:lighthouse:quick

# 기본 3회 측정
yarn perf:lighthouse
```

옵션:

```bash
# 특정 경로 측정 (예: /about), 5회 실행
LH_PATH=/about LH_RUNS=5 yarn perf:lighthouse
```

결과 파일:

- 타임스탬프별 원본: `perf-results/lighthouse/<timestamp>/`
- 최신 집계: `perf-results/lighthouse/latest.json`

## Vercel Project Split

각 앱은 별도 Vercel 프로젝트로 연결합니다.

- Project A -> `apps/lab-shell`
- Project B -> `apps/next-lab`
- Project C -> `apps/sveltekit-lab`
