# ComfyUI Group Manager

A frontend-only ComfyUI extension that adds a **Groups** sidebar tab listing every root-level group in the active workflow. Each row gives you a one-click bypass toggle and a jump-to-group anchor — no more hunting through a sprawling canvas.

## Features

- **Sorted list** of all root-level groups in the current workflow (natural alphanumeric order, so `01-` comes before `10-`).
- **Bypass toggle** — flips every node in the group between always-active (mode `0`) and bypass (mode `4`). Strikethrough indicates a fully-bypassed group.
- **Jump-to-group (→)** — centers the canvas on the group and rescales to fit, with a small padding margin.
- **Color stripe** mirrors each group's color so the list matches what's on the canvas.
- **Live updates** — the panel polls every 500 ms, so renames, color changes, and bypass state stay in sync.

## Requirements

- ComfyUI with the new front-end (`extensionManager.registerSidebarTab` is required). On older builds the extension loads but does nothing.

## Installation

### Manual

1. Clone or download this repo into your ComfyUI `custom_nodes` folder:
   ```
   ComfyUI/custom_nodes/comfyui-group-manager/
   ```
2. Restart ComfyUI.
3. Open the **Groups** tab in the left sidebar.

### Via ComfyUI Manager

Once published to the [ComfyUI Registry](https://registry.comfy.org/), search for "Group Manager" in ComfyUI Manager and install.

## Usage

| Element | Action |
| --- | --- |
| Checkbox | Toggle bypass for every node in the group |
| Group name | Display only (truncates if too long; full name in tooltip) |
| → button | Pan and zoom the canvas to fit the group |

## Caveats

- **Bypass is a flat ALWAYS↔BYPASS flip.** Nodes manually set to mute (`mode 2`) inside a group will be overwritten when you toggle. The extension does not currently remember per-node prior modes.
- **Saving the workflow** persists the in-memory group order. Sorting in the sidebar does not mutate the workflow file unless you save afterward.
- Subgraph contents are not listed — only top-level workflow groups (which is all LiteGraph supports anyway).
