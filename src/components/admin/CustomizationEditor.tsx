"use client";

import { Plus, Trash2 } from "lucide-react";
import type { OptionGroup } from "@/lib/customizations";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function CustomizationEditor({
  groups,
  onChange,
  onReset,
}: {
  groups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
  onReset?: () => void;
}) {
  const updateGroup = (index: number, patch: Partial<OptionGroup>) => {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  };

  const updateOption = (
    groupIndex: number,
    optionIndex: number,
    patch: Partial<OptionGroup["options"][number]>
  ) => {
    onChange(
      groups.map((group, i) => {
        if (i !== groupIndex) return group;
        return {
          ...group,
          options: group.options.map((option, j) => (j === optionIndex ? { ...option, ...patch } : option)),
        };
      })
    );
  };

  const addOption = (groupIndex: number) => {
    const group = groups[groupIndex];
    if (!group) return;
    const n = group.options.length + 1;
    updateGroup(groupIndex, {
      options: [
        ...group.options,
        { id: `opt-${n}-${Date.now().toString(36)}`, label: "New option", priceDelta: 0 },
      ],
    });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const group = groups[groupIndex];
    if (!group) return;
    updateGroup(groupIndex, {
      options: group.options.filter((_, i) => i !== optionIndex),
    });
  };

  const addGroup = () => {
    const n = groups.length + 1;
    onChange([
      ...groups,
      {
        id: `extras-${n}`,
        label: "New group",
        type: "multiple",
        hidden: false,
        options: [{ id: "option-1", label: "Option", priceDelta: 0 }],
      },
    ]);
  };

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-ink/40 p-3 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-sm font-semibold">Customer options</p>
          <p className="text-[11px] text-brand-cream/45">
            Edit extras, spice, half/full labels. Hide any section customers should not see.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="min-h-9 rounded-full border border-white/15 px-3 text-xs text-brand-cream/70"
            >
              Reset defaults
            </button>
          ) : null}
          <button
            type="button"
            onClick={addGroup}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-brand-gold/40 px-3 text-xs text-brand-gold"
          >
            <Plus className="h-3.5 w-3.5" />
            Add section
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-brand-cream/50">No option sections. Add one, or leave empty for plain add-to-cart.</p>
      ) : null}

      {groups.map((group, groupIndex) => (
        <div
          key={`${group.id}-${groupIndex}`}
          className={`space-y-2 rounded-xl border p-3 ${
            group.hidden ? "border-white/10 bg-white/[0.02] opacity-70" : "border-white/10 bg-white/5"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={group.label}
              onChange={(event) => {
                const label = event.target.value;
                const nextId =
                  group.id === "size" || group.id === "spice" || group.id === "extras"
                    ? group.id
                    : slugify(label) || group.id;
                updateGroup(groupIndex, { label, id: nextId });
              }}
              className="field-input min-w-0 flex-1"
              placeholder="Section name"
            />
            <select
              value={group.type}
              onChange={(event) =>
                updateGroup(groupIndex, {
                  type: event.target.value === "multiple" ? "multiple" : "single",
                })
              }
              className="field-input w-auto min-w-[7.5rem]"
            >
              <option value="single">Pick one</option>
              <option value="multiple">Multi select</option>
            </select>
            <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-3 text-xs">
              <input
                type="checkbox"
                checked={!group.hidden}
                onChange={(event) => updateGroup(groupIndex, { hidden: !event.target.checked })}
              />
              Show
            </label>
            <button
              type="button"
              onClick={() => removeGroup(groupIndex)}
              className="rounded-full border border-white/10 p-2 text-brand-cream/50 hover:text-brand-yellow"
              aria-label="Remove section"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {group.options.map((option, optionIndex) => (
              <div key={`${option.id}-${optionIndex}`} className="grid grid-cols-[1fr_5.5rem_auto] gap-2">
                <input
                  value={option.label}
                  onChange={(event) => {
                    const label = event.target.value;
                    const keepId =
                      option.id === "half" ||
                      option.id === "full" ||
                      option.id === "mild" ||
                      option.id === "medium" ||
                      option.id === "spicy";
                    updateOption(groupIndex, optionIndex, {
                      label,
                      id: keepId ? option.id : slugify(label) || option.id,
                    });
                  }}
                  className="field-input"
                  placeholder="Option"
                />
                <input
                  value={String(option.priceDelta)}
                  onChange={(event) =>
                    updateOption(groupIndex, optionIndex, {
                      priceDelta: Number(event.target.value) || 0,
                    })
                  }
                  className="field-input"
                  placeholder="+₹"
                  inputMode="decimal"
                  title="Extra price (Half/Full use item Half & Full prices)"
                />
                <button
                  type="button"
                  onClick={() => removeOption(groupIndex, optionIndex)}
                  className="rounded-full border border-white/10 p-2 text-brand-cream/45"
                  aria-label="Remove option"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(groupIndex)}
              className="inline-flex min-h-9 items-center gap-1 text-xs text-brand-gold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
