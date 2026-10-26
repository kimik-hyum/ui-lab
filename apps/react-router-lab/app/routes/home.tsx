import { Link } from "react-router";

export function meta() {
  return [
    { title: "React Router Lab" },
    { name: "description", content: "React Router Framework Mode SSR lab" },
  ];
}

export default function Home() {
  return (
    <main>
      <h1>React Router Lab</h1>
      <p>모노레포 비교 실험용 React Router v8 Framework Mode 앱입니다.</p>
      <p>
        쇼핑몰 SSR 상세 시나리오:{" "}
        <Link to="/scenarios/shopping-detail-ssr">
          /scenarios/shopping-detail-ssr
        </Link>
      </p>
    </main>
  );
}
