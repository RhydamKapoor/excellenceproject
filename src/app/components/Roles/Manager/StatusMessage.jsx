"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import axios from "axios";
import { useState } from "react";

export default function StatusMessage({ task, fetchTasks }) {
  //   const { register, handleSubmit, watch, setValue } = useForm({
  //     defaultValues: {
  //       feedBack: "",
  //     },
  //   });
  const [feedback, setFeedback] = useState('');
  const [selectedStatus, setSelectedStatus] = useState("--");
  const [feedbackBox, setFeedbackBox] = useState({
    id: "",
    value: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const changeStatus = async (id, status, feedBack) => {
    const toastId = toast.loading(`Updating Status...`);
    try {
      const res = await axios.post("/api/manager/change-status", {
        id,
        status,
        feedBack,
      });
      if (res.status === 200) {
        toast.success("Status updated successfully", { id: toastId });
        setFeedbackBox({ id: "", value: "" });
        fetchTasks();
      } else {
        toast.error("Something went wrong!", { id: toastId });
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message, { id: toastId });
    }
  };
  const handleDialogClose = (isOpen) => {
    if (!isOpen) {
      if (!submitted) {
        setSelectedStatus("--");
        setFeedback("")
      }
      setFeedbackBox({ id: "", value: "" });
      setSubmitted(false); // Reset submit tracker
      setFeedback("")
    }
  };
  return (
    <>
      <Select
        id="statusUpdate"
        value={selectedStatus}
        onValueChange={(value) => {
          if (value !== "--") {
            setSelectedStatus(value); // Update selectedStatus immediately
            setFeedbackBox({ id: task.id, value }); // Open the feedback box
            setFeedback(""); // Reset feedback
          }
        }}
      >
        <SelectTrigger
          className={`shadow-lg text-md capitalize border-none text-center justify-center w-full cursor-pointer ${
            selectedStatus === "Closed"
              ? "text-red-600"
              : selectedStatus === "Delayed"
              ? "text-orange-600"
              : ""
          }`}
        >
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className="capitalize *:cursor-pointer">
            <SelectItem
              value="Delayed"
              onClick={() => setSelectedStatus("Delayed")}
            >
              delayed
            </SelectItem>
            <SelectItem
              value="Closed"
              onClick={() => setSelectedStatus("Closed")}
            >
              Closed
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Delayed or Closed Feedback form */}
      {feedbackBox.id && (
        <Dialog open={!!feedbackBox.id} onOpenChange={handleDialogClose}>
          <DialogContent
            className={`flex flex-col items-center w-1/3 max-lg:w-1/2 max-sm:w-full`}
            aria-modal="true"
          >
            <DialogHeader>
              <DialogTitle className={`text-[var(--specialtext)]`}>
                Message
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>

            <div className="relative flex flex-col w-full">
              <textarea
                id="delayedFeedBack"
                className="border w-full px-5 rounded-lg peer text-[var(--withdarkinnertext)] resize-none outline-none py-3"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                spellCheck="false"
                rows={5}
                required
              />
              <label
                htmlFor="delayedFeedBack"
                className={`text-slate-900 absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-21 peer-focus:scale-90 peer-focus:-translate-x-2 bg-white px-1 transition-all duration-200 ${`-translate-x-2 scale-90 -translate-y-21`}`}
              >
                Any message?
              </label>
            </div>

            <DialogFooter className={`flex justify-center w-full`}>
              <div className="flex justify-center w-full">
                <button
                  className="bg-[var(--dark-btn)] p-2 rounded-full text-white w-1/2 max-[1280]:w-full text-sm cursor-pointer"
                  onClick={() => {
                    changeStatus(feedbackBox.id, feedbackBox.value, feedback);
                    setSelectedStatus(feedbackBox.value);
                    setFeedbackBox({ id: "", value: "" });
                  }}
                >
                  Update status & message
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
