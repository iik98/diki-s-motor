import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

interface Sparepart {
  id: string;
  name: string;
  sku?: string;
  stock?: number;
  price: number;
  buy_price: number;
  lowStockThreshold?: number;
  sold?: number;
  category: string;
  type?: string;
}

export default function Pembelian() {
  const [items, setItems] = useState<Sparepart[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  const emptyForm = {
    name: "",
    sku: "",
    stock: 1,
    price: 0,
    buy_price: 0,
    lowStockThreshold: 5,
  };

  const [form, setForm] = useState(emptyForm);

  /* ================= FETCH ================= */

  useEffect(() => {
    const q = query(
      collection(db, "spareparts"),
      where("category", "==", "sparepart")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          ...(d.data() as Sparepart),
          id: d.id,
        }))
      );
    });

    return () => unsub();
  }, []);

  /* ================= CRUD ================= */

  async function create() {
    if (!form.name.trim()) return;

    await addDoc(collection(db, "spareparts"), {
      ...form,
      category: "sparepart",
      type: "sparepart",
      sold: 0,
      createdAt: Date.now(),
    });

    setForm(emptyForm);
    setOpenDialog(false);
  }

  async function incStock(id: string, value: number) {
    const item = items.find((x) => x.id === id);
    if (!item) return;

    await updateDoc(doc(db, "spareparts", id), {
      stock: (item.stock || 0) + value,
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete sparepart?")) return;
    await deleteDoc(doc(db, "spareparts", id));
  }

  /* ================= UI ================= */

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-10">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0070B2]">
              📦 Pembelian Sparepart
            </h1>

            <p className="text-slate-500 mt-1">
              Kelola pembelian dan stok sparepart workshop
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
            + Tambah Pembelian
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto bg-white border border-[#CFE8F6] rounded-2xl shadow-sm">
          <table className="min-w-full">
            <thead className="bg-[#EAF6FD] border-b border-[#CFE8F6]">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold text-[#0070B2]">
                  Nama
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-[#0070B2]">
                  SKU
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-[#0070B2]">
                  Harga Beli
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-[#0070B2]">
                  Harga Jual
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Belum ada data sparepart
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
                      {item.sku || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700 font-medium">
                      Rp {item.buy_price?.toLocaleString("id-ID") || "0"}
                    </td>

                    <td className="px-5 py-4 text-slate-700 font-medium">
                      Rp {item.price?.toLocaleString("id-ID")}
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
                  ➕ Tambah Pembelian Sparepart
                </h3>

                {/* FORM */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    {
                      label: "Nama Sparepart",
                      key: "name",
                      type: "text",
                      placeholder: "Nama sparepart",
                    },
                    {
                      label: "SKU",
                      key: "sku",
                      type: "text",
                      placeholder: "SKU",
                    },
                    {
                      label: "Jumlah Stock",
                      key: "stock",
                      type: "number",
                      placeholder: "Stock",
                    },
                    {
                      label: "Batas Low Stock",
                      key: "lowStockThreshold",
                      type: "number",
                      placeholder: "Low stock threshold",
                    },
                    {
                      label: "Harga Beli",
                      key: "buy_price",
                      type: "number",
                      placeholder: "Harga beli",
                    },
                    {
                      label: "Harga Jual",
                      key: "price",
                      type: "number",
                      placeholder: "Harga jual",
                    },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-slate-600 mb-1">
                        {f.label}
                      </label>

                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form] ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [f.key]:
                              f.type === "number"
                                ? Number(e.target.value)
                                : e.target.value,
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
                  ))}
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
