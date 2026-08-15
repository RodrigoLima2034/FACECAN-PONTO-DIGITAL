import { NextRequest, NextResponse } from "next/server";
import {
  setAdminCookie,
  requestIp,
} from "@/lib/security";
import db from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { message: "Informe usuário e senha." },
        { status: 400 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD não configurado.");

      return NextResponse.json(
        { message: "Login administrativo não configurado no servidor." },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      try {
        db.prepare(
          `INSERT INTO audit_logs
          (actor, action, resource, ip, details)
          VALUES (?, ?, ?, ?, ?)`
        ).run(
          email,
          "LOGIN_FAILED",
          "admin",
          requestIp(request),
          "Credenciais inválidas"
        );
      } catch (error) {
        console.error("Erro ao registrar tentativa de login:", error);
      }

      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    const token = setAdminCookie(email);

    response.cookies.set("facecan_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    try {
      db.prepare(
        `INSERT INTO audit_logs
        (actor, action, resource, ip, details)
        VALUES (?, ?, ?, ?, ?)`
      ).run(
        email,
        "LOGIN",
        "admin",
        requestIp(request),
        "Login administrativo"
      );
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error);
    }

    return response;
  } catch (error) {
    console.error("Erro no login administrativo:", error);

    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}