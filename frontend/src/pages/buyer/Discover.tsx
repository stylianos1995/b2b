import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProviders } from "../../api/discovery";
import type { ProviderPublic } from "../../types";

const PROVIDER_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "food_wholesaler", label: "Food wholesaler" },
  { value: "beverage_distributor", label: "Beverage distributor" },
  { value: "coffee_roaster", label: "Coffee roaster" },
  { value: "bakery", label: "Bakery" },
  { value: "meat_fish", label: "Meat & fish" },
  { value: "cleaning", label: "Cleaning" },
  { value: "equipment", label: "Equipment" },
  { value: "logistics", label: "Logistics" },
  { value: "producer", label: "Producer" },
  { value: "other", label: "Other" },
];

export function Discover() {
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerTypeFilter, setProviderTypeFilter] = useState("");
  const [postcodeFilter, setPostcodeFilter] = useState("");

  useEffect(() => {
    getProviders({
      limit: 50,
      provider_type: providerTypeFilter || undefined,
      postcode: postcodeFilter.trim() || undefined,
    })
      .then((res) => {
        const raw =
          (res as { items?: Array<Record<string, unknown>> }).items ?? [];
        setProviders(
          raw.map((p) => ({
            ...p,
            id: (p.provider_id ?? p.id) as string,
          })) as ProviderPublic[]
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [providerTypeFilter, postcodeFilter]);

  if (loading) return <div className="dashboard-loading">Loading providers...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Discover providers</h1>
      <p className="dashboard-subtitle">Browse suppliers and place orders from their catalogs.</p>
      <div className="dashboard-filters" style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <label style={{ fontWeight: 600, color: "#334155" }}>
          Provider type
          <select
            value={providerTypeFilter}
            onChange={(e) => setProviderTypeFilter(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.35rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", minWidth: 160 }}
          >
            {PROVIDER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 600, color: "#334155" }}>
          Location (postcode)
          <input
            type="text"
            placeholder="e.g. SW1A 1AA"
            value={postcodeFilter}
            onChange={(e) => setPostcodeFilter(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.35rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", width: 120 }}
          />
        </label>
      </div>
      {providers.length === 0 ? (
        <div className="dashboard-empty">No providers found.</div>
      ) : (
        <div className="dashboard-list">
          {providers.map((p) => (
            <div
              key={p.id}
              className="dashboard-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <strong style={{ color: "#1e293b", fontSize: "1rem" }}>{p.trading_name}</strong>
                <span style={{ color: "#64748b", fontSize: "0.875rem", marginLeft: "0.5rem" }}>
                  {p.provider_type?.replace(/_/g, " ") ?? ""}
                </span>
              </div>
              <Link
                to={`/buyer/providers/${p.id}`}
                className="btn btn-primary"
                style={{ borderRadius: 8, textDecoration: "none" }}
              >
                View catalog & order
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
