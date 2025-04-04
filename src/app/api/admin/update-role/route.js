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
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if(newRole === "MANAGER"){

      if(user.managerId){
        const manager = await prisma.user.findUnique({
          where: { id: user.managerId},
        });
        
      if (!manager) {
        return Response.json({ error: "Manager not found" }, { status: 404 });
      }
      await prisma.user.update({
        where: { id: manager.id },
        data: { assignedUsers: { set: manager.assignedUsers.filter(id => id !== userId) || [] } },
      });
      }

      await prisma.user.update({
          where: { id: userId },
          data: { role: newRole, managerId: ""},
      });


      
      await prisma.task.updateMany({
        where: { userId },
        data: {userId: ''}
      });
    }else{

      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return Response.json({ error: "Employee not found" }, { status: 404 });
      }

      let mergedAssignedUsers = [...new Set([...(user.assignedUsers || []), ...(employee.assignedUsers || [])])];
      mergedAssignedUsers = mergedAssignedUsers.filter(id => id !== employeeId);

      // Demoting user's role to user and take all his assigned user's away
      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole, assignedUsers: { set: [] } },
      });
      
      // Promoting user's role to manager if he is a user and assigned him old one's user
      await prisma.user.update({
          where: { id: employeeId },
          data: { role: "MANAGER", assignedUsers: { set: mergedAssignedUsers } },
      });

      // Assign new manager to his assigned users
      await prisma.user.updateMany({
        where: { managerId: userId },
        data: { managerId: employeeId },
      });

      // Transfer tasks created by this manager to new manager
      await prisma.task.updateMany({
        where: { managerId: userId },
        data: { managerId: employeeId },
      });
      
      if(employee.role === "USER"){
        await prisma.user.update({
          where: { id: employeeId },
          data: { managerId: ""}
        });
      }
      await prisma.task.updateMany({
        where: { userId: employeeId },
        data: { userId: "" },
      });

    }
    
    

    return Response.json({ message: "Role updated successfully" }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
