# 시나리오 카드 템플릿

기능별 장문 문서를 만들지 않고, 구현 전에 아래 카드만 채웁니다.
필요한 세부 내용은 각 프레임워크 앱의 `AGENTS.md`와 구현 코드에 남깁니다.

## Template

```md
# Scenario: {scenario-id}

## Goal

{사용자가 수행할 기능과 비교 목적을 한두 문장으로 적습니다.}

## Measurement Target

- [ ] Lighthouse performance
- [ ] SSR response
- [ ] DX score

## Scenario Type

- [ ] SSR
- [ ] API round trip
- [ ] TanStack Query cache
- [ ] Rendering stress
- [ ] Mutation/optimistic update

## Route

`/scenarios/{scenario-id}`

## Baseline Feature

React/Next 기준으로 사용할 기능:

- {예: Server Component}
- {예: Route Handler}
- {예: TanStack Query useQuery/useMutation}

## Required States

- Initial
- Loading or pending
- Success
- Empty
- Error

## Required Interactions

- {사용자 행동 1}
- {사용자 행동 2}

## Data Source

- Fixture:
- Server API:
- External service:
- Deterministic seed:

## Allowed Optimizations

- {예: route-level code splitting}
- {예: virtualization}
- {예: framework-native SSR data loading}

## Not Allowed

- {예: 실제 UI 없이 데이터만 처리}
- {예: 특정 프레임워크에만 유리한 사전 계산}
- {예: required state 생략}

## SSR Checklist

- [ ] 서버 HTML에 핵심 콘텐츠가 포함됩니다.
- [ ] 서버 응답 status가 기대값입니다.
- [ ] SSR, API round trip, Query cache 비용이 섞이지 않습니다.

## Notes

- {프레임워크별 구현 차이 또는 측정 해석 주의사항}
```

## Example

```md
# Scenario: huge-select

## Goal

100,000개 option 데이터에서 검색과 선택 UI의 렌더링/상호작용 비용을 비교합니다.

## Measurement Target

- [x] Lighthouse performance
- [ ] SSR response
- [x] DX score

## Scenario Type

- [ ] SSR
- [ ] API round trip
- [ ] TanStack Query cache
- [x] Rendering stress
- [ ] Mutation/optimistic update

## Route

`/scenarios/huge-select`

## Baseline Feature

- React state for input draft
- memoized filtering
- virtualization

## Required States

- Initial
- Searching
- Selected
- Empty

## Required Interactions

- Type search query
- Keyboard move
- Select option

## Data Source

- Fixture: generated options
- Deterministic seed: `huge-select-v1`

## Allowed Optimizations

- Virtualization
- Memoized filtering
- Route-level lazy import

## Not Allowed

- Rendering fewer options without virtualization rationale
- Precomputing filtered results outside the scenario contract
- Removing keyboard interaction

## SSR Checklist

- [ ] 서버 HTML에 핵심 콘텐츠가 포함됩니다.
- [ ] 서버 응답 status가 기대값입니다.
- [x] SSR, API round trip, Query cache 비용이 섞이지 않습니다.

## Notes

- 이 시나리오는 SSR 응답 성능보다 클라이언트 렌더링/상호작용 비용 비교가 목적입니다.
```
