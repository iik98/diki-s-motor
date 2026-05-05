import React, { useState } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./routes/Dashboard";
import Customers from "./routes/Customers";
import CustomerProfile from "./routes/CustomerProfile";
import Spareparts from "./routes/Spareparts";
import ServiceForm from "./routes/ServiceForm";
import Mechanics from "./routes/Mechanics";
import Login from "./routes/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./components/AuthProvider";
import ServiceList from "./routes/ServiceList";
import PrintService from "./routes/ServicePrint";
import { FaUsersGear } from "react-icons/fa6";

import {
  FiHome,
  FiUsers,
  FiSettings,
  FiClipboard,
  FiTool,
  FiLogOut,
} from "react-icons/fi";

export default function App() {
  const { user, logout, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 font-mono">
      {/* ================= HEADER ================= */}
      <header className="border-b border-cyan-700/40 bg-gray-950/80 backdrop-blur-lg shadow-md shadow-cyan-800/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 drop-shadow-[0_0_8px_#00ffff] transition"
          >
            <img
              src="/logo.png"
              alt="logo"
              style={{ width: 100, marginBottom: 10 }}
            />
          </Link>
          <div className="md:hidden ">
            <button
              onClick={logout}
              className="flex flex-col items-center text-gray-400 hover:text-red-400 transition"
            >
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <Link
                to="/login"
                className="px-5 py-1.5 border border-cyan-600 rounded-md text-cyan-300 hover:bg-cyan-900/40 hover:shadow-[0_0_10px_#00ffff] transition"
              >
                Login
              </Link>
            ) : (
              <>
                <nav className="flex gap-5 text-sm">
                  <StyledNavLink to="/">Dashboard</StyledNavLink>
                  <StyledNavLink to="/customers" matchSubRoutes>
                    Customers
                  </StyledNavLink>
                  <StyledNavLink to="/spareparts">Spareparts</StyledNavLink>
                  <StyledNavLink to="/service-list">List Service</StyledNavLink>
                  <StyledNavLink to="/service/new">Service</StyledNavLink>

                  {role === "admin" && (
                    <StyledNavLink to="/mechanics">Mechanics</StyledNavLink>
                  )}
                </nav>

                <div className="text-xs text-gray-400">
                  {user.email}{" "}
                  <span className="text-cyan-400 font-semibold">({role})</span>
                </div>

                <button
                  onClick={logout}
                  className="px-4 py-1 border border-cyan-600 text-cyan-300 rounded-md hover:bg-cyan-900/40 hover:shadow-[0_0_10px_#00ffff] transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["admin", "mechanic"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["admin", "mechanic"]}>
                <Customers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "mechanic"]}>
                <CustomerProfileWrapper />
              </ProtectedRoute>
            }
          />

          <Route
            path="/spareparts"
            element={
              <ProtectedRoute allowedRoles={["admin", "mechanic"]}>
                <Spareparts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/service/new"
            element={
              <ProtectedRoute allowedRoles={["admin", "mechanic"]}>
                <ServiceForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/print-service/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PrintService />
              </ProtectedRoute>
            }
          />

          <Route
            path="/service-list"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ServiceList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mechanics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Mechanics />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-800/40 bg-gray-950/95 backdrop-blur-lg">
          <div className="flex justify-around items-center py-2 text-xs">
            <BottomNavItem to="/" icon={<FiHome size={20} />}>
              Home
            </BottomNavItem>

            <BottomNavItem
              to="/customers"
              icon={<FiUsers size={20} />}
              matchSubRoutes
            >
              Cust
            </BottomNavItem>

            <BottomNavItem to="/spareparts" icon={<FiSettings size={20} />}>
              Parts
            </BottomNavItem>

            <BottomNavItem to="/service-list" icon={<FiClipboard size={20} />}>
              List
            </BottomNavItem>

            <BottomNavItem to="/service/new" icon={<FiTool size={20} />}>
              Service
            </BottomNavItem>

            {role === "admin" && (
              <BottomNavItem to="/mechanics" icon={<FaUsersGear size={20} />}>
                Mech
              </BottomNavItem>
            )}

            {/* <button
              onClick={logout}
              className="flex flex-col items-center text-gray-400 hover:text-red-400 transition"
            >
              <FiLogOut size={20} />
              <span>Logout</span>
            </button> */}
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="mt-10 text-center text-gray-500 text-xs border-t border-cyan-700/40 py-4">
        <p>
          ⚡ MotorWork © {new Date().getFullYear()} —{" "}
          <span className="text-cyan-400">Workshop Management System</span>
        </p>
      </footer>
    </div>
  );
}

/* ================= Styled Desktop Nav ================= */
function StyledNavLink({
  to,
  children,
  matchSubRoutes = false,
}: {
  to: string;
  children: React.ReactNode;
  matchSubRoutes?: boolean;
}) {
  const location = useLocation();

  const isActive = matchSubRoutes
    ? location.pathname.startsWith(to)
    : location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative transition-all after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-cyan-500/50 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300
        ${
          isActive
            ? "text-cyan-400 drop-shadow-[0_0_6px_#00ffff] after:scale-x-100"
            : "hover:text-cyan-400"
        }`}
    >
      {children}
    </Link>
  );
}

/* ================= Bottom Nav Item ================= */
function BottomNavItem({
  to,
  children,
  icon,
  matchSubRoutes = false,
}: {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  matchSubRoutes?: boolean;
}) {
  const location = useLocation();

  const isActive = matchSubRoutes
    ? location.pathname.startsWith(to)
    : location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex flex-col items-center transition ${
        isActive
          ? "text-cyan-400 drop-shadow-[0_0_6px_#00ffff]"
          : "text-gray-400 hover:text-cyan-400"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/* ================= Customer Profile Wrapper ================= */
function CustomerProfileWrapper() {
  const { pathname } = window.location as Location;
  const parts = pathname.split("/");
  const id = parts[parts.length - 1];
  return <CustomerProfile customerId={id} />;
}
