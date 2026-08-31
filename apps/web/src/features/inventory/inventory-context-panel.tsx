"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InventoryAdjustRequest, InventoryContextResponse } from "@commerceops/types";
import {
  fetchInventoryContext,
  fetchInventoryHistory,
  InventoryApiError,
  submitInventoryAdjustment,
} from "../../lib/inventory-api";
import { queryKeys } from "../../lib/query-keys";

const REASON_OPTIONS = [
  { value: "stock_count_correction", label: "Stock count correction" },
  { value: "damaged_write_off", label: "Damaged write-off" },
  { value: "manual_restock", label: "Manual restock" },
  { value: "operations_adjustment", label: "Operations adjustment" },
];

type AdjustmentDraft = {
  inventoryLevelId: string;
  reasonCode: string;
  deltaInput: string;
  note: string;
};

type ValidationResult = {
  errors: string[];
  parsedDelta: number | null;
  nextAvailable: number | null;
};

type SubmitFeedback = {
  tone: "success" | "error";
  message: string;
};

export function validateDraft(
  context: InventoryContextResponse,
  draft: AdjustmentDraft,
): ValidationResult {
  const errors: string[] = [];

  if (!draft.inventoryLevelId) {
    errors.push("Select an inventory level.");
  }

  if (!draft.reasonCode) {
    errors.push("Select an adjustment reason.");
  }

  const matchedLevel = context.levels.find((level) => level.id === draft.inventoryLevelId);
  if (!matchedLevel && draft.inventoryLevelId) {
    errors.push("Selected inventory level is not available.");
  }

  const parsedDelta = Number.parseInt(draft.deltaInput, 10);
  if (Number.isNaN(parsedDelta)) {
    errors.push("Enter an integer delta quantity.");
  }

  if (!Number.isNaN(parsedDelta) && parsedDelta === 0) {
    errors.push("Delta quantity cannot be zero.");
  }

  let nextAvailable: number | null = null;
  if (matchedLevel && !Number.isNaN(parsedDelta)) {
    nextAvailable = matchedLevel.availableQty + parsedDelta;
    if (nextAvailable < 0) {
      errors.push("Adjustment would make available quantity negative.");
    }
  }

  if (draft.note.length > 240) {
    errors.push("Note must be 240 characters or fewer.");
  }

  return {
    errors,
    parsedDelta: Number.isNaN(parsedDelta) ? null : parsedDelta,
    nextAvailable,
  };
}

export function InventoryContextPanel() {
  const queryClient = useQueryClient();
  const contextQuery = useQuery({
    queryKey: queryKeys.inventoryContext,
    queryFn: fetchInventoryContext,
  });
  const historyQuery = useQuery({
    queryKey: queryKeys.inventoryHistory,
    queryFn: fetchInventoryHistory,
  });
  const adjustMutation = useMutation({
    mutationFn: submitInventoryAdjustment,
  });
  const [draft, setDraft] = useState<AdjustmentDraft>({
    inventoryLevelId: "",
    reasonCode: "",
    deltaInput: "",
    note: "",
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  // Held stable so retrying the same draft reuses the key and the server can
  // dedupe it. Cleared when the draft changes or an adjustment is recorded.
  const idempotencyKeyRef = useRef<string | null>(null);
  const preview = useMemo(() => {
    if (!contextQuery.data) {
      return {
        errors: [],
        parsedDelta: null,
        nextAvailable: null,
      };
    }

    return validateDraft(contextQuery.data, draft);
  }, [contextQuery.data, draft]);

  if (contextQuery.isLoading) {
    return <p className="mt-3 text-gray-600">Loading inventory context...</p>;
  }

  if (contextQuery.isError) {
    return <p className="mt-3 text-red-700">Failed to load inventory context.</p>;
  }

  const context = contextQuery.data;

  if (!context) {
    return <p className="mt-3 text-gray-600">Inventory context is not available yet.</p>;
  }

  const selectedLevel = context.levels.find((level) => level.id === draft.inventoryLevelId);

  function updateDraft<K extends keyof AdjustmentDraft>(key: K, value: AdjustmentDraft[K]) {
    // A changed draft is a different logical operation, so it needs its own key.
    idempotencyKeyRef.current = null;
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function refreshInventoryData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryContext }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryHistory }),
    ]);
  }

  function handleValidateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const activeContext = contextQuery.data;
    if (!activeContext) {
      setFeedback({ tone: "error", message: "Inventory context is not available." });
      return;
    }

    if (!activeContext.viewer.canAdjust) {
      setFeedback({
        tone: "error",
        message: "You do not have permission to submit adjustments.",
      });
      return;
    }

    const result = validateDraft(activeContext, draft);
    setValidationErrors(result.errors);

    if (result.errors.length > 0) {
      setFeedback({ tone: "error", message: "Fix validation errors before continuing." });
      return;
    }

    if (!selectedLevel) {
      setFeedback({
        tone: "error",
        message: "Select a valid inventory level before submitting.",
      });
      return;
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    const request: InventoryAdjustRequest = {
      inventoryLevelId: draft.inventoryLevelId,
      reasonCode: draft.reasonCode,
      deltaQty: result.parsedDelta as number,
      expectedVersion: selectedLevel.expectedVersion,
      idempotencyKey: idempotencyKeyRef.current,
      note: draft.note.trim().length > 0 ? draft.note.trim() : undefined,
    };

    adjustMutation.mutate(request, {
      onSuccess: async (response) => {
        setValidationErrors([]);
        idempotencyKeyRef.current = null;
        setFeedback({
          tone: "success",
          message: `Adjustment recorded. New available: ${response.newAvailable} (version ${response.updatedVersion}).`,
        });
        setDraft((current) => ({
          ...current,
          deltaInput: "",
          note: "",
        }));
        await refreshInventoryData();
      },
      onError: async (error) => {
        const code = error instanceof InventoryApiError ? error.code : "unknown_error";

        if (code === "version_conflict") {
          // The cached expectedVersion is stale, so every retry would fail until refetched.
          await refreshInventoryData();
          idempotencyKeyRef.current = null;
          setFeedback({
            tone: "error",
            message:
              "This stock level changed since you loaded it. The latest figures have been reloaded — review them and submit again.",
          });
          return;
        }

        if (code === "duplicate_idempotency_key") {
          await refreshInventoryData();
          idempotencyKeyRef.current = null;
          setDraft((current) => ({ ...current, deltaInput: "", note: "" }));
          setFeedback({
            tone: "success",
            message: "This adjustment was already recorded. The latest figures have been reloaded.",
          });
          return;
        }

        if (code === "insufficient_stock") {
          await refreshInventoryData();
          setFeedback({
            tone: "error",
            message: "That adjustment would take available stock below zero.",
          });
          return;
        }

        setFeedback({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to submit adjustment.",
        });
      },
    });
  }

  return (
    <div className="mt-4 space-y-3 rounded border border-gray-200 p-4">
      <p className="text-sm text-gray-700">
        Viewer role: <span className="font-medium">{context.viewer.role}</span>
      </p>
      <p className="text-sm text-gray-700">
        Adjustment permissions: {context.viewer.canAdjust ? "enabled" : "read-only"}
      </p>
      <p className="text-sm text-gray-700">Loaded levels: {context.levels.length}</p>

      <form
        aria-describedby="adjustment-help"
        className="mt-4 space-y-4 rounded border border-gray-200 bg-white p-4"
        noValidate
        onSubmit={handleValidateSubmit}
      >
        <fieldset className="space-y-4" disabled={!context.viewer.canAdjust}>
          <legend className="text-base font-semibold">Stock adjustment draft</legend>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-800"
              htmlFor="inventory-level"
            >
              Inventory level
            </label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2"
              id="inventory-level"
              onChange={(event) => updateDraft("inventoryLevelId", event.target.value)}
              value={draft.inventoryLevelId}
            >
              <option value="">Select a level</option>
              {context.levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.sku} @ {level.locationId} (available: {level.availableQty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800" htmlFor="reason-code">
              Reason code
            </label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2"
              id="reason-code"
              onChange={(event) => updateDraft("reasonCode", event.target.value)}
              value={draft.reasonCode}
            >
              <option value="">Select a reason</option>
              {REASON_OPTIONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800" htmlFor="delta-qty">
              Delta quantity
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              id="delta-qty"
              inputMode="numeric"
              onChange={(event) => updateDraft("deltaInput", event.target.value)}
              placeholder="e.g. -3 or 8"
              type="number"
              value={draft.deltaInput}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-800"
              htmlFor="adjustment-note"
            >
              Note (optional)
            </label>
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2"
              id="adjustment-note"
              maxLength={240}
              onChange={(event) => updateDraft("note", event.target.value)}
              rows={3}
              value={draft.note}
            />
          </div>

          <button
            className="rounded bg-gray-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={adjustMutation.isPending}
            type="submit"
          >
            {adjustMutation.isPending ? "Submitting..." : "Submit adjustment"}
          </button>
        </fieldset>

        {!context.viewer.canAdjust ? (
          <p className="text-sm text-gray-600" id="adjustment-help">
            Your role is read-only. Adjustment controls are disabled.
          </p>
        ) : (
          <p className="text-sm text-gray-600" id="adjustment-help">
            Validation enforces integer deltas, non-zero changes, and non-negative available stock.
          </p>
        )}

        {selectedLevel ? (
          <p className="text-sm text-gray-700">
            Current available: {selectedLevel.availableQty}
            {preview.parsedDelta !== null && preview.nextAvailable !== null
              ? ` | Next available preview: ${preview.nextAvailable}`
              : ""}
          </p>
        ) : null}

        {validationErrors.length > 0 ? (
          <div
            aria-live="polite"
            className="rounded border border-red-200 bg-red-50 p-3"
            role="alert"
          >
            <p className="text-sm font-medium text-red-700">Validation errors</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {feedback ? (
          <p
            aria-live={feedback.tone === "error" ? "assertive" : "polite"}
            className={
              feedback.tone === "error"
                ? "rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
                : "rounded border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
            }
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        ) : null}
      </form>

      <div className="rounded border border-gray-200 bg-gray-50 p-3">
        <h3 className="text-sm font-semibold text-gray-800">Recent adjustments</h3>
        {historyQuery.isLoading ? (
          <p className="mt-2 text-sm text-gray-600">Loading recent adjustments...</p>
        ) : historyQuery.isError ? (
          <p className="mt-2 text-sm text-red-700">Failed to load recent adjustments.</p>
        ) : historyQuery.data?.items.length ? (
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {historyQuery.data.items.map((item) => (
              <li key={item.id} className="rounded border border-gray-200 bg-white p-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{item.reasonCode}</span>
                  <span className={item.deltaQty >= 0 ? "text-emerald-700" : "text-amber-700"}>
                    {item.deltaQty >= 0 ? "+" : ""}
                    {item.deltaQty}
                  </span>
                </div>
                <p className="mt-1">
                  {item.sku} @ {item.locationId} · {item.previousAvailable} → {item.newAvailable}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            No inventory adjustments have been recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
