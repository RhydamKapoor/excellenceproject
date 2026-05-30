import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function getAppSession() {
  return getServerSession(authOptions);
}
