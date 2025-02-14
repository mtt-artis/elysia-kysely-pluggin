import { Elysia, t, type AnyElysia, type TSchema } from "elysia";
import swagger from "@elysiajs/swagger";
import type { DB } from "./db.generated";
import { CamelCasePlugin, FileMigrationProvider, Kysely, Migrator } from "kysely";
import { Database } from "bun:sqlite";
import fs from "node:fs/promises";
import path from "node:path"
import { BunSqliteDialect } from "kysely-bun-sqlite";


const db = new Kysely<DB>({
    dialect: new BunSqliteDialect({
        database: new Database(),
    }),
    plugins: [new CamelCasePlugin()],
});

const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(process.cwd(), './migrations'),
    }),
})

const { error, results } = await migrator.migrateToLatest()

results?.forEach((it) => {
    if (it.status === 'Success') {
        console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`)
    }
})

if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
}


// TODO: find a wait to get primary key in auto
const genApi = async <E extends AnyElysia, DB extends Object, T extends keyof DB & string>(app: E, options: {
    db: Kysely<DB>,
    path?: string;
    schema?: TSchema;
    table: T,
    primary: keyof DB[T] & string,
    macro?: E["_types"]["Metadata"]["macro"],
    get?: { macro: E["_types"]["Metadata"]["macro"] },
    post?: { macro: E["_types"]["Metadata"]["macro"] }
    put?: { macro: E["_types"]["Metadata"]["macro"] }
    delete?: { macro: E["_types"]["Metadata"]["macro"] }
}) => {
    const tables = await options.db.introspection.getTables();
    const tInfo = tables.find(t => t.name === options.table);
    if (!tInfo) throw new Error(`table '${options.table}' not found`);

    // TODO: find a wait to get TSchema type based on t.name
    const schema = options.schema || t.Object(Object.fromEntries(tInfo.columns.map(c => {
        const datatype = c.dataType
        // TODO: add all type
        let schema: TSchema = datatype === "interger" ? t.Integer() : datatype === "timestamptz" ? t.Date() : datatype === "text" ? t.String() : t.String();
        if (c.isNullable) schema = t.Nullable(schema)
        if (c.hasDefaultValue || c.isAutoIncrementing) schema = t.Optional(schema)

        return [c.name, schema]
    })));

    const path = options.path || options.table;

    return app
        .get(path, ({ query }) => {
            return options.db
                .selectFrom(options.table)
                .selectAll()
                .$if(!!query, eb => eb.where(eb => eb.and(query || {})))
                .execute()
        },
            {
                query: t.Optional(t.Partial(schema)),
                response: t.Array(schema),
                ...(options.macro || {}),
                ...(options.get?.macro || {})

            })
        .post(path, ({ body }) => {
            return options.db
                .insertInto(options.table)
                .values({ ...body })
                .returningAll()
                .executeTakeFirstOrThrow()
        },
            {
                body: schema,
                response: schema,
                ...(options.macro || {}),
                ...(options.post?.macro || {})

            })
        .put(`${path}/:id`, ({ params: { id }, body }) => {
            return options.db
                .updateTable(options.table)
                .set(body)
                .where(options.primary, "=", id)
                .returningAll()
                .executeTakeFirstOrThrow()
        },
            {
                params: t.Object({ id: t.String() }),
                body: schema,
                response: schema,
                ...(options.macro || {}),
                ...(options.put?.macro || {})

            })
        .delete(`${path}/:id`, ({ params: { id } }) => {
            return options.db
                .deleteFrom(options.table)
                .where(options.primary, "=", id)
                .returningAll()
                .executeTakeFirstOrThrow()
        },
            {
                params: t.Object({ id: t.String() }),
                response: schema,
                ...(options.macro || {}),
                ...(options.delete?.macro || {})
            })
}

const macro = new Elysia().macro({
    hi(word: string) {
        return {
            beforeHandle() {
                console.log(word)
            }
        }
    }
})

new Elysia()
    .use(swagger())
    .use(macro)
    .use(app => genApi(app, {
        macro: {
            hi: "default"
        },
        post: {
            macro: {
                hi: "post"
            }
        },
        db,
        table: "messages",
        primary: "id",
    }))
    .listen(3000, async ({ hostname, port }) => {
        console.log(`🦊 Elysia is running at ${hostname}:${port}`);
    });
