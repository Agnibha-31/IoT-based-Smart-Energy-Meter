// Helper script to convert SQL queries from SQLite (?) to PostgreSQL ($1, $2, etc.)
// This is used internally by the database module

export const convertQuery = (sql) => {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
};

export default convertQuery;
