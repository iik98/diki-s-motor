import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";

interface ServiceOrder {
  id: string;
  customerId?: string;
  mechanicId?: string;
  unitId?: string;
  status?: string;
  laborCost?: number;
  totalCost?: number;
  createdAt?: string;
  filterDate?: string;
}

interface EnrichedService extends ServiceOrder {
  customerName: string;
  mechanicName: string;
  unitPlate: string;
  items: any[];
}

export default function PemasukkanPage() {
  const [services, setServices] = useState<EnrichedService[]>([]);
  const [pengeluaran, setPengeluaran] = useState<{ date: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMonth, setActiveMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  /* ================= REALTIME FETCH ================= */

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, "services"),
      where("status", "==", "completed")
    );

    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const serviceList: ServiceOrder[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let dateStr = "";

            if (data.bookingDate) {
              if (typeof data.bookingDate === "string") {
                dateStr = data.bookingDate;
              } else if (data.bookingDate.toDate) {
                dateStr = data.bookingDate.toDate().toISOString().split("T")[0];
              }
            } else if (data.createdAt && data.createdAt.toDate) {
              dateStr = data.createdAt.toDate().toISOString().split("T")[0];
            }

            return {
              id: docSnap.id,
              customerId: data.customerId,
              mechanicId: data.mechanicId,
              unitId: data.unitId,
              status: data.status || "completed",
              laborCost: data.laborCost || 0,
              totalCost: data.totalCost || 0,
              createdAt: data.createdAt
                ? data.createdAt.toDate().toLocaleString("id-ID")
                : "-",
              filterDate: dateStr,
            };
          });

          const enriched: EnrichedService[] = await Promise.all(
            serviceList.map(async (service) => {
              const [customerDoc, mechanicDoc, unitDoc, itemsSnap] =
                await Promise.all([
                  getDoc(doc(db, "customers", service.customerId || "id")),

                  getDoc(doc(db, "mechanics", service.mechanicId || "id")),

                  getDoc(doc(db, "units", service.unitId || "id")),

                  getDocs(collection(db, "services", service.id, "items")),
                ]);

              const customerName = customerDoc.exists()
                ? customerDoc.data()?.name || "-"
                : "-";

              const mechanicName = mechanicDoc.exists()
                ? mechanicDoc.data()?.name || "-"
                : "-";

              const unitPlate = unitDoc.exists()
                ? unitDoc.data()?.plate || "-"
                : "-";

              const items = await Promise.all(
                itemsSnap.docs.map(async (d) => {
                  const itemData = d.data();

                  let partName = "-";

                  try {
                    const partDoc = await getDoc(
                      doc(db, "spareparts", itemData.partId)
                    );

                    if (partDoc.exists()) {
                      partName = partDoc.data()?.name || "-";
                    }
                  } catch {}

                  return {
                    id: d.id,
                    ...itemData,
                    partName,
                  };
                })
              );

              return {
                ...service,
                customerName,
                mechanicName,
                unitPlate,
                items,
              };
            })
          );

          setServices(enriched);
        } catch (error) {
          console.error("Error fetching services:", error);
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    const qExp = query(collection(db, "pengeluaran"));
    const unsubExp = onSnapshot(qExp, (snap) => {
      setPengeluaran(
        snap.docs.map((d) => ({
          date: d.data().date || "",
          amount: d.data().amount || 0,
        }))
      );
    });

    return () => {
      unsub();
      unsubExp();
    };
  }, []);

  /* ================= DOWNLOAD EXCEL ================= */

  const downloadExcel = () => {
    const rows = filteredServices.map((s) => ({
      Customer: s.customerName,

      Unit: s.unitPlate,

      Mechanic: s.mechanicName,

      Status: s.status,

      "Parts & Jasa":
        s.items?.length > 0
          ? s.items
              .map(
                (it) =>
                  `${it.partName} x${it.qty} = Rp ${(
                    it.qty * it.price
                  ).toLocaleString("id-ID")}`
              )
              .join(" | ")
          : "-",

      Total: s.totalCost || 0,

      Date: s.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Pemasukkan");

    XLSX.writeFile(workbook, "laporan-pemasukkan.xlsx");
  };

  /* ================= TOTAL ================= */

  const filteredServices = services.filter((s) => s.filterDate?.startsWith(activeMonth));
  const filteredPengeluaran = pengeluaran.filter((p) => p.date.startsWith(activeMonth));

  const totalPendapatanKotor = filteredServices.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const totalPengeluaran = filteredPengeluaran.reduce((sum, p) => sum + p.amount, 0);
  const totalPendapatanBersih = totalPendapatanKotor - totalPengeluaran;

  /* ================= UI ================= */

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-10">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0070B2]">💰 Laporan Keuangan</h1>

            <p className="text-slate-500 mt-1">
              Ringkasan pendapatan kotor, pengeluaran, dan pendapatan bersih (Profit)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="month"
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="
                px-4 py-3 rounded-2xl
                border border-[#CFE8F6]
                bg-[#F8FBFD]
                text-[#0070B2]
                font-medium
                focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20
              "
            />
            <button
              onClick={downloadExcel}
              disabled={loading || filteredServices.length === 0}
              className="
                bg-[#0070B2]
                hover:bg-[#005f96]
                disabled:opacity-50
                disabled:cursor-not-allowed
                text-white
                px-6 py-3
                rounded-2xl
                transition
                shadow-sm
                font-medium
              "
            >
              ⬇ Download Excel
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#F8FBFD] border border-[#CFE8F6] rounded-2xl p-6">
            <div className="text-slate-500 text-sm mb-1">Pendapatan Kotor</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              Rp {totalPendapatanKotor.toLocaleString("id-ID")}
            </div>
          </div>

          <div className="bg-[#F8FBFD] border border-[#CFE8F6] rounded-2xl p-6">
            <div className="text-slate-500 text-sm mb-1">Pengeluaran</div>
            <div className="text-3xl font-bold text-red-500 mt-2">
              Rp {totalPengeluaran.toLocaleString("id-ID")}
            </div>
          </div>

          <div className="bg-[#EAF6FD] border border-[#CFE8F6] rounded-2xl p-6 shadow-sm">
            <div className="text-[#0070B2] font-semibold text-sm mb-1">Pendapatan Bersih (Profit)</div>
            <div className="text-3xl font-bold text-[#0070B2] mt-2">
              Rp {totalPendapatanBersih.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="border border-[#CFE8F6] rounded-2xl bg-[#F8FBFD] p-6">
          <h3 className="text-lg font-semibold text-[#0070B2] mb-4">
            Excel Export Structure
          </h3>

          <ul className="space-y-2">
            {[
              "Customer",
              "Unit",
              "Mechanic",
              "Status",
              "Parts & Jasa",
              "Total",
              "Date",
            ].map((item) => (
              <li
                key={item}
                className="
                  px-4 py-3
                  bg-white
                  border border-[#CFE8F6]
                  rounded-xl
                  text-slate-600
                "
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center text-slate-400 py-6">
            Loading realtime data...
          </div>
        )}
      </div>
    </div>
  );
}
