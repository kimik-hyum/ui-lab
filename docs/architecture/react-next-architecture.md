# React / Next.js App Router Architecture

> 작성일: 2026-05-24  
> 목적: UI-LAB에서 Next.js App Router 기반 React 앱을 새로 만들거나 리팩토링할 때 사용할 기준 문서

## 방향성

이 문서는 다음 전제를 기준으로 한다.

- Next.js App Router에서는 기본을 서버 컴포넌트로 둔다.
- 브라우저 이벤트, 로컬 UI 상태, form interaction, optimistic update가 필요한 곳만 클라이언트 컴포넌트로 분리한다.
- 서버 데이터는 가능하면 서버에서 먼저 가져오고, 클라이언트 상호작용이 필요한 경우 TanStack Query로 hydrate한다.
- 원천 데이터 fetch, 도메인 aggregation, 페이지별 view model 변환, 순수 UI 렌더링을 분리한다.
- React 컴포넌트가 DB, SDK, 복잡한 비즈니스 규칙을 직접 알지 않게 한다.

참고 레퍼런스:

- `YukiOnishi1129/next-app-router-architecture`: App Router + Server Components + TanStack Query hydration + external layer 구조
- `alan2207/bulletproof-react`: feature-based React 애플리케이션 구조와 boundary 규칙
- `nextjs/saas-starter`: 인증, DB, 결제, Server Actions가 포함된 실전 Next.js 스타터

## 기본 폴더 구조

```txt
src/
  app/
    (public)/
    (auth)/
    (dashboard)/
    api/
    layout.tsx
    page.tsx
    providers.tsx

  features/
    auth/
    users/
    dashboard/
    orders/
      actions/
      components/
        server/
        client/
      hooks/
        query/
        mutation/
      queries/
      types/

  shared/
    components/
      ui/
      layout/
    providers/
    hooks/
    lib/
    utils/
    config/

  external/
    client/
    dto/
    handler/
    service/
    repository/
```

각 폴더의 책임은 아래처럼 둔다.

| 영역 | 책임 |
|---|---|
| `app` | 라우팅, route group, layout, metadata, page 진입점 |
| `features` | 도메인/화면 단위 UI, hook, query option, action orchestration |
| `shared` | 공통 UI, provider, 공용 hook, 공용 util, 설정 |
| `external` | 서버 전용 DTO, handler, service, repository, DB/API client |

## 사용자님이 정의한 6단계 매핑

| 단계 | 위치 | 원칙 |
|---|---|---|
| 1. 레이아웃 | `app/**/layout.tsx`, `shared/components/layout` | 인증/권한/페이지 chrome은 layout에서 처리 |
| 2. 전역 코어 상태 | `shared/providers`, `shared/components/ui` | toast, dialog, theme은 provider로 관리. 로그인은 client store보다 server session 우선 |
| 3. 유틸 함수 | `shared/utils`, `shared/lib`, `features/*/utils` | 공용이면 shared, 특정 기능 전용이면 feature 내부 |
| 4. 서버 데이터 페칭 | `external/handler/*/query.server.ts` | 서버 컴포넌트나 server action에서 호출 |
| 5. 서버 데이터 aggregation | `external/service`, `features/*/queries` | 비즈니스 조합은 service, 페이지별 view model은 feature query |
| 6. 순수 뷰 | `features/*/components/client/*Presenter.tsx` | props만 받아 렌더링. fetch, mutation, router 접근 금지 |

## 데이터 흐름

권장 흐름은 다음과 같다.

```txt
app/page.tsx
  -> features/*/components/server/*PageTemplate.tsx
    -> TanStack Query prefetch 또는 직접 server fetch
      -> external/handler/*/query.server.ts
        -> external/service/*
          -> external/repository/*
            -> external/client/*
    -> HydrationBoundary
      -> features/*/components/client/*Container.tsx
        -> features/*/hooks/query/*
          -> features/*/queries/*
        -> *Presenter.tsx
```

읽기 전용 페이지는 TanStack Query 없이 서버 컴포넌트에서 바로 렌더링해도 된다.

```txt
Server Component
  -> external handler
  -> service aggregation
  -> presenter props
```

하지만 아래 조건이 있으면 TanStack Query hydration을 기본 선택으로 둔다.

- 검색, 필터, pagination
- mutation 후 리스트 갱신
- optimistic update
- 탭, 모달, 상세 패널 간 서버 데이터 캐시 공유
- 클라이언트에서 같은 데이터를 재조회해야 하는 화면

## TanStack Query 사용 원칙

TanStack Query는 아키텍처의 중심이 아니라, 서버 데이터 캐시 계층이다.

```txt
external/repository  # 원천 데이터 조회
external/service     # 도메인 조합
features/*/queries   # queryKey, queryFn, 페이지별 view model
features/*/hooks     # useQuery/useMutation 감싸기
components/client    # container에서 hook 사용
components/server    # prefetch + hydration
```

query key는 화면 이름보다 데이터 의미를 기준으로 잡는다.

```ts
export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderListFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (orderId: string) => [...orderKeys.all, 'detail', orderId] as const,
  dashboardSummary: () => [...orderKeys.all, 'dashboard-summary'] as const,
}
```

## Aggregation 위치 기준

같은 fetch 함수를 쓰더라도 페이지마다 필요한 모델이 다를 수 있다. 이때는 아래 기준으로 위치를 정한다.

| 성격 | 위치 |
|---|---|
| DB join, 권한, 정책, 도메인 규칙 | `external/service` |
| DTO validation, 서버 액션/쿼리 진입점 | `external/handler` |
| 페이지별 카드/테이블/차트 view model | `features/*/queries` |
| 순수 label, format, display state | `features/*/components` 또는 `shared/utils` |

예를 들어 `orders` 원천 데이터는 하나지만 대시보드와 주문 목록이 서로 다른 모델을 원할 수 있다.

```ts
// external/handler/order/query.server.ts
import 'server-only'

import { orderService } from '@/external/service/order/order.service'

export async function getOrders() {
  return orderService.getOrders()
}
```

```ts
// features/dashboard/queries/dashboard-orders.query.ts
import { queryOptions } from '@tanstack/react-query'

import { getOrders } from '@/external/handler/order/query.server'

function toDashboardOrdersModel(orders: Awaited<ReturnType<typeof getOrders>>) {
  return {
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    paidCount: orders.filter((order) => order.status === 'paid').length,
    pendingCount: orders.filter((order) => order.status === 'pending').length,
  }
}

export function dashboardOrdersQueryOptions() {
  return queryOptions({
    queryKey: ['orders', 'dashboard-summary'],
    queryFn: async () => {
      const orders = await getOrders()

      return toDashboardOrdersModel(orders)
    },
  })
}
```

```ts
// features/orders/queries/order-list.query.ts
import { queryOptions } from '@tanstack/react-query'

import { getOrders } from '@/external/handler/order/query.server'

function toOrderListModel(orders: Awaited<ReturnType<typeof getOrders>>) {
  return orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    statusLabel: order.status === 'paid' ? '결제 완료' : '대기 중',
    totalText: `${order.total.toLocaleString()}원`,
  }))
}

export function orderListQueryOptions() {
  return queryOptions({
    queryKey: ['orders', 'list'],
    queryFn: async () => {
      const orders = await getOrders()

      return toOrderListModel(orders)
    },
  })
}
```

## Server Component Template

`app/**/page.tsx`는 얇게 유지하고, 실제 화면 조립은 feature의 server template에 위임한다.

```tsx
// app/(dashboard)/orders/page.tsx
import { OrdersPageTemplate } from '@/features/orders/components/server/OrdersPageTemplate'

export default function OrdersPage() {
  return <OrdersPageTemplate />
}
```

```tsx
// features/orders/components/server/OrdersPageTemplate.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { getQueryClient } from '@/shared/lib/query-client'
import { OrdersContainer } from '@/features/orders/components/client/OrdersContainer'
import { orderListQueryOptions } from '@/features/orders/queries/order-list.query'

export async function OrdersPageTemplate() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(orderListQueryOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersContainer />
    </HydrationBoundary>
  )
}
```

## Client Component 구조

클라이언트 컴포넌트는 `Container -> Hook -> Presenter`로 나눈다.

```txt
features/orders/components/client/Orders/
  OrdersContainer.tsx
  OrdersPresenter.tsx
  useOrders.ts
  index.ts
```

```tsx
// features/orders/components/client/Orders/OrdersContainer.tsx
'use client'

import { OrdersPresenter } from './OrdersPresenter'
import { useOrders } from './useOrders'

export function OrdersContainer() {
  const orders = useOrders()

  return <OrdersPresenter {...orders} />
}
```

```ts
// features/orders/components/client/Orders/useOrders.ts
import { useQuery } from '@tanstack/react-query'

import { orderListQueryOptions } from '@/features/orders/queries/order-list.query'

export function useOrders() {
  const { data = [], isFetching } = useQuery(orderListQueryOptions())

  return {
    orders: data,
    isFetching,
  }
}
```

```tsx
// features/orders/components/client/Orders/OrdersPresenter.tsx
type OrderRow = {
  id: string
  customerName: string
  statusLabel: string
  totalText: string
}

type OrdersPresenterProps = {
  orders: OrderRow[]
  isFetching: boolean
}

export function OrdersPresenter(props: OrdersPresenterProps) {
  return (
    <section>
      {props.isFetching ? <p>갱신 중</p> : null}
      <ul>
        {props.orders.map((order) => (
          <li key={order.id}>
            {order.customerName} · {order.statusLabel} · {order.totalText}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

Presenter에는 다음을 넣지 않는다.

- `useQuery`, `useMutation`
- `useRouter`, `useSearchParams`
- server action 직접 호출
- DTO를 화면용 모델로 바꾸는 복잡한 로직
- 전역 store 접근

## Mutation과 Server Actions

mutation은 `features/*/actions`와 `features/*/hooks/mutation`으로 나눈다.

```ts
// features/orders/actions/update-order-status.action.ts
'use server'

import { updateOrderStatus } from '@/external/handler/order/command.server'

export async function updateOrderStatusAction(input: {
  orderId: string
  status: 'paid' | 'cancelled'
}) {
  return updateOrderStatus(input)
}
```

```ts
// features/orders/hooks/mutation/useUpdateOrderStatusMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateOrderStatusAction } from '@/features/orders/actions/update-order-status.action'

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOrderStatusAction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
```

invalidate는 가능한 좁게 한다. 전체 `queryClient.clear()` 같은 방식은 마지막 수단으로 둔다.

## 전역 상태 기준

전역 상태는 최소화한다.

| 상태 | 권장 위치 |
|---|---|
| 로그인 사용자/session | 서버 session, middleware, layout guard |
| toast/alert/dialog | `shared/providers`, `shared/components/ui` |
| theme | `shared/providers` |
| 서버 데이터 | TanStack Query |
| 폼 상태 | React Hook Form 또는 로컬 상태 |
| hover, tab, modal open | 컴포넌트 로컬 상태 |

서버에서 알 수 있는 로그인/권한 상태를 클라이언트 store에 복제하지 않는다. 클라이언트에는 표시와 인터랙션에 필요한 최소 정보만 전달한다.

## Import Boundary

권장 의존 방향은 아래와 같다.

```txt
app -> features -> shared
features -> external/handler
external/handler -> external/service -> external/repository -> external/client
```

금지하거나 피해야 할 방향:

```txt
shared -> features
shared -> app
features -> external/service
features -> external/repository
components/client -> external/*
components/presenter -> hooks/query/action
```

`external`의 서버 전용 파일은 `import 'server-only'`를 상단에 둔다.

## 네이밍 규칙

권장 네이밍은 다음과 같다.

```txt
*PageTemplate.tsx          # 서버 화면 템플릿
*Container.tsx             # 클라이언트 orchestration
*Presenter.tsx             # 순수 뷰
use*.ts                    # UI state, query/mutation 조합
*.query.ts                 # queryOptions, queryKey, view model 변환
*.action.ts                # server action
*.server.ts                # 서버 전용 handler
*.service.ts               # 도메인 aggregation
*.repository.ts            # persistence
*.dto.ts                   # DTO/schema
```

## UI-LAB 적용 메모

현재 UI-LAB은 여러 프레임워크 실험 앱을 비교하는 모노레포다. 이 구조는 우선 `apps/lab-shell` 또는 별도 Next.js 실험 앱에 점진적으로 적용한다.

권장 적용 순서:

1. 새 기능부터 `features/*` 단위로 작성한다.
2. 기존 `app/front-feature/*`의 비교 페이지는 당장 이동하지 않는다.
3. 서버 데이터가 필요한 신규 기능에서 `external/handler`, `external/service`, `features/*/queries`를 먼저 도입한다.
4. 반복되는 UI만 `shared/components/ui`로 이동한다.
5. boundary가 안정되면 ESLint local rule이나 import rule로 강제한다.

완료 기준:

- `yarn lint` 통과
- `yarn build` 통과
- 서버 데이터가 필요한 화면에서 서버 fetch, aggregation, presenter 책임이 섞이지 않는다.
- 클라이언트 컴포넌트에는 실제 브라우저 상호작용이 필요한 코드만 남는다.
