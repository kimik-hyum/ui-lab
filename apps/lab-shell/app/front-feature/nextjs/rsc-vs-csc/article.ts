export type Article = {
  id: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

export const DEMO_ARTICLE: Article = {
  id: "rendering-guide",
  title: "같은 콘텐츠, 다른 데이터 전달",
  intro: "양쪽은 같은 고정 아티클을 표시합니다. 데이터가 준비된 뒤 브라우저까지 전달되는 경로를 살펴보세요.",
  sections: [
    {
      heading: "브라우저에서 데이터 요청",
      body: "왼쪽은 useEffect에서 API를 요청하고 JSON을 받은 뒤 화면을 갱신합니다. 요청 중 상태와 오류, 취소를 클라이언트에서 관리합니다.",
    },
    {
      heading: "서버에서 콘텐츠 준비",
      body: "오른쪽은 async Server Component가 데이터를 기다린 뒤 아티클을 렌더링합니다. 새 문서의 HTML에 본문이 포함되며 아티클을 위한 브라우저 API 요청은 없습니다.",
    },
    {
      heading: "이 실험에서 비교하는 범위",
      body: "서버 인공지연과 데이터는 같습니다. API 요청과 새 문서 요청은 시작 조건과 처리 비용이 다르므로, 이 화면으로 렌더링 성능의 순위를 정하지 않습니다.",
    },
  ],
};
