import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdminRequest, requestIp } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  try {
    const employees = db.prepare(`SELECT e.*, s.name AS shift_name FROM employees e JOIN shifts s ON s.id=e.shift_id ORDER BY e.name`).all();
    return NextResponse.json({ employees });
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar os funcionários." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 120);
    const registration = String(body.registration || "").trim().slice(0, 50);
    const department = String(body.department || "").trim().slice(0, 120);
    const shiftId = Number(body.shiftId);
    if (!name || !registration || !Number.isInteger(shiftId) || shiftId <= 0) return NextResponse.json({ message: "Nome, matrícula e turno são obrigatórios." }, { status: 400 });
    const shift = db.prepare("SELECT id FROM shifts WHERE id=? AND active=1").get(shiftId);
    if (!shift) return NextResponse.json({ message: "Turno inválido." }, { status: 400 });
    const result = db.prepare("INSERT INTO employees(registration,name,department,shift_id) VALUES(?,?,?,?)").run(registration,name,department,shiftId);
    db.prepare("INSERT INTO audit_logs(actor,action,resource,resource_id,ip,details) VALUES(?,?,?,?,?,?)").run("ADMIN","CREATE","employee",String(result.lastInsertRowid),requestIp(req),"Cadastro de funcionário");
    return NextResponse.json({ message:"Funcionário cadastrado.", id:result.lastInsertRowid }, { status:201 });
  } catch (error: any) {
    return NextResponse.json({ message:error?.code === "SQLITE_CONSTRAINT_UNIQUE" ? "Matrícula já cadastrada." : "Não foi possível cadastrar." }, { status:400 });
  }
}
