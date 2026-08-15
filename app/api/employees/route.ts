import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdmin, requestIp } from "@/lib/security";

export const runtime = "nodejs";

export async function GET() {
  try {
    const employees = db
      .prepare(`
        SELECT
          e.*,
          s.name AS shift_name
        FROM employees e
        JOIN shifts s ON s.id = e.shift_id
        ORDER BY e.name
      `)
      .all();

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Erro ao listar funcionários:", error);

    return NextResponse.json(
      {
        message: "Não foi possível carregar os funcionários.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin()) {
    return NextResponse.json(
      {
        message: "Não autorizado",
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    if (!body.name || !body.registration || !body.shiftId) {
      return NextResponse.json(
        {
          message: "Nome, matrícula e turno são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const result = db
      .prepare(`
        INSERT INTO employees
          (registration, name, department, shift_id)
        VALUES
          (?, ?, ?, ?)
      `)
      .run(
        String(body.registration).trim().slice(0, 50),
        String(body.name).trim().slice(0, 120),
        String(body.department || "").trim().slice(0, 120),
        Number(body.shiftId)
      );

    db.prepare(`
      INSERT INTO audit_logs
        (actor, action, resource, resource_id, ip, details)
      VALUES
        (?, ?, ?, ?, ?, ?)
    `).run(
      "ADMIN",
      "CREATE",
      "employee",
      String(result.lastInsertRowid),
      requestIp(req),
      "Cadastro de funcionário"
    );

    return NextResponse.json(
      {
        message: "Funcionário cadastrado.",
        id: result.lastInsertRowid,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao cadastrar funcionário:", error);

    return NextResponse.json(
      {
        message:
          error?.code === "SQLITE_CONSTRAINT_UNIQUE"
            ? "Matrícula já cadastrada."
            : "Não foi possível cadastrar.",
      },
      { status: 400 }
    );
  }
}