import oracledb from "oracledb";

// Oracle Connection Configuration
const oracleConfig = {
  user: process.env.ORACLE_USER || "PONTO_USER",
  password: process.env.ORACLE_PASSWORD || "DefaultPassword123",
  connectionString: process.env.ORACLE_CONNECTION_STRING || "localhost:1521/XE",
};

let connectionPool: oracledb.Pool | null = null;

/**
 * Initialize Oracle Connection Pool
 */
export async function initializeOraclePool() {
  try {
    if (!connectionPool) {
      connectionPool = await oracledb.createPool({
        ...oracleConfig,
        poolMax: 10,
        poolMin: 2,
        poolIncrement: 1,
        waitTimeout: 3000,
        enableStatistics: true,
      });
      console.log("✅ Oracle Connection Pool initialized");
    }
    return connectionPool;
  } catch (error) {
    console.error("❌ Oracle Pool Error:", error);
    throw error;
  }
}

/**
 * Get Connection from Pool
 */
export async function getOracleConnection() {
  const pool = await initializeOraclePool();
  return await pool.getConnection();
}

/**
 * Execute Query
 */
export async function executeQuery(
  sql: string,
  params: any[] = [],
  options: any = {}
) {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });
    return result;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

/**
 * Insert Attendance Record - Oracle Integration
 */
export async function insertAttendanceOracleV2(data: {
  employee_id: number;
  device_id: string;
  source: string;
  confidence?: number;
  photo_path?: string;
  coordinates?: string;
}) {
  const sql = `
    INSERT INTO PONTO.ATTENDANCE_RECORDS_V2 (
      EMPLOYEE_ID,
      DEVICE_ID,
      SOURCE,
      CONFIDENCE,
      PHOTO_PATH,
      COORDINATES,
      CREATED_AT,
      STATUS
    ) VALUES (
      :employee_id,
      :device_id,
      :source,
      :confidence,
      :photo_path,
      :coordinates,
      SYSTIMESTAMP,
      'PROCESSED'
    )
    RETURNING ID, CREATED_AT INTO :out_id, :out_created_at
  `;

  try {
    const result = await executeQuery(sql, [
      data.employee_id,
      data.device_id,
      data.source,
      data.confidence || 0.95,
      data.photo_path || null,
      data.coordinates || null,
    ]);

    return result;
  } catch (error) {
    console.error("❌ Error inserting attendance to Oracle:", error);
    throw error;
  }
}

/**
 * Get Employee by ID - Oracle
 */
export async function getEmployeeFromOracle(employeeId: number) {
  const sql = `
    SELECT 
      EMP_ID,
      REGISTRATION,
      NAME,
      DEPARTMENT,
      SHIFT_NAME,
      PHOTO_URL,
      FACE_TEMPLATE,
      STATUS
    FROM PONTO.EMPLOYEES
    WHERE EMP_ID = :emp_id AND STATUS = 'ACTIVE'
  `;

  try {
    const result = await executeQuery(sql, [employeeId]);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error("❌ Error fetching employee from Oracle:", error);
    throw error;
  }
}

/**
 * Search Employee by Face Data - Oracle
 */
export async function searchEmployeeByFaceOracle(faceTemplate: string) {
  const sql = `
    SELECT 
      EMP_ID,
      REGISTRATION,
      NAME,
      DEPARTMENT,
      SHIFT_NAME,
      PHOTO_URL,
      FACE_SIMILARITY
    FROM (
      SELECT 
        EMP_ID,
        REGISTRATION,
        NAME,
        DEPARTMENT,
        SHIFT_NAME,
        PHOTO_URL,
        SIMILARITY(FACE_TEMPLATE, :face_template) AS FACE_SIMILARITY
      FROM PONTO.EMPLOYEES
      WHERE STATUS = 'ACTIVE'
    )
    WHERE FACE_SIMILARITY > 0.85
    ORDER BY FACE_SIMILARITY DESC
    FETCH FIRST 1 ROWS ONLY
  `;

  try {
    const result = await executeQuery(sql, [faceTemplate]);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error("❌ Error searching employee by face:", error);
    throw error;
  }
}

/**
 * Get Attendance History - Oracle
 */
export async function getAttendanceHistoryOracle(
  employeeId: number,
  days: number = 30
) {
  const sql = `
    SELECT 
      ID,
      EMPLOYEE_ID,
      SOURCE,
      CONFIDENCE,
      CREATED_AT,
      STATUS
    FROM PONTO.ATTENDANCE_RECORDS_V2
    WHERE EMPLOYEE_ID = :emp_id 
      AND CREATED_AT >= TRUNC(SYSDATE - :days)
    ORDER BY CREATED_AT DESC
  `;

  try {
    const result = await executeQuery(sql, [employeeId, days]);
    return result.rows || [];
  } catch (error) {
    console.error("❌ Error fetching attendance history:", error);
    throw error;
  }
}

/**
 * Get Daily Statistics - Oracle
 */
export async function getDailyStatsOracle() {
  const sql = `
    SELECT 
      COUNT(DISTINCT EMPLOYEE_ID) as total_checked_in,
      COUNT(*) as total_records,
      ROUND(AVG(CONFIDENCE), 2) as avg_confidence
    FROM PONTO.ATTENDANCE_RECORDS_V2
    WHERE TRUNC(CREATED_AT) = TRUNC(SYSDATE)
      AND STATUS = 'PROCESSED'
  `;

  try {
    const result = await executeQuery(sql);
    return result.rows?.[0] || {
      total_checked_in: 0,
      total_records: 0,
      avg_confidence: 0,
    };
  } catch (error) {
    console.error("❌ Error fetching daily stats:", error);
    return {
      total_checked_in: 0,
      total_records: 0,
      avg_confidence: 0,
    };
  }
}

/**
 * Close Oracle Pool
 */
export async function closeOraclePool() {
  if (connectionPool) {
    try {
      await connectionPool.close();
      connectionPool = null;
      console.log("✅ Oracle Connection Pool closed");
    } catch (error) {
      console.error("❌ Error closing pool:", error);
    }
  }
}

// Graceful shutdown
process.on("exit", async () => {
  await closeOraclePool();
});

export default {
  initializeOraclePool,
  getOracleConnection,
  executeQuery,
  insertAttendanceOracleV2,
  getEmployeeFromOracle,
  searchEmployeeByFaceOracle,
  getAttendanceHistoryOracle,
  getDailyStatsOracle,
  closeOraclePool,
};
