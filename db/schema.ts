import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
  id:text('id').primaryKey(),title:text('title').notNull(),category:text('category').notNull(),body:text('body').notNull(),recordDate:text('record_date').notNull(),status:text('status').notNull(),images:text('images').notNull().default('[]'),author:text('author').notNull().default('伏谷'),revision:integer('revision').notNull().default(1),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('records_status_date_idx').on(t.status,t.recordDate)]);
export const media = sqliteTable('media', {id:text('id').primaryKey(),mimeType:text('mime_type').notNull(),size:integer('size').notNull(),createdAt:text('created_at').notNull()});
export const templeUpdates = sqliteTable('temple_updates', {
  templeId:text('temple_id').primaryKey(),draft:text('draft').notNull(),published:text('published'),checklist:text('checklist').notNull().default('[]'),privateNotes:text('private_notes').notNull().default(''),revision:integer('revision').notNull().default(1),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
});
