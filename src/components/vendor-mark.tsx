import { cn } from "cn";
import { vendorMarkSvgs } from "@/components/vendor-mark-svgs";

export function VendorMark({ vendor, className }: { vendor: string; className?: string }) {
  const svg = vendorMarkSvgs[vendor];
  if (svg === undefined) return null;
  return (
    <span
      role="img"
      aria-label={vendor}
      className={cn("inline-block align-text-bottom [&>svg]:size-4", className)}
      // Static build-time SVG strings from the icon package, never user input.
      // The wrapper carries the accessible name; the SVG's own <title> would
      // otherwise expose a second, sometimes differently named, nested image.
      dangerouslySetInnerHTML={{ __html: svg.replace("<svg", '<svg aria-hidden="true"') }}
    />
  );
}
