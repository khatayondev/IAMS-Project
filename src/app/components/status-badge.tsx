const statusColors: Record<string, string> = {
  Approved: "bg-emerald-100 text-emerald-700",
  Active: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
  Completed: "bg-violet-100 text-violet-700",
  Archived: "bg-gray-200 text-gray-600",
  Upcoming: "bg-cyan-100 text-cyan-700",
  "Company Accepted": "bg-teal-100 text-teal-700",
  Submitted: "bg-indigo-100 text-indigo-700",
};

export function StatusBadge({ status }: { status: string | any }) {
  const statusStr = typeof status === "string" ? status : (status?.name ?? status?.status ?? String(status) ?? "Unknown");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${statusColors[statusStr] || "bg-gray-100 text-gray-700"}`}
      style={{ fontSize: "0.75rem" }}
    >
      {statusStr}
    </span>
  );
}
