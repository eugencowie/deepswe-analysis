import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";

import { ModeToggle } from "./mode-toggle.tsx";

test("useTheme throws outside a ThemeProvider", () => {
  expect(() => renderToStaticMarkup(<ModeToggle />)).toThrow(
    "useTheme must be used within a ThemeProvider",
  );
});
