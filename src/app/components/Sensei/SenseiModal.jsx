'use client'

import { BrainCircuit, Maximize, Minimize, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { TASKSENSEI_ENABLED } from "@/lib/featureFlags";

const TaskSenseiComp = dynamic(() => import("./TaskSenseiComp"), { ssr: false });

const hiddenRoutes = ["/dashboard/manager"];

export default function SenseiModal() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [openBot, setOpenBot] = useState(false);
  const [resize, setResize] = useState(false);
  const [size, setSize] = useState(0);

  useEffect(() => {
    setShow(!hiddenRoutes.includes(pathname));
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => setSize(window.innerWidth);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!TASKSENSEI_ENABLED || !show) return null;

  const panelWidth = resize ? (size < 990 ? "min(90vw, 400px)" : "595px") : "400px";
  const panelHeight = resize && size ? "595px" : "400px";

  return (
    <AnimatePresence>
      {openBot ? (
        <motion.div
          className="fixed bottom-5 right-5 z-50 flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl max-[450px]:!w-[90vw]"
          initial={{ width: 48, height: 48, opacity: 0, scale: 0.8 }}
          animate={{ width: panelWidth, height: panelHeight, opacity: 1, scale: 1 }}
          exit={{ width: 48, height: 48, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BrainCircuit className="size-4 text-primary" />
              TaskSensei
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="cursor-pointer rounded-xl p-1.5 transition-colors hover:bg-accent"
                onClick={() => setResize(!resize)}
              >
                {!resize ? <Maximize size={16} /> : <Minimize size={16} />}
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl p-1.5 transition-colors hover:bg-accent"
                onClick={() => setOpenBot(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TaskSenseiComp isAnimate={false} />
          </div>
        </motion.div>
      ) : (
        <motion.button
          type="button"
          className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpenBot(true)}
          aria-label="Open TaskSensei"
        >
          <BrainCircuit className="size-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
