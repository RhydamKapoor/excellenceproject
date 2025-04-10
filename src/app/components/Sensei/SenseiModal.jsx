'use client'

import { BrainCircuit, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import TaskSenseiComp from "./TaskSenseiComp";

const isRoute = ['/dashboard/manager']
export default function SenseiModal() {
    const pathname = usePathname()
    const [show, setShow] = useState(false)
    const [openBot, setOpenBot] = useState(false)


    useEffect(() => {
        if(isRoute.includes(pathname)) {
            setShow(false)
        }else{
            setShow(true)
        }
    }, []);

  return (
    <>
    {show && (
        <AnimatePresence>
            {openBot ? (
                <motion.div
                    className="absolute bottom-5 right-5 rounded-lg bg-white border border-[var(--dark-btn)] flex items-center justify-center overflow-hidden group gap-x-3"
                    initial={{ width: 48, height: 48 }}
                    animate={{ width: 400, height: 400 }}
                    exit={{ width: 48, height: 48 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <span className="absolute z-50 top-3 right-3 bg-white rounded-full p-1 cursor-pointer" onClick={() => setOpenBot(false)}>
                        <X size={16} />
                    </span>
                    <TaskSenseiComp isAnimate={false}/>
                </motion.div>
            ) : (
                <motion.div
                    className={`absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[var(--dark-btn)] flex items-center justify-center overflow-hidden group gap-x-3 cursor-pointer`}
                    initial={{ width: 48, height: 48 }}
                    animate={{ width: 48, height: 48 }}
                    exit={{ transition: { duration: 0.1, ease: "easeInOut" } }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onClick={() => setOpenBot(true)}
                    layout
                >
                    <span className="text-white text-2xl font-bold">
                        <BrainCircuit />
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    )}
</>
  )
}
