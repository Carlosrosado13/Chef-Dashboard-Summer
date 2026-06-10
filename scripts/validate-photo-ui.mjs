import { spawn } from "node:child_process";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9333;
const sitePort = 4173;
const siteRoot = resolve(".");
const profileDirectory = await mkdtemp(join(tmpdir(), "chef-dashboard-chrome-"));
const uploadPath = resolve(".tmp-dessert-photo.png");
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png"
};
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${sitePort}`).pathname);
  const filePath = resolve(siteRoot, pathname === "/" ? "index.html" : pathname.slice(1));

  if (!filePath.startsWith(siteRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise((resolvePromise) => server.listen(sitePort, "127.0.0.1", resolvePromise));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDirectory}`,
  "about:blank"
], {
  stdio: "ignore",
  windowsHide: true
});

async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) {
        return;
      }
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }

  throw new Error("Chrome debugging endpoint did not start.");
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(url);
  }

  async connect() {
    await new Promise((resolvePromise, reject) => {
      this.socket.addEventListener("open", resolvePromise, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);

      if (!pending) {
        return;
      }

      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.socket.send(JSON.stringify({ id, method, params }));

    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Browser evaluation failed.");
  }

  return result.result.value;
}

async function waitFor(client, expression, message) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate(client, expression)) {
      return;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }

  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

let client;

try {
  await waitForDebugger();
  const targetResponse = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
    { method: "PUT" }
  );
  const target = await targetResponse.json();
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send("Page.enable"),
    client.send("Runtime.enable"),
    client.send("DOM.enable")
  ]);

  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__photoUploadCount = 0;
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = String(input?.url || input);
        if (url.includes("/api/recipe/photo")) {
          if ((init.method || "GET").toUpperCase() === "DELETE") {
            return new Response(JSON.stringify({ ok: true, deleted: true }), {
              status: 200,
              headers: { "content-type": "application/json" }
            });
          }
          window.__photoUploadCount += 1;
          return new Response(JSON.stringify({
            ok: true,
            photoUrl: ".tmp-dessert-photo.png?v=" + window.__photoUploadCount
          }), {
            status: 200,
            headers: { "content-type": "application/json" }
          });
        }
        return originalFetch(input, init);
      };
    `
  });
  await client.send("Page.navigate", { url: `http://127.0.0.1:${sitePort}/admin.html` });
  await waitFor(
    client,
    `document.readyState === "complete" && document.querySelectorAll(".recipe-list__item").length > 0`,
    "Admin recipe list did not load."
  );

  const screenshot = await client.send("Page.captureScreenshot", { format: "png" });
  await writeFile(uploadPath, Buffer.from(screenshot.data, "base64"));

  await evaluate(client, `document.querySelector(".recipe-list__item").click()`);
  await waitFor(client, `Boolean(document.querySelector(".recipe-photo-editor"))`, "Photo editor did not render.");

  const initialControls = await evaluate(client, `({
    accept: document.querySelector('input[name="photoFile"]').accept,
    hasUpload: [...document.querySelectorAll("button")].some((button) => button.textContent === "Upload Photo"),
    hasUrl: [...document.querySelectorAll("button")].some((button) => button.textContent === "Paste Image URL"),
    hasDrop: document.querySelector(".recipe-photo-dropzone").textContent.includes("Drag and drop"),
    emptyPreview: document.querySelector(".recipe-photo-preview").textContent.includes("No dessert photo")
  })`);
  assert(initialControls.accept === "image/jpeg,image/png,image/webp", "File picker accept types are incorrect.");
  assert(initialControls.hasUpload && initialControls.hasUrl && initialControls.hasDrop, "Photo controls are incomplete.");
  assert(initialControls.emptyPreview, "Recipes without photos must show an empty preview.");

  const documentNode = await client.send("DOM.getDocument");
  const fileInputNode = await client.send("DOM.querySelector", {
    nodeId: documentNode.root.nodeId,
    selector: 'input[name="photoFile"]'
  });
  await client.send("DOM.setFileInputFiles", {
    nodeId: fileInputNode.nodeId,
    files: [uploadPath]
  });
  await evaluate(client, `document.querySelector('input[name="photoFile"]').dispatchEvent(new Event("change", { bubbles: true }))`);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  const uploadDebug = await evaluate(client, `({
    files: document.querySelector('input[name="photoFile"]').files.length,
    status: document.querySelector(".recipe-photo-editor__status").textContent,
    url: document.querySelector('input[name="photoUrl"]').value,
    uploads: window.__photoUploadCount
  })`);
  assert(!uploadDebug.status.includes("failed"), `Desktop upload failed: ${JSON.stringify(uploadDebug)}`);
  await waitFor(
    client,
    `document.querySelector(".recipe-photo-editor__status").textContent.includes("Photo uploaded")`,
    "Desktop file upload did not complete."
  );

  const firstUpload = await evaluate(client, `({
    url: document.querySelector('input[name="photoUrl"]').value,
    previewVisible: !document.querySelector(".recipe-photo-preview__image")?.hidden,
    dirty: document.querySelector("#admin-content").dataset.adminHasDraft
  })`);
  assert(/\?v=\d+$/.test(firstUpload.url), `Uploaded photo path was not populated: ${firstUpload.url}`);
  assert(firstUpload.previewVisible, "Uploaded photo preview is not visible.");

  await evaluate(client, `(async () => {
    const response = await fetch(".tmp-dessert-photo.png");
    const blob = await response.blob();
    const transfer = new DataTransfer();
    transfer.items.add(new File([blob], "replacement.webp", { type: "image/webp" }));
    const dropZone = document.querySelector(".recipe-photo-dropzone");
    dropZone.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    dropZone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  })()`);
  await waitFor(
    client,
    `document.querySelector('input[name="photoUrl"]').value !== ${JSON.stringify(firstUpload.url)}`,
    "Drag-and-drop replacement did not update the photo path."
  );

  await evaluate(client, `(() => {
    [...document.querySelectorAll("button")].find((button) => button.textContent === "Paste Image URL").click();
    const input = document.querySelector('input[name="photoUrl"]');
    input.value = ".tmp-dessert-photo.png?url";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  assert(
    await evaluate(client, `document.querySelector('input[name="photoUrl"]').value.endsWith("?url")`),
    "Image URL entry did not remain available."
  );

  await evaluate(client, `[...document.querySelectorAll("button")].find((button) => button.textContent === "Delete Photo").click()`);
  assert(
    await evaluate(client, `document.querySelector('input[name="photoUrl"]').value === ""`),
    "Delete Photo did not clear the photo path."
  );

  const popupResult = await evaluate(client, `(async () => {
    const { createRecipeModal } = await import("/js/renderRecipeModal.js");
    const modal = createRecipeModal();
    document.body.append(modal.element);
    modal.openRecipe({
      title: "Browser Test Dessert",
      yield: "12 servings",
      category: "Dessert",
      photoUrl: ".tmp-dessert-photo.png",
      ingredients: [],
      steps: []
    });
    const button = [...modal.element.querySelectorAll("button")]
      .find((candidate) => candidate.textContent.includes("Dessert Photo"));
    button.click();
    return {
      buttonLabel: button.textContent,
      popupVisible: !modal.element.querySelector(".recipe-photo-popup").hidden,
      imageSource: modal.element.querySelector(".recipe-photo-popup__image").getAttribute("src")
    };
  })()`);
  assert(popupResult.buttonLabel.includes("Dessert Photo"), "Recipe photo button is missing.");
  assert(popupResult.popupVisible, "Recipe photo popup did not open.");
  assert(popupResult.imageSource === ".tmp-dessert-photo.png", "Recipe popup image source is incorrect.");

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  const mobileResult = await evaluate(client, `({
    viewportWidth: window.innerWidth,
    photoWidth: document.querySelector(".recipe-photo-editor").getBoundingClientRect().width,
    inputType: document.querySelector('input[name="photoFile"]').type,
    accept: document.querySelector('input[name="photoFile"]').accept
  })`);
  assert(mobileResult.viewportWidth === 390, "Mobile viewport emulation failed.");
  assert(mobileResult.photoWidth <= 390, "Photo editor overflows the mobile viewport.");
  assert(mobileResult.inputType === "file" && mobileResult.accept.includes("image/"), "Native mobile file input is unavailable.");

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "desktop file picker",
      "live preview",
      "drag-and-drop replacement",
      "image URL mode",
      "photo deletion",
      "legacy recipe empty state",
      "recipe photo popup",
      "mobile native file input and layout"
    ]
  }, null, 2));
} finally {
  client?.close();
  await new Promise((resolvePromise) => server.close(resolvePromise));
  const chromeClosed = new Promise((resolvePromise) => {
    if (chrome.exitCode !== null) {
      resolvePromise();
      return;
    }

    chrome.once("exit", resolvePromise);
  });
  chrome.kill();
  await chromeClosed;
  await rm(uploadPath, { force: true });

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await rm(profileDirectory, { recursive: true, force: true });
      break;
    } catch (error) {
      if (attempt === 9) {
        console.warn(`Temporary Chrome profile cleanup skipped: ${error.message}`);
        break;
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }
}
