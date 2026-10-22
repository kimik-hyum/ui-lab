import fixture from '../../../../../../fixtures/dashboard-ssr.json';
import type { DashboardData } from '../../../../../../fixtures/dashboard-ssr-types';

export async function getDashboardSsr(query: URLSearchParams): Promise<{
  dashboard: DashboardData | null;
  delayMs: number;
}> {
  const rawDelay = query.get('delay');
  const delayMs = rawDelay === '0' ? 0 : rawDelay === '800' ? 800 : 400;
  const teamId = query.get('team') || 'alpha';

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
  return { dashboard: null, delayMs };
}
