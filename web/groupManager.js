import { app } from "../../scripts/app.js";

const BYPASS_MODE = 4;
const ALWAYS_MODE = 0;

const STYLE = `
.gm-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  font-size: 12px;
  color: var(--input-text);
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}
.gm-empty {
  opacity: 0.6;
  text-align: center;
  padding: 20px 8px;
  font-style: italic;
}
.gm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  background: var(--comfy-input-bg, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
}
.gm-item.gm-bypassed .gm-name {
  opacity: 0.45;
  text-decoration: line-through;
}
.gm-color {
  width: 4px;
  align-self: stretch;
  border-radius: 2px;
  flex-shrink: 0;
  background: #666;
}
.gm-toggle {
  flex-shrink: 0;
  margin: 0;
  cursor: pointer;
}
.gm-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}
.gm-nav {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.2));
  color: inherit;
  width: 26px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}
.gm-nav:hover {
  background: var(--p-button-text-primary-hover-background, rgba(255, 255, 255, 0.1));
}
`;

function injectStyle() {
  if (document.getElementById("group-manager-style")) return;
  const s = document.createElement("style");
  s.id = "group-manager-style";
  s.textContent = STYLE;
  document.head.appendChild(s);
}

function getGroups() {
  const groups = app.graph?._groups ?? [];
  return [...groups].sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "", undefined, { numeric: true, sensitivity: "base" }),
  );
}

function isGroupBypassed(group) {
  group.recomputeInsideNodes();
  const nodes = group._nodes ?? [];
  if (nodes.length === 0) return false;
  return nodes.every((n) => n.mode === BYPASS_MODE);
}

function setGroupBypassed(group, bypass) {
  group.recomputeInsideNodes();
  const nodes = group._nodes ?? [];
  const target = bypass ? BYPASS_MODE : ALWAYS_MODE;
  for (const n of nodes) n.mode = target;
  app.graph.setDirtyCanvas(true, true);
}

function navigateToGroup(group) {
  const canvas = app.canvas;
  if (!canvas) return;
  const [gx, gy, gw, gh] = group._bounding;
  const el = canvas.canvas;
  const cw = el.clientWidth || el.width;
  const ch = el.clientHeight || el.height;

  const padFactor = 0.85;
  const fitScale = Math.min(cw / gw, ch / gh) * padFactor;
  const scale = Math.max(0.1, Math.min(1.5, fitScale));

  canvas.ds.scale = scale;
  canvas.ds.offset[0] = cw / 2 / scale - (gx + gw / 2);
  canvas.ds.offset[1] = ch / 2 / scale - (gy + gh / 2);

  canvas.setDirty(true, true);
}

function buildItem(group) {
  const row = document.createElement("div");
  row.className = "gm-item";
  const bypassed = isGroupBypassed(group);
  if (bypassed) row.classList.add("gm-bypassed");

  const color = document.createElement("div");
  color.className = "gm-color";
  if (group.color) color.style.backgroundColor = group.color;
  row.appendChild(color);

  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.className = "gm-toggle";
  toggle.checked = !bypassed;
  toggle.title = toggle.checked ? "Enabled — click to bypass" : "Bypassed — click to enable";
  toggle.addEventListener("change", () => {
    setGroupBypassed(group, !toggle.checked);
    row.classList.toggle("gm-bypassed", !toggle.checked);
    toggle.title = toggle.checked ? "Enabled — click to bypass" : "Bypassed — click to enable";
  });
  row.appendChild(toggle);

  const name = document.createElement("span");
  name.className = "gm-name";
  const title = group.title || "(unnamed)";
  name.textContent = title;
  name.title = title;
  row.appendChild(name);

  const nav = document.createElement("button");
  nav.className = "gm-nav";
  nav.type = "button";
  nav.textContent = "→";
  nav.title = "Jump to group";
  nav.addEventListener("click", () => navigateToGroup(group));
  row.appendChild(nav);

  return row;
}

function snapshot(groups) {
  return groups
    .map((g) => {
      const b = g._bounding ?? [];
      const modes = (g._nodes ?? []).map((n) => n.mode).join(",");
      return `${g.title}|${g.color ?? ""}|${b.join(",")}|${modes}`;
    })
    .join(";");
}

function renderInto(host) {
  injectStyle();
  host.innerHTML = "";
  const container = document.createElement("div");
  container.className = "gm-container";
  host.appendChild(container);

  let lastSig = null;

  function refresh() {
    const groups = getGroups();
    const sig = `${groups.length}::${snapshot(groups)}`;
    if (sig === lastSig) return;
    lastSig = sig;

    container.innerHTML = "";
    if (groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "gm-empty";
      empty.textContent = "No groups in this workflow.";
      container.appendChild(empty);
      return;
    }
    for (const g of groups) container.appendChild(buildItem(g));
  }

  refresh();
  const interval = setInterval(() => {
    if (!host.isConnected) {
      clearInterval(interval);
      return;
    }
    refresh();
  }, 500);
}

app.registerExtension({
  name: "GroupManager.Sidebar",
  async setup() {
    if (!app.extensionManager?.registerSidebarTab) {
      console.warn(
        "[GroupManager] extensionManager.registerSidebarTab is unavailable; the sidebar tab will not be registered.",
      );
      return;
    }
    app.extensionManager.registerSidebarTab({
      id: "group-manager",
      icon: "pi pi-th-large",
      title: "Groups",
      tooltip: "List, bypass and jump to workflow groups",
      type: "custom",
      render: (el) => renderInto(el),
    });
  },
});
