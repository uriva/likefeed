import type { InstantRules } from "@instantdb/admin";

const rules = {
  attrs: {
    allow: {
      $default: "false",
    },
  },
  items: {
    allow: {
      view: "true",
    },
  },
  reactions: {
    allow: {
      view: "true",
    },
  },
  comments: {
    allow: {
      view: "true",
    },
  },
  itemLinks: {
    allow: {
      view: "true",
    },
  },
  apiKeys: {
    allow: {
      view: "auth.id in data.ref('user.id')",
    },
  },
} satisfies InstantRules;

export default rules;
