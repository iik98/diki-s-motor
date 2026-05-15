import React from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

import {
  FiHome,
  FiUsers,
  FiSettings,
  FiClipboard,
  FiTool,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

import { FaUsersGear } from "react-icons/fa6";
import { MdAddShoppingCart } from "react-icons/md";
import { GiPayMoney } from "react-icons/gi";
import { GiReceiveMoney } from "react-icons/gi";

import Dashboard from "./routes/Dashboard";
import Customers from "./routes/Customers";
import CustomerProfile from "./routes/CustomerProfile";
import Spareparts from "./routes/Spareparts";
import ServiceForm from "./routes/ServiceForm";
import Mechanics from "./routes/Mechanics";
import Login from "./routes/Login";
import ServiceList from "./routes/ServiceList";
import PrintService from "./routes/ServicePrint";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./components/AuthProvider";
import Pembelian from "./routes/Pembelian";
import Pengeluaran from "./routes/Pengeluaran";
import PemasukkanPage from "./routes/Pemasukkan";
import BookingService from "./routes/BoookingForm";

export default function App() {
  const { user, logout, role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#F8FBFD] text-slate-800 flex">
      {/* ================= SIDEBAR ================= */}
      {user && (
        <>
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`
    fixed md:static top-0 left-0 z-50
    h-screen w-64
    bg-white border-r border-[#CFE8F6] shadow-sm
    transform transition-transform duration-300
    flex flex-col
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
          >
            {/* Logo */}
            <div className="pl-2 border-b border-cyan-800/30 flex items-center justify-between shrink-0">
              <img src="/logo.png" alt="logo" className="w-58" />

              <button
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Scrollable Menu */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-2">
                <SidebarItem to="/" icon={<FiHome size={18} />}>
                  Dashboard
                </SidebarItem>

                <SidebarItem
                  to="/customers"
                  icon={<FiUsers size={18} />}
                  matchSubRoutes
                >
                  Customers
                </SidebarItem>

                <SidebarItem to="/spareparts" icon={<FiSettings size={18} />}>
                  Spareparts
                </SidebarItem>

                <SidebarItem
                  to="/service-list"
                  icon={<FiClipboard size={18} />}
                >
                  Service List
                </SidebarItem>

                <SidebarItem to="/service/new" icon={<FiTool size={18} />}>
                  Work Order
                </SidebarItem>
                <SidebarItem
                  to="/pembelian"
                  icon={<MdAddShoppingCart size={18} />}
                >
                  Pembelian
                </SidebarItem>
                <SidebarItem
                  to="/pemasukkan"
                  icon={<GiReceiveMoney size={18} />}
                >
                  Pemasukkan
                </SidebarItem>
                <SidebarItem to="/pengeluaran" icon={<GiPayMoney size={18} />}>
                  Pengeluaran
                </SidebarItem>

                {role === "admin" && (
                  <SidebarItem to="/mechanics" icon={<FaUsersGear size={18} />}>
                    Mechanics
                  </SidebarItem>
                )}
              </nav>
            </div>

            {/* Fixed Bottom */}
            <div className="p-4 border-t border-[#CFE8F6] shrink-0 bg-white">
              <div className="text-xs text-gray-400 mb-3 break-all">
                {user.email}
                <div className="text-cyan-400">{role}</div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile Header */}
        {user && (
          <header className="md:hidden sticky top-0 z-30 bg-white border-b border-[#CFE8F6] shadow-sm p-4 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)}>
              <FiMenu size={24} />
            </button>

            <img src="/logo.png" alt="logo" className="w-20" />
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/booking" element={<BookingService />} />
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
              path="/service-list"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ServiceList />
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
              path="/mechanics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Mechanics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pembelian"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Pembelian />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengeluaran"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Pengeluaran />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pemasukkan"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PemasukkanPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ================= SIDEBAR ITEM ================= */

function SidebarItem({
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
      className={`
  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
  ${
    isActive
      ? "bg-[#EAF6FD] text-[#0070B2] font-semibold"
      : "text-slate-600 hover:bg-[#F0F9FF] hover:text-[#0070B2]"
  }
`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/* ================= CUSTOMER WRAPPER ================= */

function CustomerProfileWrapper() {
  const { pathname } = window.location as Location;
  const parts = pathname.split("/");
  const id = parts[parts.length - 1];

  return <CustomerProfile customerId={id} />;
}
