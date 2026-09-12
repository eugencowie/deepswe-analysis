import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";

import { useTheme } from "./theme-provider.tsx";

function Consumer() {
  return <span>{useTheme().theme}</span>;
}

test("useTheme throws outside a ThemeProvider", () => {
  expect(() => renderToStaticMarkup(<Consumer />)).toThrow(
    "useTheme must be used within a ThemeProvider",
  );
});
