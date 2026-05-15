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
      <p>모노레포 비교 실험용 React Router v7 Framework Mode 앱입니다.</p>
      <p>
        쇼핑몰 SSR 상세:{" "}
        <Link to="/shop/wireless-headphones-x1">
          /shop/wireless-headphones-x1
        </Link>
      </p>
    </main>
  );
}
