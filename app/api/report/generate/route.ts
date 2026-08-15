/**
 * 📊 PONTO FACIAL - Report Generation API
 * Gera relatórios profissionais em PDF com análises detalhadas
 * Version: 3.0.0
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

type ReportPeriod = "daily" | "weekly" | "monthly";
type ReportFormat = "json" | "csv" | "pdf";

interface ReportRequest {
  period: ReportPeriod;
  format: ReportFormat;
  startDate?: string;
  endDate?: string;
  departmentFilter?: string;
  employeeFilter?: string;
}

interface AttendanceRecord {
  employee_id: number;
  name: string;
  registration: string;
  department: string;
  event_type: string;
  occurred_at: string;
  confidence?: number;
}

interface DailyStats {
  date: string;
  total_employees: number;
  checked_in: number;
  checked_out: number;
  late_arrivals: number;
  absent: number;
  average_confidence: number;
  total_events: number;
}

interface EmployeeSummary {
  employee_id: number;
  name: string;
  registration: string;
  department: string;
  total_hours: number;
  check_ins: number;
  check_outs: number;
  late_arrivals: number;
  average_confidence: number;
  attendance_rate: number;
}

interface ReportData {
  title: string;
  period: string;
  generated_at: string;
  summary: {
    total_employees: number;
    total_events: number;
    average_confidence: number;
    attendance_rate: number;
  };
  daily_stats: DailyStats[];
  employee_summaries: EmployeeSummary[];
  insights: string[];
}

/**
 * GET /api/report/generate
 * Gera relatório com base nos parâmetros de filtro
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "daily") as ReportPeriod;
    const format = (searchParams.get("format") || "json") as ReportFormat;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentFilter = searchParams.get("department");
    const employeeFilter = searchParams.get("employee");

    // Validar parâmetros
    if (!["daily", "weekly", "monthly"].includes(period)) {
      return NextResponse.json(
        { error: "❌ Período inválido. Use: daily, weekly, monthly" },
        { status: 400 }
      );
    }

    if (!["json", "csv", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "❌ Formato inválido. Use: json, csv, pdf" },
        { status: 400 }
      );
    }

    // Calcular datas padrão baseado no período
    const dateRange = calculateDateRange(period, startDate, endDate);

    // Gerar dados do relatório
    const reportData = generateReportData(
      period,
      dateRange,
      departmentFilter,
      employeeFilter
    );

    // Retornar no formato solicitado
    switch (format) {
      case "csv":
        return generateCSV(reportData);
      case "pdf":
        return generatePDF(reportData);
      case "json":
      default:
        return NextResponse.json(reportData, { status: 200 });
    }
  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    return NextResponse.json(
      {
        error: "❌ Erro ao gerar relatório",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/report/generate
 * Salva relatório no banco de dados
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReportRequest;

    const { period, format, startDate, endDate, departmentFilter } = body;

    // Validações
    if (!period) {
      return NextResponse.json(
        { error: "❌ Parâmetro 'period' é obrigatório" },
        { status: 400 }
      );
    }

    // Calcular datas
    const dateRange = calculateDateRange(period, startDate, endDate);

    // Gerar dados
    const reportData = generateReportData(
      period,
      dateRange,
      departmentFilter
    );

    // Salvar no banco (opcional)
    saveReportToDB(reportData);

    // Retornar dados com link para download
    return NextResponse.json(
      {
        success: true,
        message: "✅ Relatório gerado com sucesso",
        report_id: `RPT-${Date.now()}`,
        data: reportData,
        download_url: `/api/report/download?id=${Date.now()}&format=${format}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    return NextResponse.json(
      {
        error: "❌ Erro ao gerar relatório",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Calcula intervalo de datas baseado no período
 */
function calculateDateRange(
  period: ReportPeriod,
  startDate?: string | null,
  endDate?: string | null
): { start: string; end: string } {
  let start: Date;
  let end = new Date();

  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  switch (period) {
    case "daily":
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "weekly":
      start = new Date();
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "monthly":
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    default:
      start = new Date();
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Gera dados completos do relatório
 */
function generateReportData(
  period: ReportPeriod,
  dateRange: { start: string; end: string },
  departmentFilter?: string | null,
  employeeFilter?: string | null
): ReportData {
  try {
    // Buscar registros de presença
    const query = `
      SELECT 
        ar.id,
        ar.employee_id,
        ar.event_type,
        ar.occurred_at,
        ar.confidence,
        e.name,
        e.registration,
        e.department
      FROM attendance_records ar
      JOIN employees e ON ar.employee_id = e.id
      WHERE ar.occurred_at BETWEEN ? AND ?
        ${departmentFilter ? "AND e.department = ?" : ""}
        ${employeeFilter ? "AND e.registration = ?" : ""}
      ORDER BY ar.occurred_at DESC
    `;

    const params: (string | number)[] = [dateRange.start, dateRange.end];
    if (departmentFilter) params.push(departmentFilter);
    if (employeeFilter) params.push(employeeFilter);

    const records = db.prepare(query).all(...params) as AttendanceRecord[];

    // Calcular estatísticas
    const dailyStats = calculateDailyStats(records, dateRange);
    const employeeSummaries = calculateEmployeeSummaries(records);
    const insights = generateInsights(records, dailyStats);

    const summary = {
      total_employees: new Set(records.map((r) => r.employee_id)).size,
      total_events: records.length,
      average_confidence: calculateAverageConfidence(records),
      attendance_rate: calculateAttendanceRate(records),
    };

    return {
      title: `Relatório de Presença - ${period === "daily" ? "Diário" : period === "weekly" ? "Semanal" : "Mensal"}`,
      period: `${new Date(dateRange.start).toLocaleDateString("pt-BR")} a ${new Date(dateRange.end).toLocaleDateString("pt-BR")}`,
      generated_at: new Date().toISOString(),
      summary,
      daily_stats: dailyStats,
      employee_summaries: employeeSummaries,
      insights,
    };
  } catch (error) {
    console.error("❌ Erro ao gerar dados do relatório:", error);
    return {
      title: "Relatório de Erro",
      period: "N/A",
      generated_at: new Date().toISOString(),
      summary: {
        total_employees: 0,
        total_events: 0,
        average_confidence: 0,
        attendance_rate: 0,
      },
      daily_stats: [],
      employee_summaries: [],
      insights: ["Erro ao gerar relatório"],
    };
  }
}

/**
 * Calcula estatísticas diárias
 */
function calculateDailyStats(
  records: AttendanceRecord[],
  dateRange: { start: string; end: string }
): DailyStats[] {
  const stats: { [date: string]: DailyStats } = {};

  // Inicializar dias do período
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    stats[dateStr] = {
      date: dateStr,
      total_employees: 0,
      checked_in: 0,
      checked_out: 0,
      late_arrivals: 0,
      absent: 0,
      average_confidence: 0,
      total_events: 0,
    };
  }

  // Processar registros
  records.forEach((record) => {
    const dateStr = record.occurred_at.split("T")[0];
    if (stats[dateStr]) {
      stats[dateStr].total_events++;
      if (record.event_type === "ENTRADA") {
        stats[dateStr].checked_in++;
        const hour = new Date(record.occurred_at).getHours();
        if (hour > 9) stats[dateStr].late_arrivals++;
      } else if (record.event_type === "SAÍDA") {
        stats[dateStr].checked_out++;
      }

      if (record.confidence) {
        stats[dateStr].average_confidence =
          (stats[dateStr].average_confidence * (stats[dateStr].total_events - 1) +
            record.confidence) /
          stats[dateStr].total_events;
      }
    }
  });

  return Object.values(stats).sort((a, b) =>
    new Date(a.date).getTime() > new Date(b.date).getTime() ? 1 : -1
  );
}

/**
 * Calcula resumo por funcionário
 */
function calculateEmployeeSummaries(records: AttendanceRecord[]): EmployeeSummary[] {
  const summaries: { [id: number]: EmployeeSummary } = {};

  records.forEach((record) => {
    if (!summaries[record.employee_id]) {
      summaries[record.employee_id] = {
        employee_id: record.employee_id,
        name: record.name,
        registration: record.registration,
        department: record.department,
        total_hours: 0,
        check_ins: 0,
        check_outs: 0,
        late_arrivals: 0,
        average_confidence: 0,
        attendance_rate: 0,
      };
    }

    const summary = summaries[record.employee_id];
    if (record.event_type === "ENTRADA") {
      summary.check_ins++;
      const hour = new Date(record.occurred_at).getHours();
      if (hour > 9) summary.late_arrivals++;
    } else if (record.event_type === "SAÍDA") {
      summary.check_outs++;
    }

    if (record.confidence) {
      summary.average_confidence =
        (summary.average_confidence * (summary.check_ins + summary.check_outs - 1) +
          record.confidence) /
        (summary.check_ins + summary.check_outs);
    }
  });

  return Object.values(summaries).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Calcula confiança média
 */
function calculateAverageConfidence(records: AttendanceRecord[]): number {
  const withConfidence = records.filter((r) => r.confidence);
  if (withConfidence.length === 0) return 0;
  const sum = withConfidence.reduce(
    (acc, r) => acc + (r.confidence || 0),
    0
  );
  return +(sum / withConfidence.length).toFixed(4);
}

/**
 * Calcula taxa de presença
 */
function calculateAttendanceRate(records: AttendanceRecord[]): number {
  const uniqueEmployees = new Set(records.map((r) => r.employee_id));
  const checkIns = records.filter((r) => r.event_type === "ENTRADA").length;
  if (uniqueEmployees.size === 0) return 0;
  return +(
    (checkIns / (uniqueEmployees.size * 1)) * 100
  ).toFixed(2);
}

/**
 * Gera insights automáticos
 */
function generateInsights(
  records: AttendanceRecord[],
  dailyStats: DailyStats[]
): string[] {
  const insights: string[] = [];

  // Taxa de presença
  const totalCheckIns = records.filter(
    (r) => r.event_type === "ENTRADA"
  ).length;
  if (totalCheckIns > 0) {
    insights.push(`📊 Total de ${totalCheckIns} registros de entrada`);
  }

  // Atrasos
  const lateArrivals = records.filter(
    (r) =>
      r.event_type === "ENTRADA" &&
      new Date(r.occurred_at).getHours() > 9
  ).length;
  if (lateArrivals > 0) {
    insights.push(
      `⏰ ${lateArrivals} chegadas atrasadas (após 9:00)`
    );
  }

  // Confiança média
  const avgConfidence = calculateAverageConfidence(records);
  if (avgConfidence > 0) {
    insights.push(
      `✅ Confiança média de ${(avgConfidence * 100).toFixed(1)}% no reconhecimento`
    );
  }

  // Dia com maior movimento
  if (dailyStats.length > 0) {
    const maxDay = dailyStats.reduce((max, day) =>
      day.total_events > max.total_events ? day : max
    );
    insights.push(
      `📈 ${maxDay.date} foi o dia com maior movimento (${maxDay.total_events} eventos)`
    );
  }

  return insights;
}

/**
 * Gera relatório em CSV
 */
function generateCSV(data: ReportData): NextResponse {
  let csv = `Relatório de Presença\n`;
  csv += `Período: ${data.period}\n`;
  csv += `Gerado em: ${new Date(data.generated_at).toLocaleString("pt-BR")}\n\n`;

  csv += `RESUMO\n`;
  csv += `Total de Funcionários,${data.summary.total_employees}\n`;
  csv += `Total de Eventos,${data.summary.total_events}\n`;
  csv += `Confiança Média,${(data.summary.average_confidence * 100).toFixed(1)}%\n`;
  csv += `Taxa de Presença,${data.summary.attendance_rate}%\n\n`;

  csv += `ESTATÍSTICAS DIÁRIAS\n`;
  csv += `Data,Eventos,Entradas,Saídas,Atrasos,Confiança Média\n`;
  data.daily_stats.forEach((stat) => {
    csv += `${stat.date},${stat.total_events},${stat.checked_in},${stat.checked_out},${stat.late_arrivals},${(stat.average_confidence * 100).toFixed(1)}%\n`;
  });

  csv += `\nRESUMO POR FUNCIONÁRIO\n`;
  csv += `Matrícula,Nome,Departamento,Entradas,Saídas,Atrasos,Confiança Média\n`;
  data.employee_summaries.forEach((emp) => {
    csv += `${emp.registration},${emp.name},${emp.department},${emp.check_ins},${emp.check_outs},${emp.late_arrivals},${(emp.average_confidence * 100).toFixed(1)}%\n`;
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-presenca-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

/**
 * Gera relatório em PDF (placeholder - requer library como puppeteer)
 */
function generatePDF(data: ReportData): NextResponse {
  // Nota: Para PDF completo, seria necessário usar puppeteer ou jsPDF
  // Por enquanto, retornar JSON com indicação de formato
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #00d084; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #00d084; color: white; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <p><strong>Período:</strong> ${data.period}</p>
        <p><strong>Gerado em:</strong> ${new Date(data.generated_at).toLocaleString("pt-BR")}</p>
        
        <h2>Resumo</h2>
        <table>
          <tr>
            <td>Total de Funcionários</td>
            <td>${data.summary.total_employees}</td>
          </tr>
          <tr>
            <td>Total de Eventos</td>
            <td>${data.summary.total_events}</td>
          </tr>
          <tr>
            <td>Confiança Média</td>
            <td>${(data.summary.average_confidence * 100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Taxa de Presença</td>
            <td>${data.summary.attendance_rate}%</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/**
 * Salva relatório no banco de dados
 */
function saveReportToDB(data: ReportData): void {
  try {
    const query = `
      INSERT INTO settings (key, value) 
      VALUES (?, ?)
    `;
    db.prepare(query).run(
      `report_${Date.now()}`,
      JSON.stringify(data)
    );
  } catch (error) {
    console.warn("⚠️ Aviso: Não foi possível salvar relatório no BD:", error);
  }
}
