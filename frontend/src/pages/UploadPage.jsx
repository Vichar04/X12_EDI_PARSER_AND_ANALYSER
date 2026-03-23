import { useNavigate, useLocation } from "react-router-dom";
import DragNdrop from "@/components/DragNdrop";
import { AlertTriangle } from "lucide-react";

const UploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const invalidMsg = location.state?.invalidMsg ?? null;

  const handleUploadSuccess = (data) => {
    if (data?.valid === false) {
      navigate("/", {
        replace: true,
        state: {
          invalidMsg:
            "The uploaded file is not a valid X12 837 EDI file. Please upload a valid 837 EDI file.",
        },
      });
      return;
    }
    navigate("/view", { state: { data } });
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] w-full px-4 gap-4 pb-10">

      {/* Prototype Notice */}
      <div className="flex gap-3 items-start bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 border-l-4 border-l-orange-600 rounded-lg p-4 max-w-md w-full mt-5 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300 mb-1">
            System Constraints (Prototype)
          </p>
          <ul className="text-xs text-yellow-700 dark:text-yellow-200 space-y-1 list-disc ml-4">
            <li>Single file upload only</li>
            <li>No ZIP support — upload plain <code>.edi</code></li>
            <li>Supports X12 837 format</li>
          </ul>
        </div>
      </div>

      {/* Error Message */}
      {invalidMsg && (
        <div className="flex gap-3 items-start bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 border-l-4 border-l-red-600 rounded-lg p-4 max-w-md w-full">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-800 dark:text-red-300">
              Invalid File
            </p>
            <p className="text-xs text-red-700 dark:text-red-200">
              {invalidMsg}
            </p>
          </div>
        </div>
      )}

      {/* Upload */}
      <DragNdrop className="w-full max-w-md" onUploadSuccess={handleUploadSuccess} />
    </div>
  );
};

export default UploadPage;