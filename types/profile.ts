import { Database } from "./database.types";

/**
 * PublicProfile excludes `email` which is PII.
 * Use this type everywhere profile data is displayed in the UI
 * or passed between server/client components.
 */
export type PublicProfile = Omit<
  Database["public"]["Tables"]["profiles"]["Row"],
  "email"
>;
