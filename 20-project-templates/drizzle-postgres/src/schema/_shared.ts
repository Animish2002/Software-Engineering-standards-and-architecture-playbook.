import { boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

/** Time-ordered UUID primary key generated in the app (better index locality than random v4). */
export const id = () => uuid('id').primaryKey().$defaultFn(() => uuidv7());

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

export const softDelete = {
  isTrashed: boolean('is_trashed').notNull().default(false),
  trashedAt: timestamp('trashed_at', { withTimezone: true }),
};
