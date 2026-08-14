"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "../../lib/session";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  redirect("/admin/login?saiu=1");
}
