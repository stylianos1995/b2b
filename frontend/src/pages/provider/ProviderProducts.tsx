import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProviderProducts, addProduct, deleteProduct } from "../../api/provider";
import type { Product } from "../../types";

const CATEGORIES = [
  "fresh_produce",
  "dry_goods",
  "dairy",
  "beverages",
  "meat_fish",
  "cleaning",
  "other",
];

const CATEGORY_LABELS: Record<string, string> = {
  fresh_produce: "Fresh produce",
  dry_goods: "Dry goods",
  dairy: "Dairy",
  beverages: "Beverages",
  meat_fish: "Meat & fish",
  cleaning: "Cleaning",
  other: "Other",
};

function groupByCategory(products: Product[]): Map<string, Product[]> {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const cat = p.category || "other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(p);
  }
  return map;
}

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 0.5rem 0",
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "capitalize",
};

function CatalogByCategory({
  products,
  deletingId,
  onDelete,
}: {
  products: Product[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  const grouped = useMemo(() => groupByCategory(products), [products]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {CATEGORIES.map((cat) => {
        const list = grouped.get(cat);
        if (!list?.length) return null;
        return (
          <section key={cat}>
            <h3 style={sectionTitleStyle}>
              {CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {list.map((p) => (
                <div
                  key={p.id}
                  className="dashboard-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                      {p.allowed_sizes && p.allowed_sizes.length > 0 && (
                        <> · Sold in: {p.allowed_sizes.join(", ")}</>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onDelete(p.id)}
                    disabled={deletingId === p.id}
                    style={{ flexShrink: 0 }}
                  >
                    {deletingId === p.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {[...grouped.keys()]
        .filter((c) => !CATEGORIES.includes(c))
        .map((cat) => {
          const list = grouped.get(cat)!;
          if (!list?.length) return null;
          return (
            <section key={cat}>
              <h3 style={sectionTitleStyle}>{cat.replace(/_/g, " ")}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {list.map((p) => (
                  <div
                    key={p.id}
                    className="dashboard-card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
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
                        {p.allowed_sizes && p.allowed_sizes.length > 0 && (
                          <> · Sold in: {p.allowed_sizes.join(", ")}</>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onDelete(p.id)}
                      disabled={deletingId === p.id}
                      style={{ flexShrink: 0 }}
                    >
                      {deletingId === p.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

/** Units for pricing and ordering. Decimals allowed for kg, L, g, ml (e.g. 1.5 kg meat). */
const UNITS = [
  { value: "kg", label: "Per kg" },
  { value: "g", label: "Per g" },
  { value: "L", label: "Per L (litre)" },
  { value: "ml", label: "Per ml" },
  { value: "unit", label: "Per unit (each)" },
  { value: "box", label: "Per box" },
  { value: "pack", label: "Per pack" },
  { value: "case", label: "Per case" },
] as const;

const CURRENCIES = [
  { value: "EUR", label: "EUR (Euro)" },
  { value: "GBP", label: "GBP (British Pound)" },
  { value: "USD", label: "USD (US Dollar)" },
  { value: "CHF", label: "CHF (Swiss Franc)" },
] as const;

function InfoIcon({ title }: { title: string }) {
  return (
    <span
      title={title}
      style={{
        marginLeft: "0.35rem",
        cursor: "help",
        opacity: 0.7,
        fontSize: "1rem",
        verticalAlign: "middle",
      }}
      aria-label={title}
    >
      ⓘ
    </span>
  );
}

export function ProviderProducts() {
  const { providerId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "fresh_produce",
    unit: "unit",
    price: 0,
    currency: "EUR",
    tax_rate: 0,
    allowedSizesInput: "",
    imageUrlsInput: "",
  });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) return;
    getProviderProducts(providerId)
      .then(setProducts)
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [providerId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId) return;
    setError(null);
    setAdding(true);
    try {
      const allowed_sizes = form.allowedSizesInput
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const image_urls = form.imageUrlsInput
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (image_urls.some((u) => !/^https?:\/\/.+/i.test(u))) {
        setError("Each image must be a valid http(s) URL. Max 3 URLs.");
        setAdding(false);
        return;
      }
      await addProduct(providerId, {
        sku: form.sku,
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        price: form.price,
        currency: form.currency,
        tax_rate: form.tax_rate,
        ...(allowed_sizes.length > 0 && { allowed_sizes }),
        ...(image_urls.length > 0 && { image_urls }),
      });
      const list = await getProviderProducts(providerId);
      setProducts(list);
      setForm({
        sku: "",
        name: "",
        category: "fresh_produce",
        unit: "unit",
        price: 0,
        currency: "EUR",
        tax_rate: 0,
        allowedSizesInput: "",
        imageUrlsInput: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!providerId) return;
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setError(null);
    setDeletingId(productId);
    try {
      await deleteProduct(providerId, productId);
      const list = await getProviderProducts(providerId);
      setProducts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  if (!providerId) return <p>Create a provider first.</p>;
  if (loading) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Products</h1>
      <p className="dashboard-subtitle">Manage your product catalog.</p>
      {error && <p className="error">{error}</p>}
      <div className="dashboard-card">
        <h2 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>Add product</h2>
        <form onSubmit={handleAdd}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label>SKU</label>
              <input
                value={form.sku}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sku: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>
                Name (plain title)
                <InfoIcon title="Use a plain name only; set sizes below if sold in fixed options." />
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Pasta, Olive Oil"
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Unit
                <InfoIcon title="Buyers can order decimal amounts for kg, L, g, ml (e.g. 1.5 kg)." />
              </label>
              <select
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
                required
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Sold in fixed sizes only (optional)
                <InfoIcon title="Leave empty for any quantity. Otherwise buyers can only choose from these (e.g. 2.3L = not valid)." />
              </label>
              <input
                value={form.allowedSizesInput}
                onChange={(e) =>
                  setForm((f) => ({ ...f, allowedSizesInput: e.target.value }))
                }
                placeholder="e.g. 500ml, 1L, 2L, 5L, 10L"
              />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step={0.01}
                min={0}
                value={form.price || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: Number(e.target.value) }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>
                Add image (URLs)
                <InfoIcon title="Up to 3 image URLs, one per line. Recommended: JPEG, PNG or WebP. Max 800×800px and under 500KB per image so the catalog stays fast." />
              </label>
              <textarea
                value={form.imageUrlsInput}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrlsInput: e.target.value }))
                }
                placeholder="https://example.com/image1.jpg"
                rows={2}
                style={{ resize: "vertical", minHeight: 56 }}
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                required
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding}>
            {adding ? "Adding..." : "Add product"}
          </button>
        </form>
      </div>
      <h2>Catalog</h2>
      {products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <CatalogByCategory
          products={products}
          deletingId={deletingId}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
