export interface DashboardData {
  team: { id: string; name: string };
  title: string;
  summary: { label: string; value: number }[];
  activities: { id: string; title: string; status: string; owner: string; time: string }[];
}
