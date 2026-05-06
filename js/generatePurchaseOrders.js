const DEFAULT_SUPPLIERS_URL = "data/suppliers/sample-suppliers.json";
const UNASSIGNED_SUPPLIER = {
  supplierName: "Unassigned Supplier",
  supportedCategories: [],
  contactInfo: {},
  preferredOrderUnits: {},
  estimatedUnitCostByCategory: {}
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function formatCategory(category) {
  return String(category || "Miscellaneous").trim() || "Miscellaneous";
}

function findSupplierForCategory(suppliers, category) {
  return suppliers.find((supplier) => {
    return (supplier.supportedCategories || []).some((supportedCategory) => supportedCategory === category);
  }) || UNASSIGNED_SUPPLIER;
}

function getRequirementQuantity(line) {
  if (line.status === "shortage" && Number.isFinite(line.shortageQuantity)) {
    return line.shortageQuantity;
  }

  if ((line.status === "missing" || line.status === "unit-mismatch") && Number.isFinite(line.requiredQuantity)) {
    return line.requiredQuantity;
  }

  return null;
}

function getEstimatedUnitCost(supplier, category) {
  const cost = supplier.estimatedUnitCostByCategory?.[category];
  return Number.isFinite(cost) ? cost : null;
}

function createPurchaseLine(line, supplier) {
  const category = formatCategory(line.category);
  const quantity = getRequirementQuantity(line);
  const preferredUnit = supplier.preferredOrderUnits?.[category] || line.requiredUnit || "";
  const unitsMatch = !preferredUnit || !line.requiredUnit || normalizeText(preferredUnit) === normalizeText(line.requiredUnit);
  const orderUnit = unitsMatch ? preferredUnit || line.requiredUnit : line.requiredUnit;
  const estimatedUnitCost = getEstimatedUnitCost(supplier, category);
  const canEstimate = Number.isFinite(quantity) && Number.isFinite(estimatedUnitCost);
  const reviewNotes = [];

  if (supplier === UNASSIGNED_SUPPLIER) {
    reviewNotes.push("No supplier supports this ingredient category yet.");
  }

  if (!unitsMatch) {
    reviewNotes.push(`Preferred supplier unit is ${preferredUnit}, but demand is tracked in ${line.requiredUnit}.`);
  }

  if (!Number.isFinite(quantity)) {
    reviewNotes.push("Quantity could not be calculated safely.");
  }

  return {
    ingredientName: line.name,
    category,
    quantity,
    unit: orderUnit || "",
    sourceStatus: line.status,
    estimatedUnitCost,
    estimatedLineTotal: canEstimate ? quantity * estimatedUnitCost : null,
    reviewNotes,
    sources: line.sources || []
  };
}

function groupLinesByCategory(lines) {
  const groups = new Map();

  for (const line of lines) {
    const group = groups.get(line.category) || {
      category: line.category,
      count: 0,
      estimatedTotal: 0,
      items: []
    };

    group.items.push(line);
    group.count += 1;
    if (Number.isFinite(line.estimatedLineTotal)) {
      group.estimatedTotal += line.estimatedLineTotal;
    }
    groups.set(line.category, group);
  }

  return Array.from(groups.values()).sort((first, second) => first.category.localeCompare(second.category));
}

function createSupplierOrder(supplier, lines) {
  const categoryGroups = groupLinesByCategory(lines);
  const estimatedTotal = lines.reduce((total, line) => {
    return total + (Number.isFinite(line.estimatedLineTotal) ? line.estimatedLineTotal : 0);
  }, 0);

  return {
    supplierName: supplier.supplierName,
    contactInfo: supplier.contactInfo || {},
    supportedCategories: supplier.supportedCategories || [],
    categoryGroups,
    lines,
    itemCount: lines.length,
    shortageCount: lines.filter((line) => line.sourceStatus === "shortage").length,
    reviewCount: lines.filter((line) => line.reviewNotes.length > 0).length,
    estimatedTotal
  };
}

export async function loadSuppliers(url = DEFAULT_SUPPLIERS_URL) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        suppliers: [],
        error: `Unable to load suppliers: ${response.status} ${response.statusText}`
      };
    }

    const suppliers = await response.json();

    return {
      ok: true,
      suppliers: Array.isArray(suppliers) ? suppliers : [],
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      suppliers: [],
      error: error.message || "Unable to load suppliers."
    };
  }
}

export function generatePurchaseOrders(inventoryNeeds, ingredientSummary, suppliers) {
  const supplierLines = new Map();
  const purchaseStatuses = new Set(["shortage", "missing", "unit-mismatch"]);
  const candidateLines = (inventoryNeeds?.lines || []).filter((line) => purchaseStatuses.has(line.status));
  const missingSuppliers = new Set();

  for (const line of candidateLines) {
    const category = formatCategory(line.category);
    const supplier = findSupplierForCategory(suppliers || [], category);
    const purchaseLine = createPurchaseLine(line, supplier);
    const currentLines = supplierLines.get(supplier.supplierName) || {
      supplier,
      lines: []
    };

    if (supplier === UNASSIGNED_SUPPLIER) {
      missingSuppliers.add(category);
    }

    currentLines.lines.push(purchaseLine);
    supplierLines.set(supplier.supplierName, currentLines);
  }

  const supplierOrders = Array.from(supplierLines.values())
    .map((entry) => createSupplierOrder(entry.supplier, entry.lines))
    .sort((first, second) => first.supplierName.localeCompare(second.supplierName));
  const estimatedGrandTotal = supplierOrders.reduce((total, order) => total + order.estimatedTotal, 0);

  return {
    filters: ingredientSummary?.filters || inventoryNeeds?.filters || {},
    generatedAt: new Date().toISOString(),
    supplierOrders,
    requirementCount: candidateLines.length,
    shortageCount: inventoryNeeds?.shortageCount || 0,
    missingSupplierCategories: Array.from(missingSuppliers).sort(),
    estimatedGrandTotal,
    reviewCount: supplierOrders.reduce((total, order) => total + order.reviewCount, 0)
  };
}

export { DEFAULT_SUPPLIERS_URL };
