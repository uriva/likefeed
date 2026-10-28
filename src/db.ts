// deno-lint-ignore-file no-explicit-any
import { id, init } from "@instantdb/admin";
import schema from "../instant.schema.ts";

let _db: any = null;

const getDb = () => {
  if (!_db) {
    _db = init({
      appId: Deno.env.get("INSTANT_APP_ID")!,
      adminToken: Deno.env.get("INSTANT_ADMIN_TOKEN")!,
      schema,
    });
  }
  return _db;
};

const db: ReturnType<typeof init<typeof schema>> = new Proxy({} as any, {
  get(_target, prop) {
    const inst = getDb();
    const val = inst[prop];
    return typeof val === "function" ? val.bind(inst) : val;
  },
});

export { db, id };
