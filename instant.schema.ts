// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $streams: i.entity({
      abortReason: i.string().optional(),
      clientId: i.string().unique().indexed(),
      done: i.boolean().optional(),
      size: i.number().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    apiKeys: i.entity({
      createdAt: i.number().indexed(),
      keyHash: i.string().unique(),
      lastUsedAt: i.number().optional(),
      name: i.string(),
      prefix: i.string(),
    }),
    comments: i.entity({
      createdAt: i.number().indexed(),
      text: i.string(),
    }),
    itemLinks: i.entity({
      createdAt: i.number().indexed(),
    }),
    items: i.entity({
      createdAt: i.number().indexed(),
      title: i.string().optional(),
      url: i.string().unique().indexed(),
    }),
    reactions: i.entity({
      createdAt: i.number().indexed(),
      type: i.string().indexed(),
    }),
  },
  links: {
    $streams$files: {
      forward: {
        on: "$streams",
        has: "many",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "$stream",
        onDelete: "cascade",
      },
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    apiKeysUser: {
      forward: {
        on: "apiKeys",
        has: "one",
        label: "user",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "apiKeys",
      },
    },
    commentsItem: {
      forward: {
        on: "comments",
        has: "one",
        label: "item",
        onDelete: "cascade",
      },
      reverse: {
        on: "items",
        has: "many",
        label: "comments",
      },
    },
    commentsUser: {
      forward: {
        on: "comments",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "comments",
      },
    },
    itemLinksSourceItem: {
      forward: {
        on: "itemLinks",
        has: "one",
        label: "sourceItem",
      },
      reverse: {
        on: "items",
        has: "many",
        label: "outgoingLinks",
      },
    },
    itemLinksTargetItem: {
      forward: {
        on: "itemLinks",
        has: "one",
        label: "targetItem",
      },
      reverse: {
        on: "items",
        has: "many",
        label: "incomingLinks",
      },
    },
    itemLinksUser: {
      forward: {
        on: "itemLinks",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "itemLinks",
      },
    },
    reactionsItem: {
      forward: {
        on: "reactions",
        has: "one",
        label: "item",
        onDelete: "cascade",
      },
      reverse: {
        on: "items",
        has: "many",
        label: "reactions",
      },
    },
    reactionsUser: {
      forward: {
        on: "reactions",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "reactions",
      },
    },
  },
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
