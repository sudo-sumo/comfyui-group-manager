"""ComfyUI Group Manager — frontend-only extension.

Adds a sidebar tab that lists every root-level group in the active workflow,
each with a bypass/enable toggle and a jump-to-group anchor button.
"""

WEB_DIRECTORY = "./web"

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
