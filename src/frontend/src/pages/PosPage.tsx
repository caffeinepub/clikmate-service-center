import { useNavigate } from "@/utils/router";
import { useEffect } from "react";

// POS page stub — redirects to pos-login if no active staff session.
// The full POS interface would be here.
export default function PosPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem("staffSession");
    if (!session) {
      navigate("/pos-login");
    }
  }, [navigate]);

  const session = localStorage.getItem("staffSession");
  if (!session) return null;

  const staffData = JSON.parse(session) as {
    mobile: string;
    loggedInAt: number;
  };

  function handleLogout() {
    localStorage.removeItem("staffSession");
    navigate("/pos-login");
  }

  return (
    <div
      data-ocid="pos.page"
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#0a0f1e" }}
    >
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          <span className="text-2xl font-black text-gray-900">C</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">POS Terminal</h1>
        <p className="text-white/50 text-sm mb-6">Staff: {staffData.mobile}</p>
        <button
          type="button"
          data-ocid="pos.logout.button"
          onClick={handleLogout}
          className="text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
