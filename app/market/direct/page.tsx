import { redirect } from "next/navigation";

/**
 * The direct board used to live here, one tap away from the Sell screen. It is
 * now part of that screen — a grower asking "where do I sell" should see the
 * price and the buyers together, not have to know to go looking. Kept as a
 * redirect so any link already shared still lands somewhere sensible.
 */
export default function DirectRedirect() {
  redirect("/market");
}
