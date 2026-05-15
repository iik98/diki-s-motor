import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  createdAt?: number;
}

export default function Pengeluaran() {
  const [items, setItems] = useState<Expense[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  const emptyForm = {
    name: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  };

  const [form, setForm] = useState(emptyForm);

  /* ================= FETCH ================= */

  useEffect(() => {
    const q = query(
      collection(db, "pengeluaran"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          ...(d.data() as Expense),
          id: d.id,
        }))
      );
    });

    return () => unsub();
  }, []);

  /* ================= CRUD ================= */

  async function create() {
    if (!form.name.trim()) return;
    if (!form.amount) return;

    await addDoc(collection(db, "pengeluaran"), {
      ...form,
      createdAt: Date.now(),
    });

    setForm(emptyForm);
    setOpenDialog(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete pengeluaran?")) return;

    await deleteDoc(doc(db, "pengeluaran", id));
  }

  const totalPengeluaran = items.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  /* ================= UI ================= */

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-10">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0070B2]">
              💸 Pengeluaran
            </h1>

            <p className="text-slate-500 mt-1">
              Kelola data pengeluaran workshop
            </p>
          </div>

          <button
            onClick={() => setOpenDialog(true)}
            className="
              bg-[#0070B2]
              hover:bg-[#005f96]
              text-white
              px-5 py-2.5
              rounded-xl
              transition
              shadow-sm
            "
          >
            + Tambah Pengeluaran
          </button>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="mb-6 bg-[#EAF6FD] border border-[#CFE8F6] rounded-2xl p-5">
          <div className="text-slate-500 text-sm mb-1">Total Pengeluaran</div>

          <div className="text-3xl font-bold text-[#0070B2]">
            Rp {totalPengeluaran.toLocaleString("id-ID")}
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto bg-white border border-[#CFE8F6] rounded-2xl shadow-sm">
          <table className="min-w-full">
            <thead className="bg-[#EAF6FD] border-b border-[#CFE8F6]">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold text-[#0070B2]">
                  Nama Pengeluaran
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-[#0070B2]">
                  Tanggal
                </th>

                <th className="px-5 py-4 text-right text-sm font-semibold text-[#0070B2]">
                  Jumlah
                </th>

                <th className="px-5 py-4 text-right text-sm font-semibold text-[#0070B2]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    Belum ada data pengeluaran
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="
                      border-b border-[#EEF7FC]
                      hover:bg-[#F8FBFD]
                      transition
                    "
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-700">
                        {item.name}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-red-500">
                        Rp {item.amount.toLocaleString("id-ID")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => remove(item.id)}
                          className="
                            px-3 py-2 rounded-xl
                            text-red-500
                            hover:bg-red-50
                            transition
                          "
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= MODAL ================= */}
        {openDialog && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="overflow-y-auto max-h-[90vh]">
              <div
                className="
                  bg-white
                  border border-[#CFE8F6]
                  rounded-3xl
                  shadow-xl
                  p-6
                  w-full
                  max-w-lg
                  animate-fadeIn
                "
              >
                {/* TITLE */}
                <h3 className="text-2xl font-bold text-[#0070B2] mb-6">
                  ➕ Tambah Pengeluaran
                </h3>

                {/* FORM */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Nama */}
                  <div>
                    <label className="block text-slate-600 mb-1">
                      Nama Pengeluaran
                    </label>

                    <input
                      type="text"
                      placeholder="Contoh: Bayar listrik"
                      value={form.name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          name: e.target.value,
                        })
                      }
                      className="
                        w-full px-4 py-2.5
                        bg-white
                        border border-[#CFE8F6]
                        rounded-xl
                        text-slate-700
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#0070B2]/20
                        focus:border-[#0070B2]
                      "
                    />
                  </div>

                  {/* Jumlah */}
                  <div>
                    <label className="block text-slate-600 mb-1">Jumlah</label>

                    <input
                      type="number"
                      placeholder="Jumlah pengeluaran"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          amount: Number(e.target.value),
                        })
                      }
                      className="
                        w-full px-4 py-2.5
                        bg-white
                        border border-[#CFE8F6]
                        rounded-xl
                        text-slate-700
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#0070B2]/20
                        focus:border-[#0070B2]
                      "
                    />
                  </div>

                  {/* Tanggal */}
                  <div>
                    <label className="block text-slate-600 mb-1">Tanggal</label>

                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          date: e.target.value,
                        })
                      }
                      className="
                        w-full px-4 py-2.5
                        bg-white
                        border border-[#CFE8F6]
                        rounded-xl
                        text-slate-700
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#0070B2]/20
                        focus:border-[#0070B2]
                      "
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                  <button
                    onClick={() => setOpenDialog(false)}
                    className="
                      px-4 py-2.5 rounded-xl
                      border border-[#CFE8F6]
                      hover:bg-[#F8FBFD]
                      text-slate-600
                      transition
                      w-full sm:w-auto
                    "
                  >
                    Cancel
                  </button>

                  <button
                    onClick={create}
                    className="
                      px-5 py-2.5 rounded-xl
                      bg-[#0070B2]
                      hover:bg-[#005f96]
                      text-white
                      transition
                      shadow-sm
                      w-full sm:w-auto
                    "
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ANIMATION ================= */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
