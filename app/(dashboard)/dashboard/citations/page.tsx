import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

interface CitationsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CitationsPage({
  searchParams,
}: CitationsPageProps) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id, current_workspace_region_id")
    .eq("id", session.user.id)
    .single();

  const currentWorkspaceId = profile?.current_workspace_id;
  const currentRegionId = profile?.current_workspace_region_id;

  // Load models for filter UI
  const { data: models } = await supabase
    .from("models")
    .select("id, name")
    .order("id");

  const selectedModel = (searchParams?.modelId as string) || "";
  const from = (searchParams?.from as string) || "";
  const to = (searchParams?.to as string) || "";

  let snapsQuery = supabase
    .from("snapshots")
    .select("id, captured_at, model_id")
    .eq("workspace_id", currentWorkspaceId || "");

  // Filter by region if selected
  if (currentRegionId) {
    snapsQuery = snapsQuery.eq("workspace_region_id", currentRegionId);
  }

  snapsQuery = snapsQuery.order("captured_at", { ascending: false }).limit(200);

  if (selectedModel) snapsQuery = snapsQuery.eq("model_id", selectedModel);
  if (from) snapsQuery = snapsQuery.gte("captured_at", from);
  if (to) snapsQuery = snapsQuery.lte("captured_at", to);

  const { data: snaps } = await snapsQuery;

  let rows: { domain: string; count: number; authority: number }[] = [];
  if (snaps && snaps.length > 0) {
    const snapIds = snaps.map((s) => s.id);
    const { data: resIds } = await supabase
      .from("results")
      .select("id")
      .in("snapshot_id", snapIds);
    const rids = (resIds || []).map((r: any) => r.id);
    if (rids.length > 0) {
      const { data: cits } = await supabase
        .from("citations")
        .select("domain, authority_cached")
        .in("result_id", rids);
      const map: Record<
        string,
        { count: number; authSum: number; authN: number }
      > = {};
      (cits || []).forEach((c: any) => {
        const k = c.domain || "";
        if (!k) return;
        if (!map[k]) map[k] = { count: 0, authSum: 0, authN: 0 };
        map[k].count += 1;
        if (typeof c.authority_cached === "number") {
          map[k].authSum += c.authority_cached;
          map[k].authN += 1;
        }
      });
      rows = Object.entries(map)
        .map(([domain, v]) => ({
          domain,
          count: v.count,
          authority: v.authN > 0 ? v.authSum / v.authN : 0,
        }))
        .sort((a, b) => b.count - a.count);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Citations</h1>
        <p className="mt-2 text-gray-600">
          Domains cited by models across recent snapshots
        </p>
      </div>

      {/* Filters */}
      <form
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
        method="get"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Model
          </label>
          <select
            name="modelId"
            defaultValue={selectedModel}
            className="mt-1 rounded-md border border-gray-300 p-2 text-sm"
          >
            <option value="">All</option>
            {(models || []).map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 rounded-md border border-gray-300 p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 rounded-md border border-gray-300 p-2 text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Domain</th>
                <th className="py-2">Mentions</th>
                <th className="py-2">Avg. Authority</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.domain} className="border-t border-gray-100">
                  <td className="py-2">{r.domain}</td>
                  <td className="py-2">{r.count}</td>
                  <td className="py-2">{r.authority.toFixed(2)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={3}>
                    No citations found. Run a measurement to populate data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
