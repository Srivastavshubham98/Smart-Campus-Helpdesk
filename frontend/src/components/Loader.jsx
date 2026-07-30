import { FiLoader } from "react-icons/fi";

function Loader({
  message = "Loading...",
  fullScreen = false,
}) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen items-center justify-center bg-slate-100"
          : "flex min-h-[300px] items-center justify-center"
      }
    >
      <div className="flex flex-col items-center gap-3">
        <FiLoader className="animate-spin text-4xl text-blue-600" />

        <p className="text-sm font-medium text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

export default Loader;