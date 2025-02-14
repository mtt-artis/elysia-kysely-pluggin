import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>) {
  await db.schema
    .createTable("users")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("given_name", "text", (col) => col.notNull())
    .addColumn("family_name", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("rooms")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("topic", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("created_by", "text", (col) => col.notNull().references("users.id"))
    .addColumn("modify_at", "timestamptz", (col) => col.notNull())
    .addColumn("modify_by", "text", (col) => col.notNull().references("users.id"))
    .execute();

  await db.schema
    .createTable("messages")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("room_id", "integer", (col) => col.notNull().references("rooms.id"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("created_by", "text", (col) => col.notNull().references("users.id"))
    .addColumn("modify_at", "timestamptz", (col) => col.notNull())
    .addColumn("modify_by", "text", (col) => col.notNull().references("users.id"))
    .execute();

  await db.schema
    .createTable("users_rooms")
    .addColumn("user_id", "text", (col) => col.notNull().references("users.id"))
    .addColumn("room_id", "integer", (col) => col.notNull().references("rooms.id"))
    .addColumn("seen_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("pk_users_rooms", ["user_id", "room_id"])
    .execute();

  await db.schema
    .createTable("rooms_allows")
    .addColumn("room_id", "integer", (col) => col.notNull().references("rooms.id"))
    .addColumn("key", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("created_by", "text", (col) => col.notNull().references("users.id"))
    .addPrimaryKeyConstraint("pk_rooms_allows", ["room_id","key"])
    .execute();

  await db.schema
    .createTable("rooms_bans")
    .addColumn("room_id", "integer", (col) => col.notNull().references("rooms.id"))
    .addColumn("key", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("created_by", "text", (col) => col.notNull().references("users.id"))
    .addPrimaryKeyConstraint("pk_rooms_bans", ["room_id","key"])
    .execute();

}

export async function down(db: Kysely<unknown>) {
  await db.schema.dropTable("rooms_bans").execute();
  await db.schema.dropTable("rooms_allows").execute();
  await db.schema.dropTable("users_rooms").execute();
  await db.schema.dropTable("messages").execute();
  await db.schema.dropTable("rooms").execute();
  await db.schema.dropTable("users").execute();
}
