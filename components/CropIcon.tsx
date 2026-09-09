import { cropIcon } from "@/lib/crops/icons";

/**
 * The crop's picture, in a consistent chip so a list of them lines up.
 *
 * Prefers a real photograph when a crop declares one in the registry, and falls
 * back to the emoji otherwise — so photos can be introduced crop by crop
 * without touching any of the screens that render this.
 */
export function CropIcon({
  cropId,
  image,
  size = 40,
  alt = "",
}: {
  cropId: string;
  image?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <span
      aria-hidden={alt ? undefined : true}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{
        width: size,
        height: size,
        background: "var(--surface-2)",
        fontSize: Math.round(size * 0.52),
        lineHeight: 1,
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- bundled static asset, no optimiser needed
        <img src={image} alt="" width={size} height={size} style={{ objectFit: "cover" }} />
      ) : (
        cropIcon(cropId)
      )}
    </span>
  );
}
