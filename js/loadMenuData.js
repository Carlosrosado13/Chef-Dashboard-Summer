const DEFAULT_MENU_DATA_URL = "data/processed/clean-menu.json";

export async function loadJson(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `Unable to load menu data: ${response.status} ${response.statusText}`
      };
    }

    return {
      ok: true,
      data: await response.json(),
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error.message || "Unable to load menu data."
    };
  }
}

export async function loadMenuData(url = DEFAULT_MENU_DATA_URL) {
  return loadJson(url);
}

export { DEFAULT_MENU_DATA_URL };
