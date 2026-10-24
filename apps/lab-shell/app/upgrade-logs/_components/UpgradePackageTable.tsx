import type { PackageChange } from "../_lib/types";

export default function UpgradePackageTable({ packages }: { packages: PackageChange[] }) {
  const primary = packages[0];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <p className="px-5 py-4 text-sm text-slate-600">
        <span className="font-mono text-xs">{primary.name}</span>
        <span className="ml-3">{primary.installedBefore} → <strong className="font-medium text-violet-700">{primary.installedAfter ?? "확인 중"}</strong></span>
      </p>
      <details className="border-t border-slate-100">
        <summary className="cursor-pointer px-5 py-3 text-xs text-slate-500 hover:text-violet-700">전체 패키지 {packages.length}개 보기</summary>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">앱별 선언 범위와 실제 설치 버전 변경</caption>
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3 font-medium">앱 / 패키지</th><th className="px-4 py-3 font-medium">변경 전</th><th className="px-4 py-3 font-medium">변경 후</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{packages.map((pkg) => (
              <tr key={`${pkg.workspace}:${pkg.name}`}>
                <th scope="row" className="px-4 py-4 font-normal"><span className="block text-[11px] text-slate-400">{pkg.workspace}</span><span className="mt-1 block font-mono text-xs font-medium text-slate-800">{pkg.name}</span></th>
                <td className="px-4 py-4"><span className="font-mono text-sm text-slate-500">{pkg.installedBefore}</span><span className="mt-1 block text-[10px] text-slate-400">선언 {pkg.declaredBefore}</span></td>
                <td className="px-4 py-4"><span className="font-mono text-sm font-medium text-violet-700">{pkg.installedAfter ?? "확인 중"}</span><span className="mt-1 block text-[10px] text-slate-400">선언 {pkg.declaredAfter}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
