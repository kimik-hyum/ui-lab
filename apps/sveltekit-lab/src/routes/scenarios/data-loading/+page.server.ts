const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const load = async () => {
  const startedAt = Date.now();
  await wait(250);

  return {
    framework: 'sveltekit',
    message: 'load()에서 데이터를 로드했습니다.',
    elapsedMs: Date.now() - startedAt,
    renderedAt: new Date().toISOString(),
  };
};
