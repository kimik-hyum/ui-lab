import fixture from '../../../../../fixtures/dashboard-ssr.json';
import type { DashboardSsrResponse } from '../../../shared/scenarios/dashboard-ssr/types';

function firstQueryValue(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first : undefined;
}

export async function getDashboardSsr(
  query: Record<string, unknown>,
): Promise<DashboardSsrResponse | null> {
  const rawDelay = firstQueryValue(query.delay);
  const delayMs = rawDelay === '0' ? 0 : rawDelay === '800' ? 800 : 400;
  const teamId = firstQueryValue(query.team) || 'alpha';

  // 공통 fixture의 서버 I/O를 재현하는 인공지연입니다.
  if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));

  if (teamId === 'alpha') return { dashboard: fixture, delayMs };
  if (teamId === 'empty') {
    return {
      dashboard: {
        ...fixture,
        team: { id: 'empty', name: '빈 팀' },
        summary: fixture.summary.map((item) => ({ ...item, value: 0 })),
        activities: [],
      },
      delayMs,
    };
  }
  return null;
}
