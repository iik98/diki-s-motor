import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (e: any) {
      alert("Login failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F9FC] flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-6xl">
        {/* MAIN CARD */}
        <div
          className="
            bg-white
            border border-[#DCEEF9]
            rounded-[40px]
            shadow-xl
            overflow-hidden
            grid
            grid-cols-1
            lg:grid-cols-2
          "
        >
          {/* ================= LEFT SIDE ================= */}
          <div
            className="
              relative
              bg-gradient-to-br
              from-[#0070B2]
              via-[#0A84D0]
              to-[#005B91]
              p-10
              lg:p-16
              flex
              items-center
              overflow-hidden
            "
          >
            {/* BACKGROUND LOGO */}
            <img
              src="/logo.png"
              alt="logo"
              className="
                absolute
                -left-10
                -bottom-10
                w-[720px]
                opacity-[0.08]
                rotate-[-18deg]
                pointer-events-none
                select-none
              "
            />

            {/* CONTENT */}
            <div className="relative z-10 max-w-md">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  bg-white/10
                  border border-white/20
                  text-white
                  px-4 py-2
                  rounded-full
                  backdrop-blur-sm
                  mb-6
                  text-sm
                "
              >
                🛠️ Garasi Aicky
              </div>

              <h1
                className="
                  text-5xl
                  leading-tight
                  font-black
                  text-white
                "
              >
                Workshop
                <br />
                Management
                <br />
                System
              </h1>

              <p className="mt-6 text-white/80 text-lg leading-relaxed">
                Kelola service kendaraan, sparepart, stok, pemasukkan, dan
                pengeluaran dalam satu dashboard modern.
              </p>

              <div className="mt-10 flex items-center gap-4">
                <div
                  className="
                    w-14 h-14
                    rounded-2xl
                    bg-white/10
                    border border-white/20
                    backdrop-blur-sm
                    flex items-center justify-center
                    text-2xl
                  "
                >
                  ⚙️
                </div>

                <div>
                  <div className="text-white font-semibold">
                    Smart Workshop Solution
                  </div>

                  <div className="text-white/60 text-sm">
                    Fast • Clean • Real-time
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="p-8 lg:p-14 flex items-center">
            <div className="w-full">
              {/* MOBILE LOGO */}
              <div className="lg:hidden flex justify-center mb-6">
                <img src="/logo.png" alt="logo" className="w-40" />
              </div>

              <div className="mb-8">
                <h2 className="text-4xl font-bold text-[#0070B2]">
                  Welcome Back
                </h2>

                <p className="text-slate-500 mt-2">
                  Login untuk melanjutkan ke dashboard workshop
                </p>
              </div>

              <form onSubmit={submit} className="space-y-5">
                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="
                      w-full
                      px-4 py-3.5
                      rounded-2xl
                      border border-[#D7EAF7]
                      bg-[#FAFDFF]
                      text-slate-700
                      placeholder:text-slate-400
                      focus:outline-none
                      focus:ring-4
                      focus:ring-[#0070B2]/10
                      focus:border-[#0070B2]
                      transition
                    "
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Password
                  </label>

                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="
                      w-full
                      px-4 py-3.5
                      rounded-2xl
                      border border-[#D7EAF7]
                      bg-[#FAFDFF]
                      text-slate-700
                      placeholder:text-slate-400
                      focus:outline-none
                      focus:ring-4
                      focus:ring-[#0070B2]/10
                      focus:border-[#0070B2]
                      transition
                    "
                  />
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full
                    py-3.5
                    rounded-2xl
                    font-semibold
                    text-white
                    transition-all
                    shadow-lg
                    ${
                      loading
                        ? "bg-[#7FB9DD] cursor-not-allowed"
                        : "bg-[#0070B2] hover:bg-[#005f96] hover:scale-[1.01] shadow-[#0070B2]/20"
                    }
                  `}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Garasi Aicky Management System
          </p>
        </div>
      </div>
    </div>
  );
}
