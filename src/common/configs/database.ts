const knex = require("knex");
import { env } from "../utils/envConfig";

const config = {
    development: {
        client: "mysql2",
        connection: {
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
        },
    },
};

const db = knex(config.development);

export default db;
