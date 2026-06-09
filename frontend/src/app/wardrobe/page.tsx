"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Heart, Loader2, Pencil, RotateCw, Shirt, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiRequest, toJsonBody } from "@/lib/api";
import { cn } from "@/lib/utils";

type WardrobeItem = {
  id: string;
  name: string;
  category?: string | null;
  subcategory?: string | null;
  gender_fit?: string | null;
  color?: string | null;
  secondary_colors?: string[] | null;
  style_tags?: string[] | null;
  material?: string | null;
  season_tags?: string[] | null;
  image_url?: string | null;
  ai_description?: string | null;
  ai_confidence?: number | string | null;
  is_favorite?: boolean | null;
  times_worn?: number | null;
  last_worn_at?: string | null;
  created_at?: string | null;
};

type WardrobeResponse = {
  items: WardrobeItem[];
};

type EditDraft = {
  name: string;
  category: string;
  subcategory: string;
  gender_fit: string;
  color: string;
  material: string;
  style_tags: string;
  season_tags: string;
  times_worn: string;
};

const emptyDraft: EditDraft = {
  name: "",
  category: "",
  subcategory: "",
  gender_fit: "",
  color: "",
  material: "",
  style_tags: "",
  season_tags: "",
  times_worn: "0",
};

function tagList(value?: string[] | null) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function tagsToText(value?: string[] | null) {
  return tagList(value).join(", ");
}

function textToTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function itemDraft(item: WardrobeItem): EditDraft {
  return {
    name: item.name ?? "",
    category: item.category ?? "",
    subcategory: item.subcategory ?? "",
    gender_fit: item.gender_fit ?? "",
    color: item.color ?? "",
    material: item.material ?? "",
    style_tags: tagsToText(item.style_tags),
    season_tags: tagsToText(item.season_tags),
    times_worn: String(item.times_worn ?? 0),
  };
}

function statLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);

  const stats = useMemo(() => {
    const favorites = items.filter((item) => item.is_favorite).length;
    const categories = new Set(items.map((item) => item.category).filter(Boolean));
    return [
      { label: "Wardrobe items", value: items.length },
      { label: "Favorites", value: favorites },
      { label: "Categories", value: categories.size },
    ];
  }, [items]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<WardrobeResponse>("/api/wardrobe");
      setItems(response.data?.items ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load wardrobe");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function uploadItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const uploadData = new FormData();
    const file = data.get("file");

    ["name", "category", "subcategory", "gender_fit", "color", "material"].forEach((field) => {
      const value = data.get(field);
      if (typeof value === "string" && value.trim()) {
        uploadData.append(field, value.trim());
      }
    });

    if (file instanceof File) {
      uploadData.append("file", file);
    }

    try {
      await apiRequest<{ item: WardrobeItem }>("/api/wardrobe/upload", {
        method: "POST",
        body: uploadData,
      });
      setMessage("Wardrobe item uploaded. Your closet has been refreshed.");
      form.reset();
      await loadItems();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: WardrobeItem) {
    setEditingId(item.id);
    setDraft(itemDraft(item));
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setEditingId("");
    setDraft(emptyDraft);
  }

  async function saveEdit(itemId: string) {
    setBusyId(itemId);
    setError("");
    setMessage("");

    const payload = {
      name: draft.name,
      category: draft.category || null,
      subcategory: draft.subcategory || null,
      gender_fit: draft.gender_fit || null,
      color: draft.color || null,
      material: draft.material || null,
      style_tags: textToTags(draft.style_tags),
      season_tags: textToTags(draft.season_tags),
      times_worn: draft.times_worn ? Number(draft.times_worn) : 0,
    };

    try {
      const response = await apiRequest<{ item: WardrobeItem }>(`/api/wardrobe/${itemId}`, {
        method: "PATCH",
        body: toJsonBody(payload),
      });
      const updated = response.data?.item;
      if (updated) {
        setItems((current) => current.map((item) => (item.id === itemId ? updated : item)));
      } else {
        await loadItems();
      }
      setMessage("Wardrobe item updated.");
      cancelEdit();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Update failed");
    } finally {
      setBusyId("");
    }
  }

  async function toggleFavorite(item: WardrobeItem) {
    setBusyId(item.id);
    setError("");
    setMessage("");
    try {
      const response = await apiRequest<{ item: WardrobeItem }>(`/api/wardrobe/${item.id}`, {
        method: "PATCH",
        body: toJsonBody({ is_favorite: !item.is_favorite }),
      });
      const updated = response.data?.item;
      if (updated) {
        setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update favorite");
    } finally {
      setBusyId("");
    }
  }

  async function analyzeItem(itemId: string) {
    setBusyId(itemId);
    setError("");
    setMessage("");
    try {
      const response = await apiRequest<{ item: WardrobeItem }>(`/api/wardrobe/${itemId}/analyze`, {
        method: "POST",
      });
      const updated = response.data?.item;
      if (updated) {
        setItems((current) => current.map((item) => (item.id === itemId ? updated : item)));
      } else {
        await loadItems();
      }
      setMessage("AI analysis saved to this wardrobe item.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI analysis failed");
    } finally {
      setBusyId("");
    }
  }

  async function deleteItem(itemId: string) {
    const confirmed = window.confirm("Delete this wardrobe item?");
    if (!confirmed) {
      return;
    }

    setBusyId(itemId);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/wardrobe/${itemId}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== itemId));
      setMessage("Wardrobe item deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Delete failed");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] bg-white p-5 shadow-soft sm:p-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <div className="grid size-14 place-items-center rounded-3xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
                <Shirt className="size-7" aria-hidden="true" />
              </div>
              <h1 className="mt-6 text-4xl font-black text-charcoal sm:text-5xl">Digital Wardrobe</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-charcoal/62">
                Upload your clothes, shoes, and bags. Your AI stylist uses these pieces for outfit ideas, wardrobe health, weather styling, and event recommendations.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl bg-charcoal/[0.035] p-4 text-center">
                  <p className="text-2xl font-black text-charcoal">{stat.value}</p>
                  <p className="mt-1 text-xs font-bold text-charcoal/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card className="h-fit p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
                <UploadCloud className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-black text-charcoal">Add wardrobe item</h2>
                <p className="text-sm font-semibold text-charcoal/50">Save the real item image to your closet.</p>
              </div>
            </div>

            <form onSubmit={uploadItem} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-charcoal">Photo</span>
                <input
                  name="file"
                  type="file"
                  accept="image/*"
                  required
                  className="mt-2 w-full rounded-2xl border border-dashed border-fuchsiaBrand/30 bg-fuchsiaBrand/[0.035] px-4 py-4 text-sm font-bold text-charcoal file:mr-4 file:rounded-full file:border-0 file:bg-fuchsiaBrand file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                />
              </label>
              {[
                ["name", "Item name", "Black blazer"],
                ["category", "Category", "Blazer, shirt, dress, shoe, bag"],
                ["subcategory", "Subcategory", "Double breasted, pumps, tote"],
                ["gender_fit", "Fit", "Women, men, unisex"],
                ["color", "Color", "Black"],
                ["material", "Material", "Wool blend"],
              ].map(([name, label, placeholder]) => (
                <label key={name} className="block">
                  <span className="text-sm font-black text-charcoal">{label}</span>
                  <input
                    name={name}
                    required={name === "name"}
                    placeholder={placeholder}
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fuchsiaBrand"
                  />
                </label>
              ))}
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 size-4" aria-hidden="true" />
                    Upload item
                  </>
                )}
              </Button>
            </form>
          </Card>

          <div className="space-y-5">
            {(message || error) ? (
              <div className={cn("rounded-3xl px-5 py-4 text-sm font-bold", error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
                {error || message}
              </div>
            ) : null}

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-charcoal">Your closet</h2>
                <p className="mt-1 text-sm font-semibold text-charcoal/50">
                  {loading ? "Loading your latest uploads..." : statLabel(items.length, "item", "items")}
                </p>
              </div>
              <button type="button" onClick={loadItems} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                <RotateCw className="mr-2 size-4" aria-hidden="true" />
                Refresh
              </button>
            </div>

            {loading ? (
              <Card className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <Loader2 className="mx-auto size-8 animate-spin text-fuchsiaBrand" aria-hidden="true" />
                  <p className="mt-4 text-sm font-bold text-charcoal/55">Loading wardrobe items</p>
                </div>
              </Card>
            ) : items.length ? (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => {
                  const editing = editingId === item.id;
                  const tags = [...tagList(item.style_tags), ...tagList(item.season_tags)].slice(0, 5);

                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="relative aspect-[4/5] bg-charcoal/[0.04]">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center text-charcoal/35">
                            <Shirt className="size-14" aria-hidden="true" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item)}
                          disabled={busyId === item.id}
                          className={cn(
                            "absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/90 text-charcoal shadow-soft transition hover:text-fuchsiaBrand",
                            item.is_favorite && "text-fuchsiaBrand",
                          )}
                          aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart className={cn("size-5", item.is_favorite && "fill-current")} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="p-5">
                        {editing ? (
                          <div className="space-y-3">
                            {[
                              ["name", "Item name"],
                              ["category", "Category"],
                              ["subcategory", "Subcategory"],
                              ["gender_fit", "Fit"],
                              ["color", "Color"],
                              ["material", "Material"],
                              ["style_tags", "Style tags"],
                              ["season_tags", "Season tags"],
                              ["times_worn", "Times worn"],
                            ].map(([key, label]) => (
                              <label key={key} className="block">
                                <span className="text-xs font-black text-charcoal/55">{label}</span>
                                <input
                                  value={draft[key as keyof EditDraft]}
                                  type={key === "times_worn" ? "number" : "text"}
                                  onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                                  className="mt-1 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-charcoal outline-none focus:border-fuchsiaBrand"
                                />
                              </label>
                            ))}
                            <div className="grid grid-cols-2 gap-2">
                              <Button type="button" disabled={busyId === item.id} onClick={() => saveEdit(item.id)} size="sm">
                                Save
                              </Button>
                              <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-lg font-black text-charcoal">{item.name}</h3>
                                <p className="mt-1 text-sm font-semibold text-charcoal/50">
                                  {[item.category, item.subcategory, item.color].filter(Boolean).join(" / ") || "No details yet"}
                                </p>
                              </div>
                              {item.ai_confidence ? (
                                <span className="rounded-full bg-fuchsiaBrand/10 px-3 py-1 text-xs font-black text-fuchsiaBrand">
                                  AI {Number(item.ai_confidence).toFixed(1)}
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {[item.material, item.gender_fit, ...tags].filter(Boolean).map((tag) => (
                                <span key={String(tag)} className="rounded-full bg-charcoal/[0.04] px-3 py-1 text-xs font-bold text-charcoal/58">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {item.ai_description ? (
                              <p className="mt-4 line-clamp-3 text-sm leading-6 text-charcoal/58">{item.ai_description}</p>
                            ) : null}

                            <div className="mt-5 grid grid-cols-3 gap-2">
                              <button type="button" onClick={() => startEdit(item)} className={buttonClasses({ variant: "secondary", size: "sm", className: "px-0" })} aria-label={`Edit ${item.name}`}>
                                <Pencil className="size-4" aria-hidden="true" />
                              </button>
                              <button type="button" onClick={() => analyzeItem(item.id)} disabled={busyId === item.id} className={buttonClasses({ variant: "secondary", size: "sm", className: "px-0" })} aria-label={`Analyze ${item.name}`}>
                                {busyId === item.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                              </button>
                              <button type="button" onClick={() => deleteItem(item.id)} disabled={busyId === item.id} className={buttonClasses({ variant: "secondary", size: "sm", className: "px-0 hover:text-rose-600" })} aria-label={`Delete ${item.name}`}>
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="grid min-h-80 place-items-center p-8 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
                    <UploadCloud className="size-8" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-charcoal">No wardrobe items yet</h3>
                  <p className="mt-3 text-sm leading-7 text-charcoal/58">
                    Upload your first item and it will appear here and on your dashboard immediately after the database save completes.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
