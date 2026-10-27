export type CustomizeOption = {
  id: string;
  label: string;
  priceDelta: number;
};

export type OptionGroup = {
  id: string;
  label: string;
  type: "single" | "multiple";
  options: CustomizeOption[];
};

export type CustomizeSelections = Record<string, string[]>;

export type PortionPrices = {
  price: number;
  halfPrice?: number | null;
  fullPrice?: number | null;
};

/** Categories that use Half / Full portion pricing on the paper menu. */
export const PORTION_CATEGORIES = new Set([
  "momos",
  "noodles",
  "fried-rice",
  "chilli-potato",
  "spring-rolls",
  "wraps",
  "chicken-lollipop",
]);

const spice: OptionGroup = {
  id: "spice",
  label: "Spice level",
  type: "single",
  options: [
    { id: "mild", label: "Mild", priceDelta: 0 },
    { id: "medium", label: "Medium", priceDelta: 0 },
    { id: "spicy", label: "Spicy", priceDelta: 0 },
  ],
};

function sizeGroup(largeDelta: number, largeLabel = "Large"): OptionGroup {
  return {
    id: "size",
    label: "Choose your size",
    type: "single",
    options: [
      { id: "regular", label: "Regular", priceDelta: 0 },
      { id: "large", label: largeLabel, priceDelta: largeDelta },
    ],
  };
}

function portionGroup(fullDelta: number): OptionGroup {
  return {
    id: "size",
    label: "Choose portion",
    type: "single",
    options: [
      { id: "half", label: "Half", priceDelta: 0 },
      { id: "full", label: "Full", priceDelta: Math.max(0, fullDelta) },
    ],
  };
}

const GROUPS: Record<string, OptionGroup[]> = {
  burger: [
    sizeGroup(40),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "cheese", label: "Extra Cheese", priceDelta: 30 },
        { id: "patty", label: "Extra Patty", priceDelta: 50 },
        { id: "sauce", label: "Spicy Sauce", priceDelta: 10 },
      ],
    },
    spice,
  ],
  momos: [
    portionGroup(50),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "chutney", label: "Extra Chutney", priceDelta: 10 },
        { id: "cheese", label: "Cheese Filling", priceDelta: 30 },
        { id: "mayo", label: "Mayo Dip", priceDelta: 15 },
      ],
    },
    spice,
  ],
  "spring-rolls": [
    portionGroup(40),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "dip", label: "Extra Dip", priceDelta: 10 },
        { id: "cheese", label: "Extra Cheese", priceDelta: 30 },
      ],
    },
    spice,
  ],
  noodles: [
    portionGroup(50),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "egg", label: "Egg", priceDelta: 20 },
        { id: "veg", label: "Extra Veggies", priceDelta: 20 },
        { id: "sauce", label: "Spicy Sauce", priceDelta: 10 },
      ],
    },
    spice,
  ],
  "chilli-potato": [
    portionGroup(50),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "sesame", label: "Extra Sesame", priceDelta: 10 },
        { id: "honey", label: "Extra Honey Chilli", priceDelta: 20 },
      ],
    },
    spice,
  ],
  "fried-rice": [
    portionGroup(50),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "egg", label: "Egg", priceDelta: 20 },
        { id: "veg", label: "Extra Veggies", priceDelta: 20 },
        { id: "sauce", label: "Spicy Sauce", priceDelta: 10 },
      ],
    },
    spice,
  ],
  wraps: [
    portionGroup(30),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "cheese", label: "Extra Cheese", priceDelta: 30 },
        { id: "patty", label: "Extra Filling", priceDelta: 50 },
        { id: "sauce", label: "Spicy Sauce", priceDelta: 10 },
      ],
    },
    spice,
  ],
  "chicken-lollipop": [
    portionGroup(80),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "dip", label: "Extra Dip", priceDelta: 15 },
        { id: "gravy", label: "Extra Gravy", priceDelta: 30 },
      ],
    },
    spice,
  ],
  coffee: [
    sizeGroup(30, "Large"),
    {
      id: "extras",
      label: "Add extras",
      type: "multiple",
      options: [
        { id: "shot", label: "Extra Shot", priceDelta: 25 },
        { id: "oat", label: "Oat Milk", priceDelta: 20 },
        { id: "cream", label: "Whipped Cream", priceDelta: 15 },
      ],
    },
  ],
};

function withChickenExtra(groups: OptionGroup[], isVeg: boolean): OptionGroup[] {
  if (isVeg) return groups;
  return groups.map((group) => {
    if (group.id !== "extras") return group;
    if (group.options.some((option) => option.id === "chicken")) return group;
    return {
      ...group,
      options: [...group.options, { id: "chicken", label: "Extra Chicken", priceDelta: 50 }],
    };
  });
}

export function resolvePortionPrices(portions?: PortionPrices | null) {
  const base = Number(portions?.price || 0);
  const half = portions?.halfPrice != null && portions.halfPrice > 0 ? Number(portions.halfPrice) : base;
  const full =
    portions?.fullPrice != null && portions.fullPrice > 0
      ? Number(portions.fullPrice)
      : null;
  return { half, full };
}

function applyPortionPrices(groups: OptionGroup[], category: string, portions?: PortionPrices | null): OptionGroup[] {
  const { half, full } = resolvePortionPrices(portions);
  const wantsPortion =
    (full != null && full > 0) ||
    PORTION_CATEGORIES.has(category) ||
    groups.some((group) => group.options.some((option) => option.id === "half" || option.id === "full"));

  if (!wantsPortion) return groups;

  const existingSize = groups.find((group) => group.id === "size");
  const fallbackDelta =
    existingSize?.options.find((option) => option.id === "full" || option.id === "large")?.priceDelta ?? 50;
  const fullDelta = full != null && full > 0 ? Math.max(0, full - half) : fallbackDelta;

  const nextPortion = portionGroup(fullDelta);
  if (!existingSize) return [nextPortion, ...groups];
  return groups.map((group) => (group.id === "size" ? nextPortion : group));
}

export function optionGroupsFor(
  category: string,
  isVeg: boolean,
  portions?: PortionPrices | null
): OptionGroup[] {
  const groups = GROUPS[category] || [];
  if (category === "coffee") return groups;
  const withPortions = applyPortionPrices(groups, category, portions);
  if (category === "chicken-lollipop") return withPortions;
  return withChickenExtra(withPortions, isVeg);
}

export function basePriceForItem(portions?: PortionPrices | null) {
  return resolvePortionPrices(portions).half;
}

export function defaultSelections(groups: OptionGroup[]): CustomizeSelections {
  const selections: CustomizeSelections = {};
  for (const group of groups) {
    selections[group.id] = group.type === "single" && group.options[0] ? [group.options[0].id] : [];
  }
  return selections;
}

export function unitPriceFromSelections(
  basePrice: number,
  groups: OptionGroup[],
  selections: CustomizeSelections
): number {
  let extra = 0;
  for (const group of groups) {
    const picked = selections[group.id] || [];
    for (const optionId of picked) {
      extra += group.options.find((option) => option.id === optionId)?.priceDelta ?? 0;
    }
  }
  return basePrice + extra;
}

export function configKeyFromSelections(selections: CustomizeSelections): string {
  const keys = Object.keys(selections).sort();
  if (!keys.length) return "default";
  return keys.map((key) => `${key}:${[...(selections[key] || [])].sort().join(",")}`).join("|");
}

export function summaryFromSelections(groups: OptionGroup[], selections: CustomizeSelections): string {
  const parts: string[] = [];
  for (const group of groups) {
    const labels = (selections[group.id] || [])
      .map((optionId) => group.options.find((option) => option.id === optionId)?.label)
      .filter((label): label is string => Boolean(label));
    if (labels.length) parts.push(labels.join(", "));
  }
  return parts.join(" · ");
}

export function cartLineId(menuItemId: string, configKey: string) {
  return `${menuItemId}::${configKey}`;
}

export function menuItemIdFromLine(id: string) {
  return id.split("::")[0];
}

export type CartableItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  halfPrice?: number | null;
  fullPrice?: number | null;
  optionGroups?: OptionGroup[];
};

export function defaultCartLine(item: CartableItem) {
  const groups = item.optionGroups || [];
  const selections = defaultSelections(groups);
  const configKey = configKeyFromSelections(selections);
  const base = basePriceForItem(item);
  return {
    id: cartLineId(item.id, configKey),
    menuItemId: item.id,
    name: item.name,
    price: unitPriceFromSelections(base, groups, selections),
    imageUrl: item.imageUrl,
    isVeg: item.isVeg,
    configKey,
    customization: summaryFromSelections(groups, selections),
    selections,
  };
}

export function defaultLineId(item: { id: string; optionGroups?: OptionGroup[] }) {
  return cartLineId(item.id, configKeyFromSelections(defaultSelections(item.optionGroups || [])));
}

export function sanitizeSelections(groups: OptionGroup[], incoming: CustomizeSelections | undefined): CustomizeSelections {
  const defaults = defaultSelections(groups);
  if (!incoming) return defaults;
  const next: CustomizeSelections = {};
  for (const group of groups) {
    const allowed = new Set(group.options.map((option) => option.id));
    const picked = (incoming[group.id] || []).filter((optionId) => allowed.has(optionId));
    if (group.type === "single") {
      next[group.id] = picked[0] ? [picked[0]] : defaults[group.id];
    } else {
      next[group.id] = Array.from(new Set(picked));
    }
  }
  return next;
}
