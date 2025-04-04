import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { userId,newRole, employeeId } = await req.json();

    if(newRole === "MANAGER"){
      const user = await prisma.user.update({
          where: { id: userId },
          data: { role: newRole, managerId: "" },
      });
      
      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }
  
      await prisma.task.updateMany({
        where: { userId },
        data: {userId: ''}
      });
    }else{
      
      const user = await prisma.user.update({
          where: { id: userId },
          data: { role: newRole },
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }
      const employee = await prisma.user.update({
          where: { id: employeeId },
          data: { role: "MANAGER" },
      });

      if (!employee) {
        return Response.json({ error: "Employee not found" }, { status: 404 });
      }
      await prisma.task.updateMany({
        where: { managerId: userId},
        data : {managerId: employeeId}
      })
    }
    
    

    return Response.json({ message: "Role updated successfully" }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
