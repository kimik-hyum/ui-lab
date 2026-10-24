import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LabIcon from "../../components/LabIcon";

export const metadata: Metadata = {
  title: "Termia · 지도 편집기 | UI-LAB",
  description: "지도 위에 도형을 그리고, 영역을 합치거나 반경을 만들 수 있는 웹 지도 편집기입니다.",
};

const features = [
  {
    icon: "panel",
    title: "도형과 정점 편집",
    description: "영역을 직접 그리거나 기존 도형의 꼭짓점을 옮겨 경계를 다듬습니다. 레이어를 숨기거나 잠가 편집할 대상을 관리할 수 있습니다.",
  },
  {
    icon: "layers",
    title: "영역 연산과 반경 생성",
    description: "겹치는 영역을 합치거나 빼고, 지점을 중심으로 일정 거리의 반경을 만듭니다. 여러 구역을 조합해 필요한 범위를 구성해 보세요.",
  },
  {
    icon: "arrow-up-right",
    title: "기존 서비스와 연결",
    description: "서비스의 도형을 새 편집 창으로 보내고, 완료한 결과를 돌려받습니다. 편집 결과를 원래 화면에 반영하거나 저장하는 흐름으로 연결할 수 있습니다.",
  },
] as const;

export default function MapsEditorPage() {
  return (
    <main className="workspace-page">
      <div className="w-full space-y-6">
        <Link
          href="/void-ui"
          className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <LabIcon name="arrow-right" className="h-3.5 w-3.5 rotate-180" />
          실험실로 돌아가기
        </Link>

        <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card lg:min-h-[520px] lg:flex-row xl:min-h-[560px]">
          <div className="relative flex shrink-0 items-center border-b border-border bg-[#edf3ed] lg:w-[54%] lg:border-r lg:border-b-0">
            <Image
              src="/images/termia-map.svg"
              alt="도로와 강 위에 편집 중인 영역과 위치 핀이 표시된 지도 일러스트"
              width={1200}
              height={800}
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="eager"
              className="h-auto w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center p-7 sm:p-10 xl:p-12 2xl:p-14">
            <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-teal-700">
              TERMIA / MAP EDITOR
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">Termia</h1>
            <p className="mt-3 text-xl font-medium tracking-tight text-foreground sm:text-2xl">
              지도 위에, 나만의 영역을.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
              도형을 그리고, 영역을 합치고, 원하는 반경을 만들어 보세요.
              Termia는 지도 위의 공간을 손쉽게 다듬는 웹 편집기입니다.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
              배송 권역, 영업 구역, 시설 주변의 범위처럼 직접 경계를 정해야 할 때 활용할 수 있습니다.
              기존 도형을 불러와 수정하고, 완성한 결과를 내 서비스로 가져오세요.
            </p>

            <div className="mt-8">
              <a
                href="https://maps-editor.pages.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 sm:w-auto"
              >
                Termia로 이동
                <LabIcon name="arrow-up-right" className="h-4 w-4" />
                <span className="sr-only"> (새 탭에서 열림)</span>
              </a>
              <p className="mt-3 text-[11px] text-subtle-foreground">새 탭에서 Termia 사이트가 열립니다.</p>
            </div>
          </div>
        </article>

        <section aria-labelledby="termia-features-title" className="space-y-4 pt-2">
          <h2 id="termia-features-title" className="text-lg font-semibold tracking-tight">
            경계를 만들고, 다듬고, 서비스로 연결하세요.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-xl border border-border bg-card p-6 xl:p-7">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <LabIcon name={feature.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
