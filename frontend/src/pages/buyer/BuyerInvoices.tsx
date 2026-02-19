import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listBuyerInvoices, createCheckoutSession, downloadInvoicePdf } from "../../api/invoices";

interface InvoiceItem {
  invoice_id: string;
  invoice_number: string;
  provider_id: string;
  status: string;
  total: string | number;
  currency: string;
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export function BuyerInvoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const loadInvoices = useCallback(() => {
    setLoading(true);
    setError(null);
    listBuyerInvoices()
      .then((res) => {
        setInvoices(res.items ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (success) {
      setSuccessMessage("Payment successful.");
      setSearchParams({}, { replace: true });
      loadInvoices();
      const t = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success, loadInvoices, setSearchParams]);

  useEffect(() => {
    if (canceled) {
      setSearchParams({}, { replace: true });
    }
  }, [canceled]);

  async function handlePay(invoiceId: string) {
    setError(null);
    setPayingId(invoiceId);
    try {
      const { url } = await createCheckoutSession(invoiceId);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start payment");
      setPayingId(null);
    }
  }

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

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">My invoices</h1>
      <p className="dashboard-subtitle">View and pay your invoices.</p>
      {successMessage && (
        <p className="success" style={{ marginBottom: "1rem" }}>
          {successMessage}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      {invoices.length === 0 ? (
        <div className="dashboard-empty">No invoices yet.</div>
      ) : (
        <div className="dashboard-list">
          {invoices.map((inv) => (
            <div
              key={inv.invoice_id}
              className="dashboard-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div>
                <strong style={{ color: "#1e293b" }}>{inv.invoice_number}</strong>
                <span className={`dashboard-status ${inv.status === "paid" ? "dashboard-status--paid" : "dashboard-status--pending"}`} style={{ marginLeft: "0.5rem" }}>
                  {inv.status === "paid" ? "Paid" : "Unpaid"}
                </span>
                <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                  {Number(inv.total).toFixed(2)} {inv.currency}
                  {inv.due_date && ` · Due ${inv.due_date}`}
                  {inv.paid_at && inv.status === "paid" && ` · Paid ${inv.paid_at.split("T")[0]}`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={downloadingId === inv.invoice_id}
                  onClick={() => handleDownloadPdf(inv.invoice_id)}
                  style={{ borderRadius: 8 }}
                >
                  {downloadingId === inv.invoice_id ? "Downloading…" : "Download PDF"}
                </button>
                {inv.status !== "paid" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={payingId === inv.invoice_id}
                    onClick={() => handlePay(inv.invoice_id)}
                    style={{ borderRadius: 8 }}
                  >
                    {payingId === inv.invoice_id ? "Redirecting…" : "Pay invoice"}
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
