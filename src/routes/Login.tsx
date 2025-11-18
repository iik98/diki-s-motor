import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 font-mono">
      <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-md border border-cyan-700 rounded-2xl p-8 shadow-xl shadow-cyan-900/30 animate-fadeIn">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2 text-center">
          🛠️ Workshop System
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Sign in to manage services and stock
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold shadow-lg transition ${
              loading
                ? "bg-cyan-800 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-700/40"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-500 text-sm">
          © {new Date().getFullYear()} Moto Workshop
        </div>
      </div>
    </div>
  );
}
