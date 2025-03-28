"use client";
import axios from "axios";
import { CheckCheck, CircleArrowLeft, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function ReportedTask({ checkTask, setCheckTask, fetchTasks }) {
  const { register, handleSubmit, watch, setValue } = useForm();
    
  const submitFeedBack = async(data, status) => {
    
    const toastId = toast.loading(`Submitting your feedback...`);
    try {
        const res = await axios.post(`/api/manager/submit-feedback`, {...data, taskId: checkTask.id, status});
        if(res.status === 200){
            toast.success(`Feedback submitted`, {id: toastId});
            fetchTasks();
            setCheckTask(null)
          }else{
            toast.error('Something went wrong!', {id: toastId});
          }
        } catch (error) {
          console.log(error);
          toast.error(error.response.data.message, {id: toastId});
        }
  }
  useEffect(() => {
    if (checkTask?.feedBack) {
      setValue("feedBack", checkTask.feedBack);
    }
  }, [checkTask, setValue]);
  return (
    <div className="flex flex-col w-full relative">
      <span
        className="absolute left-0 cursor-pointer z-50"
        onClick={() => setCheckTask(null)}
      >
        <CircleArrowLeft color="#92613a" strokeWidth={1.5} size={28} />
      </span>

      <div className="flex w-full">
        <div className="flex flex-col gap-y-6 items-center w-1/2">
          <div className="flex justify-center relative w-full">
            <h2 className="text-2xl font-semibold text-[var(--lightText)]">
              Task report
            </h2>
          </div>
          <div className="rounded-xl flex flex-col items-center p-7 w-full">
            <div className="flex flex-col gap-y-9 items-center w-full">
              <div className="flex flex-col relative w-full">
                <input
                  type="text"
                  id="title"
                  className={`w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]`}
                  value={checkTask.title}
                  readOnly
                />
                <label
                  htmlFor="title"
                  className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                    checkTask.title &&
                    `-translate-x-2 scale-90 -translate-y-8.5`
                  }`}
                >
                  title
                </label>
              </div>
              <div className="flex flex-col relative w-full">
                <textarea
                  id="message"
                  className="border w-full px-5 py-4 rounded-lg peer text-[var(--withdarkinnertext)] resize-none outline-none"
                  spellCheck="false"
                  rows={5}
                  required
                  value={checkTask.reportMessage}
                  readOnly
                />
                <label
                  htmlFor="message"
                  className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-[88px] peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                    checkTask.reportMessage &&
                    `-translate-x-2 scale-90 -translate-y-[88px]`
                  }`}
                >
                  User Report
                </label>
              </div>
              {/* <Textarea name={`message`} register={register} watch={watch} labelHeight={70}/> */}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center w-1/2">
          <div className="flex flex-col gap-y-6 items-center relative w-full">
            <h2 className="text-2xl font-semibold text-[var(--lightText)]">
              Feedback
            </h2>
            <div className="rounded-xl flex flex-col items-center p-7 w-full">
              <div className="flex flex-col gap-y-9 items-center w-full">
                <div className="flex flex-col relative w-full">
                  <textarea
                    id="feedback"
                    className="border w-full px-5 py-5 rounded-lg peer text-[var(--withdarkinnertext)] resize-none outline-none"
                    spellCheck="false"
                    {...register('feedBack')}
                    rows={8.5}
                    required
                  />
                  <label
                    htmlFor="message"
                    className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-[127px] peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                      checkTask.feedBack &&
                      `-translate-x-2 scale-90 -translate-y-[127px]`
                    }`}
                  >
                    Any feedback?
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    <div className="flex flex-col gap-y-3 items-center w-full">
        <div className="flex justify-center items-center gap-x-8 font-bold w-full">
            <button className="text-white w-1/6 bg-[var(--dark-btn)] flex justify-center items-center gap-x-1 rounded-full py-1 cursor-pointer" onClick={handleSubmit((data) => submitFeedBack(data, 'Completed'))}>
                <span>
                    <CheckCheck strokeWidth={1.8} />
                </span>
                Accept
            </button>
            <button className="text-[var(--dark-btn)] border border-[var(--dark-btn)] w-1/6 flex justify-center items-center gap-x-1 cursor-pointer rounded-full py-1" onClick={handleSubmit((data) => submitFeedBack(data, 'Pending'))}>
                <span>
                    <X strokeWidth={1.8} />
                </span>
                Reject
            </button>
        </div>
        <p className="text-sm text-slate-400">One of the options will be used to update the feedback and status.</p>
    </div>
    </div>
  );
}
