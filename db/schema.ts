import { pgTable, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';
import type { State } from '../src/types.js';
export const studySpaces = pgTable('study_spaces', {
  userId: text('user_id').primaryKey(),
  data: jsonb('data').$type<State>().notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
