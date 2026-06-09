"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AppModule } from "@/data/backendRoutes";
import { apiRequest, toJsonBody, type ApiMode } from "@/lib/api";
import { AppShell } from "@/components/app/AppShell";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

export type ActionField = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "textarea" | "number" | "checkbox" | "select" | "file" | "date" | "datetime-local" | "json" | "tags";
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  source?: {
    title: string;
    collection?: string;
    valueKey?: string;
    labelKeys?: string[];
    emptyLabel?: string;
  };
  defaultValue?: string | boolean;
};

export type ModuleAction = {
  label: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  mode?: ApiMode;
  fields?: ActionField[];
  multipart?: boolean;
  description?: string;
};

type LoadTarget = {
  title: string;
  path: string;
  mode?: ApiMode;
};

type ModulePageProps = {
  module: AppModule;
  mode?: "user" | "admin";
  loads?: LoadTarget[];
  actions?: ModuleAction[];
};

type LatestResult = {
  title: string;
  message: string;
  data: unknown;
};

function defaultLoads(module: AppModule, mode: ApiMode): LoadTarget[] {
  return module.endpoints
    .filter((endpoint) => endpoint.method === "GET" && !endpoint.path.includes(":"))
    .slice(0, 4)
    .map((endpoint) => ({ title: endpoint.purpose, path: endpoint.path, mode: endpoint.auth === "public" ? "public" : mode }));
}

function inputClass() {
  return "mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fuchsiaBrand";
}

function coerceValue(field: ActionField, value: FormDataEntryValue | null) {
  if (field.type === "checkbox") {
    return value === "on";
  }

  if (field.type === "number") {
    return value ? Number(value) : undefined;
  }

  if (field.type === "datetime-local" && typeof value === "string") {
    return value ? new Date(value).toISOString() : undefined;
  }

  if (field.type === "tags" && typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (field.type === "json" && typeof value === "string") {
    if (!value.trim()) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return typeof value === "string" ? value : undefined;
}

function readPathValue(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, value);
}

function collectionFromSource(loaded: Record<string, unknown>, field: ActionField) {
  if (!field.source) {
    return [];
  }

  const sourceValue = loaded[field.source.title];
  const collection = field.source.collection ? readPathValue(sourceValue, field.source.collection) : sourceValue;

  if (Array.isArray(collection)) {
    return collection as Array<Record<string, unknown>>;
  }

  return [];
}

function labelForRecord(record: Record<string, unknown>, keys: string[]) {
  const parts = keys
    .map((key) => readPathValue(record, key))
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .map((value) => String(value));

  return parts.join(" - ") || "Untitled";
}

function fieldOptions(field: ActionField, loaded: Record<string, unknown>) {
  const staticOptions = field.options ?? [];
  const sourceOptions = collectionFromSource(loaded, field).map((record) => ({
    value: String(record[field.source?.valueKey ?? "id"] ?? ""),
    label: labelForRecord(record, field.source?.labelKeys ?? ["name", "title", "email"]),
  })).filter((option) => option.value);

  return [...staticOptions, ...sourceOptions];
}

function orderedMultipartData(source: FormData, fields: ActionField[]) {
  const ordered = new FormData();

  fields
    .filter((field) => field.type !== "file")
    .forEach((field) => {
      const value = source.get(field.name);
      if (value !== null && value !== "" && value !== undefined) {
        ordered.append(field.name, value);
      }
    });

  fields
    .filter((field) => field.type === "file")
    .forEach((field) => {
      const values = source.getAll(field.name);
      values.forEach((value) => {
        if (value instanceof File && value.size > 0) {
          ordered.append(field.name, value);
        }
      });
    });

  return ordered;
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractCollection(value: unknown) {
  if (Array.isArray(value)) {
    return value as Array<Record<string, unknown>>;
  }

  if (value && typeof value === "object") {
    const firstCollection = Object.values(value as Record<string, unknown>).find(Array.isArray);
    if (Array.isArray(firstCollection)) {
      return firstCollection as Array<Record<string, unknown>>;
    }
  }

  return [];
}

function readableRecordTitle(record: Record<string, unknown>) {
  const value = record.name ?? record.title ?? record.full_name ?? record.email ?? record.occasion ?? record.event_type ?? "Saved item";
  return String(value);
}

function readableRecordMeta(record: Record<string, unknown>) {
  const keys = ["category", "color", "status", "plan_name", "occasion", "event_type", "location", "created_at"];
  const parts = keys
    .map((key) => {
      const value = readPathValue(record, key);
      if (value === undefined || value === null || String(value).trim() === "") {
        return "";
      }

      return `${titleCase(key)}: ${String(value)}`;
    })
    .filter(Boolean);

  return parts.slice(0, 3);
}

function summarizeResult(value: unknown, fallback: string) {
  const collection = extractCollection(value);
  if (collection.length) {
    return `${collection.length} record${collection.length === 1 ? "" : "s"} available.`;
  }

  if (value && typeof value === "object") {
    const record = Object.values(value as Record<string, unknown>).find((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
    if (record && typeof record === "object") {
      return `${readableRecordTitle(record as Record<string, unknown>)} saved and refreshed.`;
    }
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPrimitive(value: unknown) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function displayKey(value: string) {
  return titleCase(value)
    .replace(/\bC\b/g, "C")
    .replace(/\bKph\b/g, "kph")
    .replace(/\bMm\b/g, "mm")
    .replace(/\bUrl\b/g, "URL")
    .replace(/\bId\b/g, "ID")
    .replace(/\bApi\b/g, "API")
    .replace(/\bAi\b/g, "AI");
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  return String(value);
}

function primitiveEntries(record: Record<string, unknown>) {
  return Object.entries(record).filter(([, value]) => isPrimitive(value));
}

function nestedEntries(record: Record<string, unknown>) {
  return Object.entries(record).filter(([, value]) => value !== null && value !== undefined && !isPrimitive(value));
}

function ResultValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (Array.isArray(value)) {
    if (!value.length) {
      return <p className="text-sm font-semibold text-charcoal/50">No records yet.</p>;
    }

    const primitivesOnly = value.every(isPrimitive);
    if (primitivesOnly) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span key={`${displayValue(item)}-${index}`} className="rounded-full bg-charcoal/[0.04] px-3 py-1 text-xs font-bold text-charcoal/58">
              {displayValue(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-2">
        {value.slice(0, 6).map((item, index) => (
          <div key={isRecord(item) && item.id ? String(item.id) : index} className="rounded-2xl border border-black/[0.06] bg-white p-4">
            <ResultValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (!isRecord(value)) {
    return <p className="text-sm font-bold text-charcoal">{displayValue(value)}</p>;
  }

  const primitiveRows = primitiveEntries(value);
  const nestedRows = nestedEntries(value);

  return (
    <div className="space-y-4">
      {primitiveRows.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {primitiveRows.map(([key, entry]) => (
            <div key={key} className="rounded-2xl bg-charcoal/[0.035] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-charcoal/40">{displayKey(key)}</p>
              <p className="mt-2 break-words text-sm font-black text-charcoal">{displayValue(entry)}</p>
            </div>
          ))}
        </div>
      ) : null}

      {nestedRows.map(([key, entry]) => (
        <div key={key} className={depth > 1 ? "space-y-3" : "rounded-3xl border border-black/[0.06] bg-charcoal/[0.02] p-4"}>
          <h3 className="text-sm font-black text-charcoal">{displayKey(key)}</h3>
          <div className="mt-3">
            <ResultValue value={entry} depth={depth + 1} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionForm({
  action,
  onComplete,
  fallbackMode,
  loaded,
}: {
  action: ModuleAction;
  onComplete: (value: unknown, message: string, action: ModuleAction) => Promise<void> | void;
  fallbackMode: ApiMode;
  loaded: Record<string, unknown>;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const fields = action.fields ?? [];
    const path = fields.reduce((currentPath, field) => {
      const value = data.get(field.name);
      return currentPath.replace(`:${field.name}`, String(value ?? ""));
    }, action.path);

    try {
      const bodyEntries = fields
        .filter((field) => !action.path.includes(`:${field.name}`) && field.type !== "file")
        .map((field) => [field.name, coerceValue(field, data.get(field.name))] as const);
      const payloadOnly = bodyEntries.length === 1 && bodyEntries[0]?.[0] === "payload";
      const requestBody = action.multipart
        ? orderedMultipartData(data, fields)
        : payloadOnly
          ? JSON.stringify(bodyEntries[0]?.[1] ?? {})
          : toJsonBody(Object.fromEntries(bodyEntries));

      const response = await apiRequest(path, {
        method: action.method,
        mode: action.mode ?? fallbackMode,
        body: action.method === "GET" ? undefined : requestBody,
      });

      setMessage("");
      await onComplete(response.data, response.message, action);
      if (action.method !== "GET") {
        form.reset();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-charcoal">{action.label}</h3>
          {action.description ? <p className="mt-1 text-sm leading-6 text-charcoal/58">{action.description}</p> : null}
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {(action.fields ?? []).map((field) => (
          <label key={field.name} className="block">
            <span className="text-sm font-black text-charcoal">{field.label}</span>
            {field.type === "textarea" || field.type === "json" || field.type === "tags" ? (
              <textarea
                name={field.name}
                required={field.required}
                placeholder={field.placeholder}
                defaultValue={typeof field.defaultValue === "string" ? field.defaultValue : undefined}
                className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fuchsiaBrand"
              />
            ) : field.type === "select" || field.source ? (
              <select name={field.name} required={field.required} defaultValue={typeof field.defaultValue === "string" ? field.defaultValue : ""} className={inputClass()}>
                <option value="">{field.source?.emptyLabel ?? "Choose..."}</option>
                {fieldOptions(field, loaded).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <span className="mt-2 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
                <input name={field.name} type="checkbox" defaultChecked={field.defaultValue === true} className="size-4 accent-fuchsiaBrand" />
                <span className="text-sm font-semibold text-charcoal/58">{field.placeholder ?? "Enabled"}</span>
              </span>
            ) : (
              <input
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                placeholder={field.placeholder}
                defaultValue={typeof field.defaultValue === "string" ? field.defaultValue : undefined}
                className={inputClass()}
              />
            )}
          </label>
        ))}
        <button type="submit" disabled={loading} className={buttonClasses({ className: "w-full" })}>
          {loading ? "Working..." : action.label}
        </button>
        {message ? <p className="text-sm font-bold text-charcoal/58">{message}</p> : null}
      </form>
    </Card>
  );
}

function getStatus(value: unknown) {
  if (typeof value === "object" && value && "error" in value) {
    return {
      label: "Needs attention",
      tone: "bg-amber-50 text-amber-700",
      detail: String((value as { error?: unknown }).error ?? "Sign in or check access."),
    };
  }

  if (Array.isArray(value)) {
    return {
      label: `${value.length} item${value.length === 1 ? "" : "s"}`,
      tone: "bg-emerald-50 text-emerald-700",
      detail: value.length ? "Ready to manage." : "Nothing added yet.",
    };
  }

  if (value && typeof value === "object") {
    const firstCollection = Object.entries(value as Record<string, unknown>).find(([, entry]) => Array.isArray(entry));

    if (firstCollection && Array.isArray(firstCollection[1])) {
      const count = firstCollection[1].length;

      return {
        label: `${count} item${count === 1 ? "" : "s"}`,
        tone: "bg-emerald-50 text-emerald-700",
        detail: count ? "Ready to manage." : "Nothing added yet.",
      };
    }

    return {
      label: "Connected",
      tone: "bg-emerald-50 text-emerald-700",
      detail: "Your latest information is available.",
    };
  }

  return {
    label: "Ready",
    tone: "bg-charcoal/[0.04] text-charcoal/58",
    detail: "Open this section to begin.",
  };
}

function DataStatusCard({ title, value }: { title: string; value: unknown }) {
  const status = getStatus(value);
  const collection = extractCollection(value);
  const record = !collection.length && value && typeof value === "object"
    ? Object.values(value as Record<string, unknown>).find((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
    : null;
  const previewRecords = collection.length
    ? collection.slice(0, 3)
    : record && typeof record === "object"
      ? [record as Record<string, unknown>]
      : [];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-charcoal">{title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${status.tone}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-charcoal/58">{status.detail}</p>
      {previewRecords.length ? (
        <div className="mt-4 space-y-3">
          {previewRecords.map((entry, index) => (
            <div key={String(entry.id ?? index)} className="rounded-2xl border border-black/[0.06] bg-charcoal/[0.025] p-3">
              <p className="truncate text-sm font-black text-charcoal">{readableRecordTitle(entry)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {readableRecordMeta(entry).map((meta) => (
                  <span key={meta} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-charcoal/55">
                    {meta}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export function ModulePage({ module, mode = "user", loads, actions = [] }: ModulePageProps) {
  const Shell = mode === "admin" ? AdminShell : AppShell;
  const loadTargets = useMemo(() => loads ?? defaultLoads(module, mode), [loads, mode, module]);
  const [loaded, setLoaded] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LatestResult | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const results: Record<string, unknown> = {};

    for (const target of loadTargets) {
      try {
        const response = await apiRequest(target.path, { mode: target.mode ?? mode });
        results[target.title] = response.data;
      } catch (error) {
        results[target.title] = { error: error instanceof Error ? error.message : "Unable to load" };
      }
    }

    setLoaded(results);
    setLoading(false);
  }, [loadTargets, mode]);

  useEffect(() => {
    let mounted = true;

    async function guardedLoad() {
      if (mounted) {
        await loadData();
      }
    }

    guardedLoad();

    return () => {
      mounted = false;
    };
  }, [loadData]);

  const Icon = module.icon;

  return (
    <Shell>
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] bg-white p-5 shadow-soft sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <div className="grid size-14 place-items-center rounded-3xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
                <Icon className="size-7" aria-hidden="true" />
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">{module.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-charcoal/62">{module.description}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-charcoal">Overview</h2>
                <span className="rounded-full bg-charcoal/[0.04] px-3 py-1 text-xs font-black text-charcoal/50">
                  {loading ? "Loading" : "Ready"}
                </span>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {Object.entries(loaded).map(([title, value]) => (
                  <DataStatusCard key={title} title={title} value={value} />
                ))}
              </div>
            </Card>

            {lastResult ? (
              <Card className="p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-xl font-black text-charcoal">Latest result</h2>
                    <p className="mt-1 text-sm font-semibold text-charcoal/50">{lastResult.title}</p>
                  </div>
                  {lastResult.message ? (
                    <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      {lastResult.message}
                    </span>
                  ) : null}
                </div>
                <div className="mt-5">
                  <ResultValue value={lastResult.data} />
                </div>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            {actions.map((action) => (
              <ActionForm
                key={`${action.method}-${action.path}-${action.label}`}
                action={action}
                fallbackMode={mode}
                loaded={loaded}
                onComplete={async (value, message, completedAction) => {
                  setLastResult({
                    title: summarizeResult(value, completedAction.label),
                    message,
                    data: value,
                  });
                  if (completedAction.method !== "GET") {
                    await loadData();
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
