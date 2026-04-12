export type Article = {
  title: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  intro: string;
  sections: { heading: string; body: string }[];
};

export const DEMO_ARTICLE: Article = {
  title: "React Server Components: 번들 없이 렌더하기",
  author: "UI-LAB",
  date: "2025-10-15",
  readTime: "약 8분",
  tags: ["React 19", "RSC", "Performance", "Next.js"],
  intro:
    "React Server Components(RSC)는 컴포넌트를 서버에서만 실행하고 그 결과(HTML + 직렬화된 트리)만 클라이언트로 전송합니다. 컴포넌트 코드 자체는 브라우저에 도달하지 않으므로 JS 번들 크기가 줄어듭니다.",
  sections: [
    {
      heading: "전통적인 CSC 방식의 문제",
      body: "Client Component(CSC)는 데이터를 클라이언트에서 직접 fetch합니다. 페이지 HTML이 먼저 도착하지만 데이터는 비어있고, useEffect가 실행된 후에야 두 번째 네트워크 요청이 시작됩니다. 이 구간이 '로딩 스피너'로 보이는 시간입니다.",
    },
    {
      heading: "RSC가 해결하는 것",
      body: "RSC는 서버에서 async/await로 데이터를 직접 가져온 뒤 완성된 HTML을 응답에 포함시킵니다. 클라이언트는 추가 fetch 없이 첫 응답에서 바로 콘텐츠를 볼 수 있습니다. 대신 TTFB(첫 바이트까지 시간)가 CSC보다 약간 길어집니다.",
    },
    {
      heading: "번들 크기 차이",
      body: "CSC는 컴포넌트 JS와 useState, useEffect 등 훅 코드가 클라이언트 번들에 포함됩니다. RSC는 컴포넌트 코드를 번들에 포함하지 않습니다. Next.js 실측 사례에서 동일한 데이터 집약적 컴포넌트를 RSC로 전환 시 클라이언트 JS 25~50% 감소가 보고됩니다.",
    },
    {
      heading: "언제 CSC가 더 나은가",
      body: "인터랙션이 많은 컴포넌트(입력, 드래그, 실시간 업데이트)는 CSC가 적합합니다. RSC는 상태·이벤트 핸들러를 가질 수 없으므로, 데이터를 보여주는 '리프' 컴포넌트나 레이아웃·페이지 수준에서 가장 효과적입니다.",
    },
  ],
};
