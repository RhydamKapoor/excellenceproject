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
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import axios from "axios";
import { useState } from "react";

export default function StatusMessage({ task, fetchTasks }) {
  const [feedback, setFeedback] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("--");
  const [feedbackBox, setFeedbackBox] = useState({ id: "", value: "" });
  const [submitted, setSubmitted] = useState(false);

  const changeStatus = async (id, status, feedBack) => {
    const toastId = toast.loading("Updating status...");
    try {
      const res = await axios.post("/api/manager/change-status", {
        id,
        status,
        feedBack,
      });
      if (res.status === 200) {
        toast.success("Status updated successfully", { id: toastId });
        setFeedbackBox({ id: "", value: "" });
        setSubmitted(true);
        fetchTasks();
      } else {
        toast.error("Something went wrong!", { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed", { id: toastId });
    }
  };

  const handleDialogClose = (isOpen) => {
    if (!isOpen) {
      if (!submitted) {
        setSelectedStatus("--");
        setFeedback("");
      }
      setFeedbackBox({ id: "", value: "" });
      setSubmitted(false);
      setFeedback("");
    }
  };

  return (
    <>
      <Select
        value={selectedStatus}
        onValueChange={(value) => {
          if (value !== "--") {
            setSelectedStatus(value);
            setFeedbackBox({ id: task.id, value });
            setFeedback("");
          }
        }}
      >
        <SelectTrigger className="mx-auto h-8 w-[110px] rounded-lg border border-input bg-background px-2 text-xs shadow-none">
          <SelectValue placeholder="Update" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectGroup>
            <SelectItem value="Delayed">Delayed</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {feedbackBox.id && (
        <Dialog open={!!feedbackBox.id} onOpenChange={handleDialogClose}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Status update message</DialogTitle>
              <DialogDescription>
                Add an optional note for the assignee about this status change.
              </DialogDescription>
            </DialogHeader>

            <textarea
              id="delayedFeedBack"
              className="input-field min-h-[100px] resize-none py-2.5 text-sm"
              placeholder="Optional message..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              spellCheck="false"
              rows={4}
            />

            <DialogFooter>
              <Button
                type="button"
                className="h-10 w-full rounded-xl font-semibold sm:w-auto"
                onClick={() => {
                  changeStatus(feedbackBox.id, feedbackBox.value, feedback);
                  setSelectedStatus(feedbackBox.value);
                  setFeedbackBox({ id: "", value: "" });
                }}
              >
                Update status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
