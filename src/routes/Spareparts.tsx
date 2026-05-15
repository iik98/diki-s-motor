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
import { FiEdit2, FiTrash2 } from "react-icons/fi";

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

  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const emptyForm = {
    name: "",
    sku: "",
    stock: 1,
    price: 0,
    lowStockThreshold: 5,
    buy_price: 0,
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

  /* ================= CREATE / UPDATE ================= */

  async function saveItem() {
    if (!form.name.trim()) return;

    try {
      if (editingItem) {
        // UPDATE
        await updateDoc(doc(db, "spareparts", editingItem.id), {
          ...form,
        });
      } else {
        // CREATE
        await addDoc(collection(db, "spareparts"), {
          ...form,
          category: tab,
          createdAt: Date.now(),
          sold: 0,
        });
      }

      resetForm();
    } catch (err) {
      console.error(err);
    }
  }

  function handleEdit(item: Item) {
    setEditingItem(item);

    setForm({
      name: item.name || "",
      sku: item.sku || "",
      stock: item.stock || 0,
      price: item.price || 0,
      lowStockThreshold: item.lowStockThreshold || 5,
      buy_price: item.buy_price || 0,
    });

    setOpenDialog(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingItem(null);
    setOpenDialog(false);
  }

  /* ================= STOCK ================= */

  async function incStock(id: string, value: number) {
    const item = items.find((x) => x.id === id);
    if (!item) return;

    await updateDoc(doc(db, "spareparts", id), {
      stock: (item.stock || 0) + value,
    });
  }

  /* ================= DELETE ================= */

  async function remove(id: string) {
    if (!confirm("Delete item?")) return;

    await deleteDoc(doc(db, "spareparts", id));
  }

  /* ================= UI ================= */

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-10">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[#0070B2]">
            ⚙️ Workshop Manager
          </h1>

          {
            tab === 'jasa' &&
            <button
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
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
              + Add {tab}
            </button>
          }
        </div>

        {/* ================= TABS ================= */}
        <div className="flex gap-3 mb-6">
          {["sparepart", "jasa"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as Category)}
              className={`
                px-5 py-2.5 rounded-xl capitalize transition font-medium
                ${tab === t
                  ? "bg-[#0070B2] text-white shadow-sm"
                  : "bg-[#F8FBFD] text-slate-600 border border-[#CFE8F6] hover:bg-[#EAF6FD]"
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ================= LIST ================= */}
        <div className="bg-white border border-[#CFE8F6] rounded-2xl shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="text-slate-400 text-center py-12">
              No data available
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li
                  key={item.id}
                  className="
                    flex flex-col md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                    px-5 py-4
                    border-b border-[#EEF7FC]
                    last:border-b-0
                    hover:bg-[#F8FBFD]
                    transition
                  "
                >
                  {/* LEFT */}
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700 text-lg">
                      {item.name}
                    </div>

                    <div className="text-sm text-slate-500 mt-1">
                      Harga Jual:
                      <span className="font-medium text-slate-700 ml-1">
                        Rp {item.price?.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="text-sm text-slate-500">
                      Harga Beli:
                      <span className="font-medium text-slate-700 ml-1">
                        Rp{" "}
                        {item.buy_price?.toLocaleString("id-ID") ||
                          item.price?.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {tab === "sparepart" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className="
                            px-3 py-1 rounded-full
                            bg-[#EAF6FD]
                            text-[#0070B2]
                            text-xs font-medium
                          "
                        >
                          Stock: {item.stock}
                        </span>

                        <span
                          className="
                            px-3 py-1 rounded-full
                            bg-green-100
                            text-green-700
                            text-xs font-medium
                          "
                        >
                          Sold: {item.sold || 0}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT */}
                  <div className="flex gap-2 items-center flex-wrap">
                    {tab === "sparepart" && (
                      <>
                        <button
                          onClick={() => incStock(item.id, 1)}
                          className="
                            px-3 py-2 rounded-xl
                            border border-[#CFE8F6]
                            hover:bg-[#EAF6FD]
                            text-[#0070B2]
                            transition
                          "
                        >
                          +1
                        </button>

                        <button
                          onClick={() => incStock(item.id, -1)}
                          className="
                            px-3 py-2 rounded-xl
                            border border-yellow-200
                            hover:bg-yellow-50
                            text-yellow-600
                            transition
                          "
                        >
                          -1
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => handleEdit(item)}
                          className="
                            px-3 py-2 rounded-xl
                            border border-blue-200
                            hover:bg-blue-50
                            text-blue-600
                            transition
                            flex items-center gap-2
                          "
                        >
                          <FiEdit2 size={16} />
                          Edit
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => remove(item.id)}
                      className="
                        px-3 py-2 rounded-xl
                        text-red-500
                        hover:bg-red-50
                        transition
                        flex items-center gap-2
                      "
                    >
                      <FiTrash2 size={16} />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ================= DIALOG ================= */}
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
                  {editingItem
                    ? "✏️ Edit Sparepart"
                    : `➕ Add New ${tab === "sparepart" ? "Sparepart" : "Jasa"
                    }`}
                </h3>

                {/* FORM */}
                <div className="grid grid-cols-1 gap-4">
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
                    onClick={resetForm}
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
                    onClick={saveItem}
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
                    {editingItem ? "Update" : "Save"}
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
