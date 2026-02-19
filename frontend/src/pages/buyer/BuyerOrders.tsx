import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listBuyerOrders, cancelOrder } from "../../api/orders";
import type { Order } from "../../types";

export function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBuyerOrders({ limit: 50 })
      .then((res) => {
        const raw = Array.isArray((res as { items?: Order[] }).items)
          ? (res as { items: Order[] }).items
          : Array.isArray((res as { data?: Order[] }).data)
            ? (res as { data: Order[] }).data
            : [];
        setOrders(
          raw.map((o) => ({
            ...o,
            id: (o as { id?: string; order_id?: string }).id ?? (o as { order_id?: string }).order_id ?? '',
          }))
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this order?")) return;
    try {
      await cancelOrder(id);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading) return <div className="dashboard-loading">Loading orders...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">My orders</h1>
      <p className="dashboard-subtitle">Track and manage your orders with suppliers.</p>
      {orders.length === 0 ? (
        <div className="dashboard-empty">
          <p style={{ margin: "0 0 0.75rem 0" }}>No orders yet.</p>
          <Link to="/buyer/discover" className="btn btn-primary" style={{ borderRadius: 8 }}>
            Discover providers
          </Link>
        </div>
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
                <span className={`dashboard-status dashboard-status--${o.status === "cancelled" ? "cancelled" : o.status === "delivered" ? "delivered" : "pending"}`}>
                  {o.status}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                  {o.total} {o.currency}
                  {o.requested_delivery_date && ` · Delivery: ${o.requested_delivery_date}`}
                </span>
              </div>
              <div>
                {(o.status === "submitted" || o.status === "pending") && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleCancel(o.id)}
                    style={{ borderRadius: 8 }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
