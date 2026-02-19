import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProvider, getProviderProducts } from "../../api/discovery";
import { placeOrder } from "../../api/orders";
import { getLocations } from "../../api/business";
import { useAuth } from "../../context/AuthContext";
import type { ProviderPublic, Product } from "../../types";
import type { CartLine } from "../../types";

/** Parse size (e.g. "2L", "500ml") to multiplier in base unit. Returns null if unparseable. */
function sizeToBaseMultiplier(size: string, baseUnit: string): number | null {
  const s = (size || "").trim();
  const lower = s.toLowerCase();
  const base = (baseUnit || "").toLowerCase();
  if (base === "l" || base === "lt" || base === "litre" || base === "liter") {
    if (lower.endsWith("ml")) {
      const n = parseFloat(s.slice(0, -2));
      return Number.isFinite(n) ? n / 1000 : null;
    }
    if (lower.endsWith("l")) {
      const n = parseFloat(s.slice(0, -1));
      return Number.isFinite(n) ? n : null;
    }
  }
  if (base === "kg") {
    if (lower.endsWith("g") && !lower.endsWith("kg")) {
      const n = parseFloat(s.slice(0, -1));
      return Number.isFinite(n) ? n / 1000 : null;
    }
    if (lower.endsWith("kg")) {
      const n = parseFloat(s.slice(0, -2));
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

export function ProviderCatalog() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { businessId } = useAuth();
  const [provider, setProvider] = useState<ProviderPublic | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<
    Array<{
      id: string;
      address_line_1: string;
      city: string;
      postal_code: string;
    }>
  >([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryLocationId, setDeliveryLocationId] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    Promise.all([
      getProvider(providerId).then((r) =>
        setProvider({
          ...r,
          id: (r as unknown as Record<string, string>).provider_id ?? r.id,
        } as ProviderPublic)
      ),
      getProviderProducts(providerId, { limit: 100 }).then((res) => {
        const raw =
          (res as { items?: Array<Record<string, unknown>> }).items ?? [];
        setProducts(
          raw.map((p) => ({
            ...p,
            id: (p.product_id ?? p.id) as string,
            tax_rate: p.tax_rate ?? 0,
            is_active: true,
          })) as Product[]
        );
      }),
      businessId
        ? getLocations(businessId).then(setLocations)
        : Promise.resolve([]),
    ])
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [providerId, businessId]);

  function addToCart(
    p: Product,
    qty: number,
    chosenSize?: string
  ) {
    setAddError(null);
    if (qty <= 0) return;
    const hasFixedSizes = p.allowed_sizes && p.allowed_sizes.length > 0;
    if (hasFixedSizes) {
      if (!chosenSize || !p.allowed_sizes!.includes(chosenSize)) {
        setAddError(`Choose a valid size for ${p.name}: ${p.allowed_sizes!.join(", ")}`);
        return;
      }
      if (!Number.isInteger(qty) || qty < 1) {
        setAddError(`Quantity for ${p.name} must be a whole number.`);
        return;
      }
    } else if (chosenSize) {
      setAddError(`${p.name} is not sold in fixed sizes. Enter quantity in ${p.unit}.`);
      return;
    }

    const unit = hasFixedSizes ? chosenSize! : p.unit;
    const multiplier = hasFixedSizes && chosenSize
      ? sizeToBaseMultiplier(chosenSize, p.unit)
      : 1;
    const unitPrice = multiplier != null ? p.price * multiplier : p.price;

    setCart((prev) => {
      const i = prev.findIndex(
        (l) => l.product_id === p.id && (hasFixedSizes ? l.unit === chosenSize : true)
      );
      const next =
        i >= 0
          ? [...prev]
          : [
              ...prev,
              {
                product_id: p.id,
                name: p.name,
                sku: p.sku,
                unit,
                unit_price: unitPrice,
                currency: p.currency,
                quantity: 0,
              },
            ];
      const idx = i >= 0 ? i : next.length - 1;
      next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
      return next;
    });
  }

  function removeFromCart(productId: string, unit?: string) {
    setCart((prev) =>
      prev.filter(
        (l) => l.product_id !== productId || (unit != null && l.unit !== unit)
      )
    );
  }

  async function handlePlaceOrder() {
    if (
      !providerId ||
      !businessId ||
      !deliveryDate ||
      !deliveryLocationId ||
      cart.length === 0
    ) {
      setError("Select delivery address, date, and add items to cart.");
      return;
    }
    setError(null);
    setAddError(null);
    setPlacing(true);
    try {
      await placeOrder({
        provider_id: providerId,
        delivery_location_id: deliveryLocationId,
        requested_delivery_date: deliveryDate,
        lines: cart.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          ...(l.unit && { unit: l.unit }),
        })),
      });
      setCart([]);
      navigate("/buyer/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  if (loading || !providerId) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">{provider?.trading_name ?? "Catalog"}</h1>
      <p className="dashboard-subtitle">Browse products and add to order.</p>
      {error && <p className="error">{error}</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "1.5rem",
        }}
      >
        <div>
          <h2>Products</h2>
          {addError && <p className="error" style={{ marginBottom: "0.5rem" }}>{addError}</p>}
          {products.map((p) => {
            const hasFixedSizes = p.allowed_sizes && p.allowed_sizes.length > 0;
            return (
              <div
                key={p.id}
                className="dashboard-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                  gap: "1rem",
                }}
              >
                {p.image_urls?.[0] ? (
                  <img
                    src={p.image_urls[0]}
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 6,
                      flexShrink: 0,
                      background: "#f1f5f9",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{p.name}</strong>
                  <span style={{ marginLeft: "0.5rem", color: "var(--text-muted)" }}>
                    — {p.price} {p.currency} per {p.unit}
                  </span>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    SKU: {p.sku}
                    {hasFixedSizes && (
                      <> · Sold in: {p.allowed_sizes!.join(", ")} only (e.g. 2.3L not valid)</>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {hasFixedSizes ? (
                    <>
                      <select id={`size-${p.id}`} style={{ minWidth: 80 }}>
                        <option value="">Size</option>
                        {p.allowed_sizes!.map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        defaultValue={1}
                        style={{ width: 56 }}
                        id={`qty-${p.id}`}
                      />
                    </>
                  ) : (
                    <input
                      type="number"
                      min={0.001}
                      step={0.1}
                      defaultValue={1}
                      style={{ width: 60 }}
                      id={`qty-${p.id}`}
                    />
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const qty = Number(
                        (document.getElementById(`qty-${p.id}`) as HTMLInputElement)?.value || 1
                      );
                      const chosenSize = hasFixedSizes
                        ? (document.getElementById(`size-${p.id}`) as HTMLSelectElement)?.value
                        : undefined;
                      addToCart(p, qty, chosenSize);
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="dashboard-card">
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p>Cart is empty.</p>
          ) : (
            <>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {cart.map((l) => (
                  <li
                    key={`${l.product_id}-${l.unit}`}
                    style={{
                      marginBottom: "0.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    {l.name} × {l.quantity} {l.unit} = {l.currency ?? "GBP"}{" "}
                    {(l.quantity * (l.unit_price ?? 0)).toFixed(2)}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "0.2rem 0.5rem" }}
                      onClick={() => removeFromCart(l.product_id, l.unit)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="form-group">
                <label>Delivery address</label>
                <select
                  value={deliveryLocationId}
                  onChange={(e) => setDeliveryLocationId(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.address_line_1}, {loc.city} {loc.postal_code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Requested delivery date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? "Placing..." : "Place order"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
