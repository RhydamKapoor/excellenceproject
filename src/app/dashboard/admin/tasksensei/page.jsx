import TaskSenseiComp from "@/app/components/Sensei/TaskSenseiComp";
import React from "react";
import Testing from "@/app/components/Sensei/Testing";
import TaskSenseiRagTest from "@/app/components/Sensei/TaskSenseiRagTest";

export default function TaskSensei() {
  return (
    <main className="flex flex-col h-full items-center p-5 w-full">
      <TaskSenseiComp isAnimate={true}/>
      {/* <TaskSenseiRagTest /> */}
    </main>
  );
}
