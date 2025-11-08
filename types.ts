
export interface ProcessedData {
  tableName: string;
  cleanedData: Record<string, any>[];
  createTableSql: string;
  insertSql: string;
  explanation: string;
}
