import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/AuthProvider";
import { Link } from "react-router-dom";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

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

  /* ================= DATE FILTER ================= */

  const today = new Date();

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // default = tanggal 1 bulan ini
  const [startDate, setStartDate] = useState(formatDate(firstDayOfMonth));

  const [endDate, setEndDate] = useState(formatDate(today));

  /* ================= SPAREPART ================= */

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

  /* ================= SERVICES ================= */

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

  /* ================= FILTER SERVICES ================= */

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (!service.createdAt?.seconds) return false;

      const serviceDate = new Date(service.createdAt.seconds * 1000);

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return serviceDate >= start && serviceDate <= end;
    });
  }, [services, startDate, endDate]);

  /* ================= ANALYTICS ================= */

  const totalServices = filteredServices.length;

  const completed = filteredServices.filter(
    (s) => s.status === "completed"
  ).length;

  const pending = filteredServices.filter(
    (s) => s.status !== "completed"
  ).length;

  const totalIncome = filteredServices.reduce(
    (sum, s) => sum + (s.totalCost ?? 0),
    0
  );

  /* ================= CHART DATA ================= */

  const chartData = useMemo(() => {
    const grouped: Record<
      string,
      {
        income: number;
        total: number;
        completed: number;
        pending: number;
      }
    > = {};

    filteredServices.forEach((service) => {
      if (!service.createdAt?.seconds) return;

      const date = new Date(service.createdAt.seconds * 1000);

      const key = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });

      if (!grouped[key]) {
        grouped[key] = {
          income: 0,
          total: 0,
          completed: 0,
          pending: 0,
        };
      }

      grouped[key].income += service.totalCost || 0;
      grouped[key].total += 1;

      if (service.status === "completed") {
        grouped[key].completed += 1;
      } else {
        grouped[key].pending += 1;
      }
    });

    return Object.entries(grouped).map(([date, value]) => ({
      date,
      income: value.income,
      total: value.total,
      completed: value.completed,
      pending: value.pending,
    }));
  }, [filteredServices]);
  console.log(chartData);

  return (
    <div className="p-2">
      <div className="max-w-7xl mx-auto space-y-6 bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-10">
        {/* ================= HEADER ================= */}

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#0070B2]">Dashboard</h1>

          {/* DATE FILTER */}
          <div className="flex flex-col md:flex-row gap-3">
            <div>
              <label className="block text-sm text-slate-500 mb-1">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="
                  px-4 py-2 rounded-xl
                  border border-[#CFE8F6]
                  bg-white
                  text-slate-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0070B2]/20
                "
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 mb-1">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="
                  px-4 py-2 rounded-xl
                  border border-[#CFE8F6]
                  bg-white
                  text-slate-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0070B2]/20
                "
              />
            </div>
          </div>
        </div>

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard title="Total Services" value={totalServices} color="blue" />

          <StatCard title="Completed" value={completed} color="green" />

          <StatCard title="Pending" value={pending} color="yellow" />

          <StatCard
            title="Income"
            value={`Rp ${totalIncome.toLocaleString("id-ID")}`}
            color="blue"
          />
        </div>

        {/* ================= CHARTS ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* INCOME CHART */}

          <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#0070B2] mb-5">
              Income Analytics
            </h3>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#E2E8F0" />

                  <XAxis dataKey="date" />

                  <YAxis fontSize={10} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#0070B2"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SERVICE CHART */}

          <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#0070B2] mb-5">
              Service Activity
            </h3>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#E2E8F0" />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="total" fill="#0070B2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* ================= COMPLETED ================= */}

          <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-green-600 mb-5">
              Completed Services
            </h3>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#E2E8F0" />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#16A34A"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= PENDING ================= */}

          <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-yellow-500 mb-5">
              Pending Services
            </h3>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#E2E8F0" />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="pending" fill="#EAB308" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ================= SPAREPART ================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#0070B2] mb-5">
              Sparepart Analytics
            </h3>

            <div className="space-y-4">
              <AnalyticsRow label="Total Spareparts" value={totalSpareparts} />

              <AnalyticsRow label="Low Stock" value={lowStockCount} danger />

              <AnalyticsRow
                label="Total Stock Value"
                value={`Rp ${totalStockValue.toLocaleString("id-ID")}`}
              />
            </div>
          </div>

          {/* LOW STOCK */}

          <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#0070B2] mb-5">
              Low Stock Parts
            </h3>

            {lowStock.length === 0 ? (
              <div className="text-slate-400 italic">
                All stock levels are healthy.
              </div>
            ) : (
              <ul className="space-y-3">
                {lowStock.map((p) => (
                  <li
                    key={p.id}
                    className="
                      flex items-center justify-between
                      p-4 rounded-2xl
                      border border-[#EEF7FC]
                      hover:bg-[#F8FBFD]
                      transition
                    "
                  >
                    <span className="font-medium text-slate-700">{p.name}</span>

                    <span
                      className="
                        px-3 py-1 rounded-full
                        bg-red-100
                        text-red-600
                        text-xs font-semibold
                      "
                    >
                      Stock: {p.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-[#0070B2] mb-5">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/service/new"
              className="
                px-5 py-4 rounded-2xl
                bg-[#0070B2]
                hover:bg-[#005f96]
                text-white
                text-center
                transition
              "
            >
              Create Service Order
            </Link>

            <Link
              to="/customers"
              className="
                px-5 py-4 rounded-2xl
                border border-[#CFE8F6]
                hover:bg-[#F8FBFD]
                text-[#0070B2]
                text-center
                transition
              "
            >
              Manage Customers
            </Link>

            {role === "admin" && (
              <Link
                to="/spareparts"
                className="
                  px-5 py-4 rounded-2xl
                  border border-[#CFE8F6]
                  hover:bg-[#F8FBFD]
                  text-[#0070B2]
                  text-center
                  transition
                "
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

/* ================= COMPONENTS ================= */

function StatCard({
  title,
  value,
  color = "blue",
}: {
  title: string;
  value: any;
  color?: "green" | "yellow" | "blue";
}) {
  const bgColor =
    color === "green"
      ? "bg-green-100"
      : color === "yellow"
      ? "bg-yellow-100"
      : "bg-blue-100";

  const textColor =
    color === "green"
      ? "text-green-600"
      : color === "yellow"
      ? "text-yellow-600"
      : "text-blue-600";

  return (
    <div
      className={`${bgColor} border border-[#CFE8F6] rounded-3xl shadow-sm p-5`}
    >
      <div className="text-slate-500 text-sm mb-2">{title}</div>

      <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

function AnalyticsRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: any;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>

      <span
        className={`font-semibold ${
          danger ? "text-red-500" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
