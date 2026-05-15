import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { ServiceOrder } from "@/types";
import { IoIosCheckbox } from "react-icons/io";
import SparepartName from "@/components/GetSparepart";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

interface EnrichedService extends ServiceOrder {
  customerName: string;
  mechanicName: string;
  unitPlate: string;
  items: any[];
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<EnrichedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeluhan, setSelectedKeluhan] = useState<string | null>(null);

  const nav = useNavigate();

  // ================= DATE RANGE =================

  const today = new Date();

  const formatDate = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().split("T")[0];
  };

  // default hari ini
  const [startDate, setStartDate] = useState(formatDate(today));

  const [endDate, setEndDate] = useState(formatDate(today));

  // ================= FETCH SERVICES =================

  useEffect(() => {
    setLoading(true);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "services"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end)),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const serviceList: ServiceOrder[] = snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              customerId: data.customerId,
              mechanicId: data.mechanicId,
              unitId: data.unitId,
              status: data.status || "open",
              laborCost: data.laborCost || 0,
              totalCost: data.totalCost || 0,
              createdAt: data.createdAt
                ? data.createdAt.toDate().toLocaleString("id-ID")
                : "-",
              bookingDate: data.bookingDate
                ? (data.bookingDate?.toDate ? data.bookingDate.toDate().toLocaleDateString("id-ID") : data.bookingDate)
                : "",
              keluhan: data.keluhan || "",
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
          console.error("Error fetching realtime services:", error);
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error("onSnapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [startDate, endDate]);

  // ================= COMPLETE SERVICE =================
  console.log(services);
  const markServiceCompleted = async (serviceId: string, items: any[]) => {
    try {
      await runTransaction(db, async (transaction) => {
        const serviceRef = doc(db, "services", serviceId);

        const sparepartSnaps: any[] = [];

        for (const item of items) {
          if (!item?.partId || !item?.qty) continue;

          const sparepartRef = doc(db, "spareparts", item.partId);

          const snap = await transaction.get(sparepartRef);

          if (!snap.exists()) {
            throw new Error(`Sparepart tidak ditemukan: ${item.partId}`);
          }

          sparepartSnaps.push({
            ref: sparepartRef,
            data: snap.data(),
            qty: item.qty,
          });
        }

        transaction.update(serviceRef, {
          status: "completed",
          completedAt: serverTimestamp(),
        });

        for (const sp of sparepartSnaps) {
          const currentStock = sp.data.stock ?? 0;

          if (currentStock < sp.qty) {
            throw new Error("Stock tidak cukup");
          }

          transaction.update(sp.ref, {
            stock: currentStock - sp.qty,
            sold: increment(sp.qty),
          });
        }
      });

      console.log("Transaction success");
      return true;
    } catch (error) {
      console.error("Transaction failed:", error);
      return false;
    }
  };
  // ================= STATUS TAB =================

  const [tab, setTab] = useState<"open" | "booked" | "completed">("open");

  // ================= FILTERED SERVICES =================

  const filteredServices = services.filter((s) => s.status === tab);

  const exportToExcel = () => {
    const dataToExport = filteredServices.map((s) => ({
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

      Date: s.bookingDate || s.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Completed Services");
    XLSX.writeFile(workbook, `Completed_Services_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-10">
        {/* ================= HEADER ================= */}

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-3xl font-bold text-[#0070B2]">
              🧾 Service Order List
            </h2>

            <div
              className="
              px-4 py-2 rounded-2xl
              bg-[#EAF6FD]
              text-[#0070B2]
              text-sm font-medium
              border border-[#CFE8F6]
              whitespace-nowrap
            "
            >
              Total Orders: {services.length}
            </div>
          </div>

          {/* ================= FILTER DATE ================= */}

          <div
            className="
            bg-white
            border border-[#CFE8F6]
            rounded-2xl
            p-4
            flex flex-col md:flex-row
            gap-4
            items-start md:items-end
          "
          >
            {/* START DATE */}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">
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

            {/* END DATE */}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">
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

            {/* QUICK BUTTONS */}

            <div className="flex gap-2 md:ml-auto">
              {tab === "completed" && (
                <button
                  onClick={exportToExcel}
                  className="
                  px-4 py-2 rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  text-sm
                  transition
                "
                >
                  Download Excel
                </button>
              )}
              <button
                onClick={() => {
                  const today = formatDate(new Date());

                  setStartDate(today);
                  setEndDate(today);
                }}
                className="
                px-4 py-2 rounded-xl
                bg-[#0070B2]
                hover:bg-[#005f96]
                text-white
                text-sm
                transition
              "
              >
                Today
              </button>

              <button
                onClick={() => {
                  const now = new Date();

                  const firstDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                  );

                  setStartDate(formatDate(firstDay));
                  setEndDate(formatDate(now));
                }}
                className="
                px-4 py-2 rounded-xl
                border border-[#CFE8F6]
                bg-[#F8FBFD]
                hover:bg-[#EAF6FD]
                text-[#0070B2]
                text-sm
                transition
              "
              >
                This Month
              </button>


            </div>
          </div>

          {/* ================= STATUS TABS ================= */}

          <div className="flex flex-wrap gap-3 mt-2">
            {[
              {
                key: "open",
                label: "Open",
                color: "bg-yellow-100 text-yellow-700",
              },

              {
                key: "booked",
                label: "Booked",
                color: "bg-blue-100 text-blue-700",
              },

              {
                key: "completed",
                label: "Completed",
                color: "bg-green-100 text-green-700",
              },
            ].map((t) => {
              const count = services.filter((s) => s.status === t.key).length;

              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`
                  px-5 py-2.5 rounded-2xl
                  border transition
                  flex items-center gap-2
                  font-medium
                  ${tab === t.key
                      ? "bg-[#0070B2] text-white border-[#0070B2]"
                      : "bg-white border-[#CFE8F6] text-slate-600 hover:bg-[#F8FBFD]"
                    }
                `}
                >
                  <span>{t.label}</span>

                  <span
                    className={`
                    px-2 py-0.5 rounded-full text-xs
                    ${tab === t.key ? "bg-white/20 text-white" : t.color}
                  `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= TABLE ================= */}

        <div
          className="
          bg-white
          border border-[#CFE8F6]
          rounded-3xl
          shadow-sm
          overflow-hidden
        "
        >
          {loading ? (
            <div className="text-center py-16 text-[#0070B2]">Loading...</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              No service orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                {/* ================= HEAD ================= */}

                <thead className="bg-[#7faad3] border-b border-[#CFE8F6]">
                  <tr className="text-slate-700 uppercase text-xs tracking-wide">
                    <th className="px-5 py-4 text-left font-semibold border-r border-[#E5F2FA]">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-left font-semibold border-r border-[#E5F2FA]">
                      Unit
                    </th>

                    <th className="px-5 py-4 text-left font-semibold border-r border-[#E5F2FA]">
                      Mechanic
                    </th>

                    <th className="px-5 py-4 text-left font-semibold border-r border-[#E5F2FA]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left font-semibold border-r border-[#E5F2FA]">
                      Parts & Jasa
                    </th>

                    <th className="px-5 py-4 text-right font-semibold border-r border-[#E5F2FA]">
                      Total
                    </th>

                    <th className="px-5 py-4 text-right font-semibold border-r border-[#E5F2FA]">
                      {tab === "booked" ? "Booking Date" : "Date"}
                    </th>

                    <th className="px-5 py-4 text-center font-semibold">PDF</th>
                  </tr>
                </thead>

                {/* ================= BODY ================= */}

                <tbody>
                  {filteredServices.map((s) => (
                    <tr
                      key={s.id}
                      className="
                      border-b border-[#abcdec]
                      hover:bg-[#F8FBFD]
                      transition
                    "
                    >
                      {/* CUSTOMER */}
                      <td className="px-5 py-4 border-r border-[#abcdec]">
                        <div className="font-semibold text-slate-700">
                          {s.customerName}
                        </div>
                      </td>

                      {/* UNIT */}
                      <td className="px-5 py-4 border-r border-[#abcdec]">
                        <span
                          className="
                          px-3 py-1 rounded-full
                          bg-[#EAF6FD]
                          text-[#0070B2]
                          text-xs font-medium whitespace-nowrap
                        "
                        >
                          {s.unitPlate}
                        </span>
                      </td>

                      {/* MECHANIC */}
                      <td className="px-5 py-4 text-slate-600 border-r border-[#abcdec]">
                        {s.mechanicName}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4 border-r border-[#abcdec]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`
                            px-3 py-1 rounded-full
                            text-xs font-semibold
                            ${s.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : s.status === "booked"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }
                          `}
                          >
                            {s.status}
                          </span>

                          {s.status === "open" && (
                            <button
                              onClick={() =>
                                markServiceCompleted(s.id, s.items)
                              }
                              className="
                              p-1.5 rounded-lg
                              hover:bg-green-50
                              transition
                            "
                            >
                              <IoIosCheckbox size={20} color="#16A34A" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* ITEMS */}
                      <td className="px-5 py-4 border-r border-[#abcdec]">
                        <div className="space-y-2">
                          {s.items?.map((it, index) => (
                            <div
                              key={index}
                              className="
                              text-sm
                              text-slate-600
                              bg-[#F8FBFD]
                              border border-[#abcdec]
                              rounded-xl
                              px-3 py-2
                              whitespace-nowrap
                            "
                            >
                              <span className="font-medium text-slate-700">
                                <SparepartName partId={it.partId} />
                              </span>

                              <span className="mx-2 text-slate-400">×</span>

                              {it?.qty}

                              <span className="mx-2 text-slate-400">=</span>

                              <span className="font-semibold text-[#0070B2]">
                                Rp{" "}
                                {(it?.qty * it?.price)?.toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* TOTAL */}
                      <td className="px-5 py-4 text-right border-r border-[#abcdec] whitespace-nowrap">
                        <div className="font-bold text-[#0070B2]">
                          Rp {s.totalCost?.toLocaleString("id-ID")}
                        </div>
                      </td>

                      {/* DATE */}
                      <td className="px-5 py-4 text-right text-slate-500 whitespace-nowrap border-r border-[#abcdec]">
                        {s.bookingDate || s.createdAt}
                      </td>

                      {/* PDF */}
                      <td className="px-5 py-4 text-center">
                        {s.status === "booked" ? (
                          <button
                            onClick={() => setSelectedKeluhan(s.keluhan || "Tidak ada keluhan")}
                            className="
                            px-4 py-2 rounded-xl
                            bg-orange-500
                            hover:bg-orange-600
                            text-white
                            text-sm
                            transition
                          "
                          >
                            Keluhan
                          </button>
                        ) : (
                          <button
                            onClick={() => nav(`/print-service/${s.id}`)}
                            className="
                            px-4 py-2 rounded-xl
                            bg-[#0070B2]
                            hover:bg-[#005f96]
                            text-white
                            text-sm
                            transition
                          "
                          >
                            Open
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedKeluhan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#CFE8F6] shadow-xl">
            <h3 className="text-xl font-bold text-[#0070B2] mb-4">Keluhan Customer</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{selectedKeluhan}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedKeluhan(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceList;
