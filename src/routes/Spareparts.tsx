import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

type Category = "sparepart" | "jasa";

interface Item {
  id: string;
  name: string;
  sku?: string;
  stock?: number;
  price: number;
  lowStockThreshold?: number;
  category: Category;
  type: string;
  sold: number;
  buy_price: number;
}

export default function ItemsPage() {
  const [tab, setTab] = useState<Category>("sparepart");
  const [items, setItems] = useState<Item[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  const emptyForm = {
    name: "",
    sku: "",
    stock: 0,
    price: 0,
    lowStockThreshold: 5,
  };

  const [form, setForm] = useState(emptyForm);

  /* ================= FETCH ================= */

  useEffect(() => {
    const q = query(collection(db, "spareparts"), where("category", "==", tab));

    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          ...(d.data() as Item),
          id: d.id,
        }))
      );
    });

    return () => unsub();
  }, [tab]);

  /* ================= CRUD ================= */

  async function create() {
    if (!form.name.trim()) return;

    await addDoc(collection(db, "spareparts"), {
      ...form,
      category: tab,
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
    if (!confirm("Delete item?")) return;
    await deleteDoc(doc(db, "spareparts", id));
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 p-6 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">
            ⚙️ Workshop Manager
          </h1>

          <button
            onClick={() => setOpenDialog(true)}
            className="bg-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-500"
          >
            + Add {tab}
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-6">
          {["sparepart", "jasa"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as Category)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                tab === t
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          {items.length === 0 && (
            <div className="text-gray-400 text-center py-6">
              No data available
            </div>
          )}

          <ul className="divide-y divide-gray-700">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center py-4"
              >
                <div>
                  <div className="font-semibold">{item.name}</div>

                  <div className="text-sm text-gray-400">
                    Harga Jual: Rp {item.price?.toLocaleString("id-ID")} Harga
                    Beli: Rp{" "}
                    {item.buy_price?.toLocaleString("id-ID") ||
                      item.price?.toLocaleString("id-ID")}
                  </div>

                  {tab === "sparepart" && (
                    <>
                      <div className="text-xs text-gray-500">
                        Stock: {item.stock}
                      </div>
                      <div className="text-xs text-gray-500">
                        Stok Terjual: {item.sold || 0}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  {tab === "sparepart" && (
                    <>
                      <button
                        onClick={() => incStock(item.id, 1)}
                        className="px-2 py-1 border border-cyan-600 text-cyan-400 rounded hover:bg-cyan-900/50 transition"
                      >
                        +1
                      </button>

                      <button
                        onClick={() => incStock(item.id, -1)}
                        className="px-2 py-1 border border-yellow-600 text-yellow-400 rounded hover:bg-yellow-900/50 transition"
                      >
                        -1
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => remove(item.id)}
                    className="text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* DIALOG */}
        {openDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            {/* <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg max-h-[90vh] overflow-hidden"> */}
            <div className="overflow-y-auto max-h-[90vh] p-4">
              <div className="bg-gray-900/80 border border-cyan-700 rounded-2xl shadow-2xl shadow-cyan-900/40 p-6 w-full max-w-lg animate-fadeIn">
                {/* ===== TITLE ===== */}
                <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center sm:text-left">
                  ➕ Add New {tab === "sparepart" ? "Sparepart" : "Jasa"}
                </h3>

                {/* ===== FIELD CONFIG ===== */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      label: "Nama",
                      key: "name",
                      type: "text",
                      placeholder: "Name",
                    },

                    ...(tab === "sparepart"
                      ? [
                          {
                            label: "SKU",
                            key: "sku",
                            type: "text",
                            placeholder: "SKU",
                          },
                          {
                            label: "Stok",
                            key: "stock",
                            type: "number",
                            placeholder: "Stok",
                          },
                          {
                            label: "Tanda Stok Hampir Habis",
                            key: "lowStockThreshold",
                            type: "number",
                            placeholder: "Low stock threshold",
                          },
                          {
                            label: "Harga Beli",
                            key: "buy_price",
                            type: "number",
                            placeholder: "Harga Beli",
                          },
                        ]
                      : []),

                    {
                      label: "Harga Jual",
                      key: "price",
                      type: "number",
                      placeholder: "Harga Jual",
                    },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-gray-300 mb-1">
                        {f.label}
                      </label>

                      <input
                        type={f.type}
                        className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
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
                      />
                    </div>
                  ))}
                </div>

                {/* ===== ACTION ===== */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    onClick={() => setOpenDialog(false)}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 w-full sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={create}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow shadow-cyan-900/30 w-full sm:w-auto"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
