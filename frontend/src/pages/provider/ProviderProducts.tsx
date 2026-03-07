import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProviderProducts, addProduct, deleteProduct, updateProduct } from "../../api/provider";
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
  togglingId,
  onDelete,
  onEdit,
  onToggleActive,
}: {
  products: Product[];
  deletingId: string | null;
  togglingId: string | null;
  onDelete: (id: string) => void;
  onEdit: (p: Product) => void;
  onToggleActive: (p: Product) => void;
}) {
  const grouped = useMemo(() => groupByCategory(products), [products]);
  const categoryKeys = useMemo(() => {
    const fixed = CATEGORIES.filter((c) => grouped.has(c));
    const custom = [...grouped.keys()].filter((c) => !CATEGORIES.includes(c));
    return [...fixed, ...custom];
  }, [grouped]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {categoryKeys.map((cat) => {
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
                    {!p.is_active && (
                      <span style={{ marginLeft: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        (disabled)
                      </span>
                    )}
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
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onToggleActive(p)}
                      disabled={togglingId === p.id}
                      title={p.is_active ? "Hide from buyers" : "Show to buyers"}
                    >
                      {togglingId === p.id ? "…" : p.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onDelete(p.id)}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
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
    categoryOther: "",
    unit: "unit",
    price: 0,
    currency: "EUR",
    tax_rate: 0,
    allowedSizesInput: "",
    imageUrlsInput: "",
  });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "fresh_produce",
    categoryOther: "",
    unit: "unit",
    price: 0,
    currency: "EUR",
    tax_rate: 0,
    allowedSizesInput: "",
    imageUrlsInput: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

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
      const category =
        form.category === "other"
          ? (form.categoryOther.trim() || "other")
          : form.category;
      await addProduct(providerId, {
        sku: form.sku,
        name: form.name.trim(),
        category,
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
        categoryOther: "",
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

  function startEdit(p: Product) {
    const isOther = !CATEGORIES.includes(p.category);
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      category: isOther ? "other" : p.category,
      categoryOther: isOther ? p.category : "",
      unit: p.unit,
      price: typeof p.price === "number" ? p.price : Number(p.price),
      currency: p.currency,
      tax_rate: typeof p.tax_rate === "number" ? p.tax_rate : Number(p.tax_rate),
      allowedSizesInput: (p.allowed_sizes ?? []).join(", "),
      imageUrlsInput: (p.image_urls ?? []).join("\n"),
    });
  }

  function cancelEdit() {
    setEditingProduct(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId || !editingProduct) return;
    setError(null);
    setSavingEdit(true);
    try {
      const allowed_sizes = editForm.allowedSizesInput
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const image_urls = editForm.imageUrlsInput
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (image_urls.some((u) => !/^https?:\/\/.+/i.test(u))) {
        setError("Each image must be a valid http(s) URL. Max 3 URLs.");
        setSavingEdit(false);
        return;
      }
      const category =
        editForm.category === "other"
          ? (editForm.categoryOther.trim() || "other")
          : editForm.category;
      await updateProduct(providerId, editingProduct.id, {
        name: editForm.name.trim(),
        category,
        unit: editForm.unit,
        currency: editForm.currency,
        price: editForm.price,
        tax_rate: editForm.tax_rate,
        ...(allowed_sizes.length > 0 ? { allowed_sizes } : { allowed_sizes: [] }),
        ...(image_urls.length > 0 ? { image_urls } : { image_urls: [] }),
      });
      const list = await getProviderProducts(providerId);
      setProducts(list);
      setEditingProduct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleActive(p: Product) {
    if (!providerId) return;
    setError(null);
    setTogglingId(p.id);
    try {
      await updateProduct(providerId, p.id, { is_active: !p.is_active });
      const list = await getProviderProducts(providerId);
      setProducts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingId(null);
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
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              {form.category === "other" && (
                <input
                  type="text"
                  value={form.categoryOther}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryOther: e.target.value }))
                  }
                  placeholder="Enter category name"
                  maxLength={50}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
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
      {editingProduct && (
        <div className="dashboard-card" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>
            Edit product
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            SKU: <strong>{editingProduct.sku}</strong> (cannot be changed)
          </p>
          <form onSubmit={handleSaveEdit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label>Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
                {editForm.category === "other" && (
                  <input
                    type="text"
                    value={editForm.categoryOther}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, categoryOther: e.target.value }))
                    }
                    placeholder="Enter category name"
                    maxLength={50}
                    style={{ marginTop: "0.5rem" }}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select
                  value={editForm.unit}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, unit: e.target.value }))
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
                <label>Sold in fixed sizes (optional)</label>
                <input
                  value={editForm.allowedSizesInput}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, allowedSizesInput: e.target.value }))
                  }
                  placeholder="e.g. 500ml, 1L, 2L"
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={editForm.price || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  value={editForm.currency}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, currency: e.target.value }))
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
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Image URLs (up to 3)</label>
                <textarea
                  value={editForm.imageUrlsInput}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, imageUrlsInput: e.target.value }))
                  }
                  placeholder="https://..."
                  rows={2}
                  style={{ resize: "vertical", minHeight: 56 }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <h2>Catalog</h2>
      {products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <CatalogByCategory
          products={products}
          deletingId={deletingId}
          togglingId={togglingId}
          onDelete={handleDelete}
          onEdit={startEdit}
          onToggleActive={handleToggleActive}
        />
      )}
    </div>
  );
}
