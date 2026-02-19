import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createBusiness,
  getBusiness,
  getLocations,
  addLocation,
  type CreateBusinessBody,
  type CreateLocationBody,
} from "../../api/business";
import type { Business, Location } from "../../types";

const BUSINESS_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "hotel",
  "catering",
  "other",
];

export function BuyerBusiness() {
  const { businessId, refreshUser } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<
    CreateBusinessBody & Partial<CreateLocationBody>
  >({
    legal_name: "",
    trading_name: "",
    business_type: "restaurant",
    address_line_1: "",
    city: "",
    region: "",
    postal_code: "",
    country: "GB",
  });
  const [addLocForm, setAddLocForm] = useState<CreateLocationBody>({
    address_line_1: "",
    city: "",
    region: "",
    postal_code: "",
    country: "GB",
    location_type: "delivery_address",
  });

  useEffect(() => {
    if (businessId) {
      getBusiness(businessId)
        .then(setBusiness)
        .catch(() => setError("Failed to load business"))
        .finally(() => setLoading(false));
      getLocations(businessId)
        .then(setLocations)
        .catch(() => {});
    } else {
      setLoading(false);
    }
  }, [businessId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = (await createBusiness(form)) as unknown as {
        business_id: string;
      };
      setSuccess("Business created.");
      await refreshUser();
      const b = await getBusiness(res.business_id);
      setBusiness(b);
      const locs = await getLocations(res.business_id);
      setLocations(locs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setError(null);
    try {
      await addLocation(businessId, addLocForm);
      setSuccess("Address added.");
      const locs = await getLocations(businessId);
      setLocations(locs);
      setAddLocForm({
        address_line_1: "",
        city: "",
        region: "",
        postal_code: "",
        country: "GB",
        location_type: "delivery_address",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading && businessId) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">My Business</h1>
      <p className="dashboard-subtitle">Your company details and delivery addresses.</p>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {!business ? (
        <div className="dashboard-card">
          <h2>Create business</h2>
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
              <label>Business type</label>
              <select
                value={form.business_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_type: e.target.value }))
                }
              >
                {BUSINESS_TYPES.map((t) => (
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
              Create business
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="dashboard-card">
            <p>
              <strong>{business.trading_name}</strong> ({business.legal_name}) ·{" "}
              {business.business_type} · {business.status}
            </p>
          </div>
          <div className="dashboard-card">
            <h2>Delivery addresses</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {locations.map((loc) => (
                <li key={loc.id} style={{ marginBottom: "0.5rem" }}>
                  {loc.address_line_1}, {loc.city} {loc.postal_code},{" "}
                  {loc.country} {loc.is_default && "(default)"}
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddLocation} style={{ marginTop: "1rem" }}>
              <h3>Add address</h3>
              <div className="form-group">
                <label>Address line 1</label>
                <input
                  value={addLocForm.address_line_1}
                  onChange={(e) =>
                    setAddLocForm((f) => ({
                      ...f,
                      address_line_1: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  value={addLocForm.city}
                  onChange={(e) =>
                    setAddLocForm((f) => ({ ...f, city: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input
                  value={addLocForm.region}
                  onChange={(e) =>
                    setAddLocForm((f) => ({ ...f, region: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Postal code</label>
                <input
                  value={addLocForm.postal_code}
                  onChange={(e) =>
                    setAddLocForm((f) => ({
                      ...f,
                      postal_code: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  value={addLocForm.country}
                  onChange={(e) =>
                    setAddLocForm((f) => ({ ...f, country: e.target.value }))
                  }
                  required
                  maxLength={2}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add address
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
