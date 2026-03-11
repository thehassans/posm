const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, 'pos.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const database = new DatabaseSync(DB_PATH);

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
database.exec('PRAGMA journal_mode = WAL');
database.exec('PRAGMA foreign_keys = ON');
database.exec(schema);

const toPlainRow = (row) => (row ? { ...row } : row);
const toPlainRows = (rows) => rows.map((row) => ({ ...row }));

const db = {
    exec(sql) {
        return database.exec(sql);
    },
    pragma(sql) {
        return database.exec(`PRAGMA ${sql}`);
    },
    prepare(sql) {
        const statement = database.prepare(sql);

        return {
            run(...params) {
                return statement.run(...params);
            },
            get(...params) {
                return toPlainRow(statement.get(...params));
            },
            all(...params) {
                return toPlainRows(statement.all(...params));
            }
        };
    },
    transaction(callback) {
        return (...args) => {
            database.exec('BEGIN');
            try {
                const result = callback(...args);
                database.exec('COMMIT');
                return result;
            } catch (error) {
                database.exec('ROLLBACK');
                throw error;
            }
        };
    }
};

module.exports = db;
