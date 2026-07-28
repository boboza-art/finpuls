declare module "sql.js" {
  export interface Database {
    run(sql: string, params?: unknown[]): Database;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(params?: unknown[]): Statement;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }

  export type SqlJsStatic = {
    Database: typeof Database;
  };

  export default function initSqlJs(
    config?: { locateFile?: (file: string) => string }
  ): Promise<SqlJsStatic>;

  export type DatabaseConstructor = typeof Database;
}
