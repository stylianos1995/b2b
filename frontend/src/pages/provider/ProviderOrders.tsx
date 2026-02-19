import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listProviderOrders } from "../../api/orders";
import type { Order } from "../../types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function toLocalDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultWeeklyRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 6); // 7 days including today
  return { from: toLocalDateOnly(from), to: toLocalDateOnly(to) };
}

export function ProviderOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState(() => defaultWeeklyRange().from);
  const [dateTo, setDateTo] = useState(() => defaultWeeklyRange().to);

  useEffect(() => {
    setLoading(true);
    listProviderOrders({
        limit: 50,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      .then((res) => {
        const raw = Array.isArray((res as { items?: Order[] }).items)
          ? (res as { items: Record<string, unknown>[] }).items
          : Array.isArray((res as { data?: Order[] }).data)
            ? (res as { data: Record<string, unknown>[] }).data
            : [];
        setOrders(
          raw.map((o) => ({
            ...o,
            id: (o.order_id ?? o.id) as string,
            order_number: o.order_number,
            status: o.status,
            total: Number(o.total),
            currency: (o.currency as string) ?? "GBP",
            requested_delivery_date: o.requested_delivery_date as string,
          })) as Order[]
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [statusFilter, dateFrom, dateTo]);

  if (loading) return <div className="dashboard-loading">Loading orders...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Orders</h1>
      <p className="dashboard-subtitle">View and fulfill incoming orders.</p>
      <div className="dashboard-filters" style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <label style={{ fontWeight: 600, color: "#334155" }}>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.35rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", minWidth: 140 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 600, color: "#334155" }}>
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.35rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
          />
        </label>
        <label style={{ fontWeight: 600, color: "#334155" }}>
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.35rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
          />
        </label>
      </div>
      {orders.length === 0 ? (
        <div className="dashboard-empty">No orders yet.</div>
      ) : (
        <div className="dashboard-list">
          {orders.map((o) => (
            <div
              key={o.id}
              className="dashboard-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <strong style={{ color: "#1e293b" }}>{o.order_number}</strong>
                <span className={`dashboard-status dashboard-status--${o.status === "delivered" ? "delivered" : o.status === "confirmed" ? "confirmed" : "pending"}`}>
                  {o.status}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                  {o.total} {o.currency}
                  {o.requested_delivery_date && ` · ${o.requested_delivery_date}`}
                </span>
              </div>
              <Link
                to={`/provider/orders/${o.id}`}
                className="btn btn-primary"
                style={{ borderRadius: 8, textDecoration: "none" }}
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
