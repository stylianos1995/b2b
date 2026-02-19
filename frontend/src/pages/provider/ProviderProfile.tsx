import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createProvider,
  getProvider,
  updateProvider,
  type CreateProviderBody,
} from "../../api/provider";
import type { ProviderPublic } from "../../types";

const PROVIDER_TYPES = [
  "food_wholesaler",
  "beverage_distributor",
  "coffee_roaster",
  "bakery",
  "meat_fish",
  "cleaning",
  "equipment",
  "logistics",
  "producer",
  "other",
];

const emptyProviderForm: CreateProviderBody = {
  legal_name: "",
  trading_name: "",
  provider_type: "food_wholesaler",
  address_line_1: "",
  city: "",
  region: "",
  postal_code: "",
  country: "GB",
};

export function ProviderProfile() {
  const { providerId, refreshUser } = useAuth();
  const [provider, setProvider] = useState<ProviderPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProviderBody>(emptyProviderForm);

  useEffect(() => {
    if (providerId) {
      getProvider(providerId)
        .then((r) => {
          setProvider(r);
          setForm((f) => ({
            ...f,
            legal_name: r.legal_name,
            trading_name: r.trading_name,
            provider_type: r.provider_type,
          }));
        })
        .catch(() => setError("Failed to load"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [providerId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createProvider(form);
      setSuccess("Provider created.");
      await refreshUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId) return;
    setError(null);
    try {
      await updateProvider(providerId, form);
      setSuccess("Profile updated.");
      const r = await getProvider(providerId);
      setProvider(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading && providerId) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Provider profile</h1>
      <p className="dashboard-subtitle">Your company details and trading information.</p>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {!provider ? (
        <div className="dashboard-card">
          <h2 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>Create provider</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Legal name</label>
              <input
                value={form.legal_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, legal_name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Trading name</label>
              <input
                value={form.trading_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trading_name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Provider type</label>
              <select
                value={form.provider_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, provider_type: e.target.value }))
                }
              >
                {PROVIDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Address line 1</label>
              <input
                value={form.address_line_1}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address_line_1: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Region</label>
              <input
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Postal code</label>
              <input
                value={form.postal_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, postal_code: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
                required
                maxLength={2}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Create provider
            </button>
          </form>
        </div>
      ) : (
        <div className="dashboard-card">
          <p>
            <strong>{provider.trading_name}</strong> ({provider.legal_name}) ·{" "}
            {provider.provider_type} · {provider.status}
          </p>
          <form onSubmit={handleUpdate} style={{ marginTop: "1rem" }}>
            <div className="form-group">
              <label>Legal name</label>
              <input
                value={form.legal_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, legal_name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Trading name</label>
              <input
                value={form.trading_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trading_name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Provider type</label>
              <select
                value={form.provider_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, provider_type: e.target.value }))
                }
              >
                {PROVIDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Update
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
