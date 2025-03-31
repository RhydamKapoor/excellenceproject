import { prisma } from "@/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
// import { getSocket } from "@/utils/socketServer";
// import { getSocket } from "@/utils/socket";
// import { Server } from "socket.io";

export const POST = async (req) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { currentUser, selectedEmployee, changedRole } = await req.json();

    const userOne = await prisma.user.update({
      where: { id: currentUser },
      data: { role: changedRole },
    });

    const userTwo = await prisma.user.update({
      where: { id: selectedEmployee },
      data: { role: changedRole === "USER" ? "MANAGER" : "USER" },
    });

    if (!userOne || !userTwo) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let tasksUpdated;
    let tasksUpdatedtwo;
    if (changedRole === "MANAGER") {
      // If currentUser was a USER, reassign their tasks to the new Manager
      tasksUpdated = await prisma.task.updateMany({
        where: { userId: currentUser },
        data: { userId: selectedEmployee, managerId: currentUser  },
      });
      tasksUpdatedtwo = await prisma.task.updateMany({
        where: { managerId: selectedEmployee },
        data: { managerId: currentUser  },
      });
    } else {
      // If currentUser was a MANAGER, update all users under them
      tasksUpdated = await prisma.task.updateMany({
        where: { userId: selectedEmployee },
        data: { userId: currentUser},
      });
      tasksUpdated = await prisma.task.updateMany({
        where: { managerId: currentUser },
        data: { managerId: selectedEmployee  },
      });
    }

    // const io = getSocket();
    // io.emit("roleUpdated", { userId: currentUser, newRole: changedRole });
    // io.emit("roleUpdated", { userId: selectedEmployee, newRole: userTwo.role });

    return NextResponse.json(
      { message: "Task updated successfully", tasksUpdated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error swapping roles:", error);
    return NextResponse.json(
      { message: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
};
