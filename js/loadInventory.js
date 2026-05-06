const DEFAULT_INVENTORY_URL = "data/inventory/sample-inventory.json";

export async function loadInventory(url = DEFAULT_INVENTORY_URL) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        inventory: [],
        error: `Unable to load inventory: ${response.status} ${response.statusText}`
      };
    }

    const inventory = await response.json();

    return {
      ok: true,
      inventory: Array.isArray(inventory) ? inventory : [],
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      inventory: [],
      error: error.message || "Unable to load inventory."
    };
  }
}

export { DEFAULT_INVENTORY_URL };
