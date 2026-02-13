import TaskSenseiComp from "@/app/components/Sensei/TaskSenseiComp";
import React from "react";
import TaskSenseiRagTest from "@/app/components/Sensei/TaskSenseiRagTest";

export default function TaskSensei() {
  return (
    <main className="flex flex-col h-full items-center p-5 w-full">
      <TaskSenseiComp isAnimate={true}/>
      {/* <TaskSenseiRagTest isAnimate={true} /> */}
    </main>
  );
}
