import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import {
  insertAttendanceOracleV2,
  getEmployeeFromOracle,
  searchEmployeeByFaceOracle,
} from "@/lib/oracle";
import {
  uploadPhotoToS3,
  detectFaceAWS,
  compareFacesAWS,
  storeAttendanceDynamoDB,
  logCloudWatchMetric,
} from "@/lib/aws-integration";

export const runtime = "nodejs";

/**
 * POST /api/attendance/recognize
 * Main endpoint for face recognition and attendance registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, device_id, source } = body;

    // Validate input
    if (!image || !device_id) {
      return NextResponse.json(
        { message: "Imagem e device_id são obrigatórios" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Step 1: Detect face in image
    const faceDetection = await detectFaceAWS(imageBuffer);

    if (!faceDetection.faceFound) {
      logCloudWatchMetric("FaceDetectionFailed", 1);
      return NextResponse.json(
        { message: "❌ Nenhum rosto detectado. Tente novamente." },
        { status: 400 }
      );
    }

    // Log metrics
    await logCloudWatchMetric("FaceDetectionSuccess", 1);
    await logCloudWatchMetric("FaceConfidence", faceDetection.confidence, "Percent");

    // Step 2: Search for matching employee (simplified - use face search API in production)
    // In production, you would use AWS Rekognition search or custom ML model
    
    // For now, we'll use a simulated match with database lookup
    // In real scenario, you'd implement proper face recognition
    const employeeId = body.employee_id || 1; // This should come from face matching

    // Step 3: Get employee from Oracle
    const employee = await getEmployeeFromOracle(employeeId);

    if (!employee) {
      logCloudWatchMetric("EmployeeNotFound", 1);
      return NextResponse.json(
        { message: "❌ Funcionário não encontrado" },
        { status: 404 }
      );
    }

    // Step 4: Upload photo to S3
    const photoFileName = `${employeeId}-${Date.now()}.jpg`;
    const s3Path = await uploadPhotoToS3(imageBuffer, photoFileName);

    // Step 5: Insert attendance record in Oracle
    const attendanceResult = await insertAttendanceOracleV2({
      employee_id: employeeId,
      device_id,
      source: source || "FACE_RECOGNITION",
      confidence: faceDetection.confidence,
      photo_path: s3Path,
      coordinates: JSON.stringify({
        x: faceDetection.faceDetails?.BoundingBox?.Left,
        y: faceDetection.faceDetails?.BoundingBox?.Top,
        width: faceDetection.faceDetails?.BoundingBox?.Width,
        height: faceDetection.faceDetails?.BoundingBox?.Height,
      }),
    });

    // Step 6: Store in DynamoDB cache
    await storeAttendanceDynamoDB(String(employeeId), {
      timestamp: new Date().toISOString(),
      device_id,
      confidence: faceDetection.confidence,
      photo_url: s3Path,
    });

    // Log success
    await logCloudWatchMetric("AttendanceRecorded", 1);

    return NextResponse.json(
      {
        success: true,
        message: `✅ ${employee.NAME} registrado com sucesso`,
        employee: {
          id: employee.EMP_ID,
          registration: employee.REGISTRATION,
          name: employee.NAME,
          department: employee.DEPARTMENT,
          shift_name: employee.SHIFT_NAME,
          photo_url: employee.PHOTO_URL,
        },
        record: {
          id: attendanceResult.rowsAffected,
          event: "ENTRADA", // Auto-detect based on shift
          occurred_at: new Date().toISOString(),
          device_id,
          confidence: faceDetection.confidence,
          photo_url: s3Path,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Attendance Error:", error);
    await logCloudWatchMetric("AttendanceError", 1);

    return NextResponse.json(
      { message: "Erro ao processar reconhecimento facial" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/stats
 * Get daily attendance statistics
 */
export async function GET(request: NextRequest) {
  try {
    // This would fetch from Oracle or DynamoDB
    return NextResponse.json(
      {
        checked_in_today: 45,
        pending: 12,
        time_worked: "08:30",
        avg_confidence: 0.96,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Stats Error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
