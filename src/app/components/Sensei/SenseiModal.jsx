'use client'

import { BrainCircuit, Maximize, Minimize, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import TaskSenseiComp from "./TaskSenseiComp";

const isRoute = ['/dashboard/manager']
export default function SenseiModal() {
    const pathname = usePathname()
    const [show, setShow] = useState(false)
    const [openBot, setOpenBot] = useState(false)
    const [size, setSize] = useState(0)
    const [resize, setResize] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        if(isRoute.includes(pathname)) {
            setShow(false)
        }else{
            setShow(true)
        }
    }, []);
    
    useEffect(() => {
        const handleResize = () => {
          const width = window.innerWidth;
          console.log("Resized:", width);
          setSize(width);
        };
      
        window.addEventListener("resize", handleResize);
        handleResize(); // run on mount
      
        return () => window.removeEventListener("resize", handleResize);
      }, []);

  return (
    <>
    {show && (
        <AnimatePresence>
            {openBot ? (
                <motion.div
                    className="absolute bottom-5 right-5 rounded-lg bg-white border border-[var(--dark-btn)] flex items-center justify-center overflow-hidden group gap-x-3 max-[450px]:!w-[90vw]"
                    initial={{ width: 48, height: 48 }}
                    animate={{ width: resize && size < 990 ? `fit-content` : resize && size > 990 ? 595 : 400, height: resize && size ? 595 : 400 }}
                    exit={{ width: 48, height: 48 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <span className="absolute z-50 top-3 right-10 bg-white rounded-full p-1 cursor-pointer" onClick={() => setResize(!resize)}>
                        {!resize ? <Maximize size={16} /> : <Minimize size={16} />}
                    </span>
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
