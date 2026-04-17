import { init } from "@instantdb/react";
import schema from "../../instant.schema.ts";

// @ts-ignore: Vite injects import.meta.env at build time
const envAppId = typeof window !== "undefined"
  ? (window as any).ENV?.VITE_INSTANT_APP_ID
  : undefined;
// @ts-ignore: Vite injects import.meta.env at build time
const INSTANT_APP_ID: string = envAppId ||
  import.meta.env.VITE_INSTANT_APP_ID || "";

const db = init({
  appId: INSTANT_APP_ID,
  schema,
  devtool: false,
});

export const { useQuery, tx, transact, useAuth, auth } = db;
export { db };
