import { useState, useEffect } from "react";
import { listProviderInvoices, downloadInvoicePdf } from "../../api/invoices";
import type { Invoice } from "../../types";

export function ProviderInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    listProviderInvoices()
      .then(setInvoices)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownloadPdf(invoiceId: string) {
    setError(null);
    setDownloadingId(invoiceId);
    try {
      await downloadInvoicePdf(invoiceId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) return <div className="dashboard-loading">Loading invoices...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Invoices</h1>
      <p className="dashboard-subtitle">Create and track invoices for delivered orders.</p>
      {invoices.length === 0 ? (
        <div className="dashboard-empty">
          No invoices yet. Create an invoice from a delivered order.
        </div>
      ) : (
        <div className="dashboard-list">
          {invoices.map((inv) => (
            <div
              key={inv.id}
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
                <strong style={{ color: "#1e293b" }}>{inv.invoice_number}</strong>
                <span className={`dashboard-status dashboard-status--${inv.status === "paid" ? "paid" : "pending"}`}>
                  {inv.status}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                  {inv.total} {inv.currency} · Due {inv.due_date}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={downloadingId === inv.id}
                onClick={() => handleDownloadPdf(inv.id)}
                style={{ borderRadius: 8 }}
              >
                {downloadingId === inv.id ? "Downloading…" : "Download PDF"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
