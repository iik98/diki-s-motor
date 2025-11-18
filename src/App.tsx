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

export default function App() {
  const { user, logout, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 font-mono">
      {/* === HEADER === */}
      <header className="border-b border-cyan-700/40 bg-gray-950/80 backdrop-blur-lg shadow-md shadow-cyan-800/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          {/* Left: Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 drop-shadow-[0_0_8px_#00ffff] transition"
          >
            ⚙️ Motor<span className="text-white">Work</span>
          </Link>

          {/* === MOBILE MENU BUTTON === */}
          {user && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-cyan-400 hover:text-cyan-200 transition"
            >
              {menuOpen ? "✖" : "☰"}
            </button>
          )}

          {/* Right: Auth Buttons (desktop) */}
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

        {/* === MOBILE MENU (slide-down) === */}
        {menuOpen && user && (
          <div className="md:hidden border-t border-cyan-800/40 bg-gray-950/95 px-4 py-3 space-y-3 animate-slideDown">
            <nav className="flex flex-col gap-3 text-sm">
              <StyledNavLink to="/" onClick={() => setMenuOpen(false)}>
                Dashboard
              </StyledNavLink>
              <StyledNavLink
                to="/customers"
                matchSubRoutes
                onClick={() => setMenuOpen(false)}
              >
                Customers
              </StyledNavLink>
              <StyledNavLink
                to="/spareparts"
                onClick={() => setMenuOpen(false)}
              >
                Spareparts
              </StyledNavLink>
              <StyledNavLink
                to="/service-list"
                onClick={() => setMenuOpen(false)}
              >
                List Service
              </StyledNavLink>
              <StyledNavLink
                to="/service/new"
                onClick={() => setMenuOpen(false)}
              >
                Service
              </StyledNavLink>
              {role === "admin" && (
                <StyledNavLink
                  to="/mechanics"
                  onClick={() => setMenuOpen(false)}
                >
                  Mechanics
                </StyledNavLink>
              )}
            </nav>
            <div className="border-t border-cyan-800/40 pt-3 text-xs text-gray-400 flex flex-col gap-2">
              <div>
                {user.email}{" "}
                <span className="text-cyan-400 font-semibold">({role})</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="px-3 py-1 border border-cyan-600 text-cyan-300 rounded-md hover:bg-cyan-900/40 hover:shadow-[0_0_10px_#00ffff] transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* === MAIN CONTENT === */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
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

      {/* === FOOTER === */}
      <footer className="mt-10 text-center text-gray-500 text-xs border-t border-cyan-700/40 py-4">
        <p>
          ⚡ MotorWork © {new Date().getFullYear()} —{" "}
          <span className="text-cyan-400">Workshop Management System</span>
        </p>
      </footer>
    </div>
  );
}

/* === Styled NavLink === */
function StyledNavLink({
  to,
  children,
  matchSubRoutes = false,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  matchSubRoutes?: boolean;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = matchSubRoutes
    ? location.pathname.startsWith(to)
    : location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
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

/* === Customer Profile Wrapper === */
function CustomerProfileWrapper() {
  const { pathname } = window.location as Location;
  const parts = pathname.split("/");
  const id = parts[parts.length - 1];
  return <CustomerProfile customerId={id} />;
}
