import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/AuthProvider";
import { Link } from "react-router-dom";

interface Service {
  id: string;
  status: string;
  totalCost?: number;
  createdAt?: any;
}

export default function Dashboard() {
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [totalSpareparts, setTotalSpareparts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const { role } = useAuth();

  // === Fetch Spareparts ===
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "spareparts"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setLowStock(data.filter((p) => p.stock <= (p.lowStockThreshold ?? 5)));

      const parts = snapshot.docs.map((d) => d.data() as any);
      setTotalSpareparts(parts.length);

      const lowStock = parts.filter(
        (p) => p.stock <= p.lowStockThreshold
      ).length;
      setLowStockCount(lowStock);

      const totalValue = parts.reduce(
        (sum, p) => sum + (p.price || 0) * (p.stock || 0),
        0
      );
      setTotalStockValue(totalValue);
    });
    return () => unsub();
  }, []);

  // === Fetch Service Data ===
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "services"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...(doc.data() as Service),
        id: doc.id,
      }));
      setServices(data);
    });
    return () => unsub();
  }, []);

  // === Compute Analytics ===
  const totalServices = services.length;
  const completed = services.filter((s) => s.status === "completed").length;
  const pending = services.filter((s) => s.status !== "completed").length;
  const totalIncome = services
    .filter((s) => s.totalCost)
    .reduce((sum, s) => sum + (s.totalCost ?? 0), 0);

  return (
    <div className="min-h-screen text-gray-100 font-mono">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6 drop-shadow-[0_0_8px_#00ffff]">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-6">
        {/* === Service Analytics === */}
        <div className="bg-gray-900/60 border border-cyan-700/50 rounded-xl p-5 shadow-md shadow-cyan-700/30 backdrop-blur-md">
          <h3 className="text-xl font-semibold text-cyan-300 mb-3">
            📊 Service Analytics
          </h3>

          <div className="space-y-3 text-cyan-100">
            <div className="flex justify-between">
              <span>Total Services</span>
              <span className="font-bold text-cyan-300">{totalServices}</span>
            </div>
            <div className="flex justify-between">
              <span>Completed</span>
              <span className="font-bold text-green-400">{completed}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending</span>
              <span className="font-bold text-yellow-400">{pending}</span>
            </div>
            <div className="flex justify-between border-t border-cyan-800 pt-2">
              <span>Total Income</span>
              <span className="font-bold text-cyan-400">
                Rp {totalIncome.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
        {/* === Sparepart Analytics === */}
        <div className="bg-gray-900/60 border border-cyan-700/50 rounded-xl p-5 shadow-md shadow-cyan-700/30 backdrop-blur-md">
          <h3 className="text-xl font-semibold text-cyan-300 mb-3">
            🧩 Sparepart Analytics
          </h3>

          <div className="space-y-3 text-cyan-100">
            <div className="flex justify-between">
              <span>Total Spareparts</span>
              <span className="font-bold text-cyan-300">{totalSpareparts}</span>
            </div>
            <div className="flex justify-between">
              <span>Low Stock Items</span>
              <span className="font-bold text-red-400">{lowStockCount}</span>
            </div>
            <div className="flex justify-between border-t border-cyan-800 pt-2">
              <span>Total Stock Value</span>
              <span className="font-bold text-green-400">
                Rp {totalStockValue.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* === Low Stock Section === */}
        <div className="bg-gray-900/60 border border-cyan-700/50 rounded-xl p-5 shadow-md shadow-cyan-700/30 backdrop-blur-md">
          <h3 className="text-xl font-semibold text-cyan-300 mb-3">
            ⚠️ Low Stock Parts
          </h3>

          {lowStock.length === 0 ? (
            <div className="text-sm text-gray-400 italic">
              All stock levels are healthy.
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="py-3 flex justify-between items-center hover:bg-cyan-950/30 px-2 rounded transition"
                >
                  <span className="text-cyan-200">{p.name}</span>
                  <span className="text-red-400 font-semibold">
                    stock: {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* === Quick Actions === */}
        <div className="bg-gray-900/60 border border-cyan-700/50 rounded-xl p-5 shadow-md shadow-cyan-700/30 backdrop-blur-md">
          <h3 className="text-xl font-semibold text-cyan-300 mb-3">
            🚀 Quick Actions
          </h3>

          <div className="flex flex-col gap-3">
            <Link
              to="/service/new"
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-white font-medium text-center transition shadow-cyan-600/40 shadow-md hover:scale-[1.02]"
            >
              Create Service Order
            </Link>

            <Link
              to="/customers"
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-white font-medium text-center transition shadow-cyan-600/40 shadow-md hover:scale-[1.02]"
            >
              Manage Customers
            </Link>

            {role === "admin" && (
              <Link
                to="/spareparts"
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-white font-medium text-center transition shadow-cyan-600/40 shadow-md hover:scale-[1.02]"
              >
                Sparepart Inventory
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
