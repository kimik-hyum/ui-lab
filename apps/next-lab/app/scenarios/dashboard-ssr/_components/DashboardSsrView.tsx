import type { DashboardData } from "../../../../../../fixtures/dashboard-ssr-types";

export default function DashboardSsrView({ data, delayMs }: { data: DashboardData; delayMs: number }) {
  return (
    <main
      className="ssr-dashboard"
      data-dashboard-ssr="v1"
      data-framework="next"
      data-render-mode="blocking"
      data-team-id={data.team.id}
      data-delay-ms={delayMs}
    >
      <p className="ssr-dashboard__eyebrow">{data.team.name}</p>
      <h1>{data.title}</h1>
      <section className="ssr-dashboard__summary" aria-label="작업 요약">
        {data.summary.map((item) => (
          <div className="ssr-dashboard__metric" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>
      <section aria-labelledby="recent-activities">
        <h2 id="recent-activities">최근 활동</h2>
        {data.activities.length > 0 ? (
          <ol className="ssr-dashboard__activities">
            {data.activities.map((activity) => (
              <li key={activity.id} data-activity-id={activity.id}>
                <h3>{activity.title}</h3>
                <p>{activity.status} · {activity.owner} · {activity.time}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ssr-dashboard__empty">아직 기록된 활동이 없습니다.</p>
        )}
      </section>
      <p className="ssr-dashboard__ready" data-dashboard-ready="v1">서버에서 준비한 작업 현황</p>
    </main>
  );
}
