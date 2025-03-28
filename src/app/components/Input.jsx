export const Input = ({ type, name, classname, register, watch }) => {
    console.log(!!(watch(name) || value));
    
  return (
    <div className="flex flex-col relative w-full">
      <input
        type={type}
        id={name}
        className={`w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)] ${classname}`}
        {...register(name)}
      />
      <label
        htmlFor={name}
        className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
          watch(name) && `-translate-x-2 scale-90 -translate-y-8.5`
        }`}
      >
        {name}
      </label>
    </div>
  );
};
// export const Textarea = ({name, classname, register, watch, rows, cols, labelHeight }) => {
//   return (
//     <div className="textarea flex flex-col relative w-full">
//       <textarea
//         id={name}
//         className={`border w-full px-5 py-2.5 rounded-lg peer text-[var(--withdarkinnertext)] resize-none ${classname}`}
//         {...register(name)}
//         spellCheck="false"
//         rows={rows || 5}
//         cols={cols}
//         required
//         style={{ "--label-height": `${labelHeight}px` }}
//       />
//       <label
//         htmlFor={name}
//         className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:scale-90 peer-focus:-translate-x-2 peer-focus:-translate-y-[var(--label-height)] bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
//           watch(name) && `-translate-x-2 scale-90`
//         }`}
//         style={{
//           transform: watch(name) ? `translate(-8px, -${labelHeight}px)` : "translateY(-50%)",
//         }}
//       >
//         {name}
//       </label>
//     </div>
//   );
// };
