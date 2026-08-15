import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { registerAutomatic } from "@/lib/attendance";

export const runtime = "nodejs";

export async function GET() {
  const records = db.prepare(`SELECT r.*, e.name, e.registration FROM attendance_records r JOIN employees e ON e.id=r.employee_id ORDER BY r.occurred_at DESC LIMIT 500`).all();
  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const employeeId = Number(body.employeeId);
    const confidence = typeof body.confidence === "number" ? body.confidence : undefined;
    if (!Number.isInteger(employeeId) || employeeId <= 0) return NextResponse.json({ message: "Funcionário inválido." }, { status: 400 });
    if (confidence !== undefined && (confidence < 0 || confidence > 1)) return NextResponse.json({ message: "Confiança facial inválida." }, { status: 400 });

    const employee = db.prepare("SELECT id,name FROM employees WHERE id=? AND status='ATIVO'").get(employeeId) as {id:number;name:string}|undefined;
    if (!employee) return NextResponse.json({ message: "Funcionário não encontrado ou inativo." }, { status: 404 });

    const recent = db.prepare(`SELECT id FROM attendance_records WHERE employee_id=? AND occurred_at >= datetime('now','-30 seconds') ORDER BY occurred_at DESC LIMIT 1`).get(employeeId);
    if (recent) return NextResponse.json({ ok: false, message: "Registro já realizado recentemente." }, { status: 409 });

    const result = registerAutomatic(employeeId, String(body.source || "TERMINAL").slice(0, 40), String(body.deviceId || "").slice(0, 80), confidence);
    if (!result.ok) return NextResponse.json(result, { status: 409 });
    return NextResponse.json({ employee, result });
  } catch {
    return NextResponse.json({ message: "Erro ao registrar ponto." }, { status: 500 });
  }
}
