import { mysqlTable, int, varchar, mysqlEnum, text } from 'drizzle-orm/mysql-core';

const itemsTable = mysqlTable('items', {
  id: int('id').autoincrement().primaryKey(),
  device: varchar('device', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['on', 'off']).notNull().default('off'),
  room: varchar('room', { length: 255 }).notNull(),
  description: text('description').notNull(),
  image: varchar('image', { length: 1024 }),
});

export { itemsTable };
