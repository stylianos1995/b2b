import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProviderOrder,
  confirmOrder,
  rejectOrder,
  updateOrderStatus,
} from "../../api/orders";
import { getDelivery, updateDelivery } from "../../api/delivery";
import { createInvoiceFromOrder } from "../../api/invoices";
import type { Order } from "../../types";
import type { Delivery } from "../../types";

export function ProviderOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    getProviderOrder(orderId)
      .then((o) => {
        setOrder(o);
        if (o.delivery_id) return getDelivery(o.delivery_id).then(setDelivery);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleConfirm() {
    if (!orderId) return;
    setError(null);
    setAction("confirm");
    try {
      const o = await confirmOrder(orderId);
      setOrder(o);
      if (o.delivery_id) setDelivery(await getDelivery(o.delivery_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAction(null);
    }
  }

  async function handleReject() {
    if (!orderId) return;
    const reason = window.prompt("Reason for rejection (optional):");
    setError(null);
    setAction("reject");
    try {
      await rejectOrder(orderId, reason ?? undefined);
      navigate("/provider/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAction(null);
    }
  }

  async function handleStatus(status: string) {
    if (!orderId) return;
    setError(null);
    setAction(status);
    try {
      const o = await updateOrderStatus(orderId, status);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAction(null);
    }
  }

  async function handleDeliveryStatus(status: string) {
    if (!delivery?.id) return;
    setError(null);
    setAction(status);
    try {
      // Backend delivery statuses: scheduled | picked_up | in_transit | delivered | failed
      const apiStatus = status === "dispatched" ? "in_transit" : status;
      const d = await updateDelivery(delivery.id, { status: apiStatus });
      setDelivery(d);
      if (order) {
        if (status === "dispatched") {
          // Also set order to shipped when marking dispatched
          const o = await updateOrderStatus(orderId!, "shipped");
          setOrder(o);
        } else if (status === "delivered") {
          setOrder({ ...order, status: "delivered" });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAction(null);
    }
  }

  async function handleCreateInvoice() {
    if (!orderId) return;
    setError(null);
    setAction("invoice");
    try {
      await createInvoiceFromOrder(orderId);
      navigate("/provider/invoices");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAction(null);
    }
  }

  if (loading) return <div className="dashboard-loading">Loading...</div>;
  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="error">Order not found.</p>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Order {order.order_number}</h1>
      <p className="dashboard-subtitle">View details and manage delivery.</p>
      {error && <p className="error">{error}</p>}
      <div className="dashboard-card">
        <p>
          <strong>Status:</strong> {order.status} · <strong>Total:</strong>{" "}
          {order.total} {order.currency}
        </p>
        <p>Requested delivery: {order.requested_delivery_date}</p>
        {order.lines && order.lines.length > 0 && (
          <ul>
            {order.lines.map((l) => (
              <li key={l.id}>
                {l.name} × {l.quantity} {l.unit} = {l.line_total}
              </li>
            ))}
          </ul>
        )}
      </div>
      {delivery && (
        <div className="dashboard-card">
          <h2>Delivery</h2>
          <p>Status: {delivery.status}</p>
          {order.status === "confirmed" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleStatus("preparing")}
              disabled={!!action}
            >
              Mark preparing
            </button>
          )}
          {(order.status === "preparing" || order.status === "confirmed" || order.status === "shipped") &&
            delivery.status !== "in_transit" &&
            delivery.status !== "dispatched" &&
            delivery.status !== "delivered" && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginLeft: 8 }}
                onClick={() => handleDeliveryStatus("dispatched")}
                disabled={!!action}
              >
                Mark dispatched
              </button>
            )}
          {(delivery.status === "dispatched" || delivery.status === "in_transit") && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginLeft: 8 }}
              onClick={() => handleDeliveryStatus("delivered")}
              disabled={!!action}
            >
              Mark delivered
            </button>
          )}
        </div>
      )}
      <div className="dashboard-card">
        <h2>Actions</h2>
        {order.status === "submitted" && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!!action}
            >
              Confirm order
            </button>
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginLeft: 8 }}
              onClick={handleReject}
              disabled={!!action}
            >
              Reject
            </button>
          </>
        )}
        {order.status === "delivered" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateInvoice}
            disabled={!!action}
          >
            {action === "invoice" ? "Creating..." : "Create invoice"}
          </button>
        )}
      </div>
    </div>
  );
}
