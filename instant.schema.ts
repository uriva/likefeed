import { i } from "@instantdb/admin";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    items: i.entity({
      url: i.string().unique().indexed(),
      title: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
    reactions: i.entity({
      type: i.string().indexed(),
      createdAt: i.number().indexed(),
    }),
    comments: i.entity({
      text: i.string(),
      createdAt: i.number().indexed(),
    }),
    itemLinks: i.entity({
      createdAt: i.number().indexed(),
    }),
    apiKeys: i.entity({
      keyHash: i.string().unique(),
      prefix: i.string(),
      name: i.string(),
      createdAt: i.number().indexed(),
      lastUsedAt: i.number().optional(),
    }),
  },
  links: {
    userReactions: {
      forward: { on: "reactions", has: "one", label: "user" },
      reverse: { on: "$users", has: "many", label: "reactions" },
    },
    userComments: {
      forward: { on: "comments", has: "one", label: "user" },
      reverse: { on: "$users", has: "many", label: "comments" },
    },
    userItemLinks: {
      forward: { on: "itemLinks", has: "one", label: "user" },
      reverse: { on: "$users", has: "many", label: "itemLinks" },
    },
    userApiKeys: {
      forward: {
        on: "apiKeys",
        has: "one",
        label: "user",
        onDelete: "cascade",
      },
      reverse: { on: "$users", has: "many", label: "apiKeys" },
    },
    itemReactions: {
      forward: {
        on: "reactions",
        has: "one",
        label: "item",
        onDelete: "cascade",
      },
      reverse: { on: "items", has: "many", label: "reactions" },
    },
    itemComments: {
      forward: {
        on: "comments",
        has: "one",
        label: "item",
        onDelete: "cascade",
      },
      reverse: { on: "items", has: "many", label: "comments" },
    },
    linkSource: {
      forward: { on: "itemLinks", has: "one", label: "sourceItem" },
      reverse: { on: "items", has: "many", label: "outgoingLinks" },
    },
    linkTarget: {
      forward: { on: "itemLinks", has: "one", label: "targetItem" },
      reverse: { on: "items", has: "many", label: "incomingLinks" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
