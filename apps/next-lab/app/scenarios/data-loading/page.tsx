const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadData() {
  const startedAt = Date.now();
  await wait(250);
  return {
    framework: "nextjs",
    message: "Server Component에서 데이터를 로드했습니다.",
    elapsedMs: Date.now() - startedAt,
    renderedAt: new Date().toISOString(),
  };
}

export default async function DataLoadingScenarioPage() {
  const data = await loadData();

  return (
    <main>
      <h1>Scenario: Data Loading (Next.js)</h1>
      <div className="card">
        <p>framework: {data.framework}</p>
        <p>message: {data.message}</p>
        <p>elapsedMs: {data.elapsedMs}</p>
        <p>renderedAt: {data.renderedAt}</p>
      </div>
    </main>
  );
}
