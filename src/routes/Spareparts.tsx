import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { Sparepart } from "@/types";

export default function Spareparts() {
  const [parts, setParts] = useState<Sparepart[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    stock: 0,
    price: 0,
    lowStockThreshold: 5,
  });
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "spareparts"), (snap) => {
      setParts(
        snap.docs.map((d) => ({ ...(d.data() as Sparepart), id: d.id }))
      );
    });
    return () => unsub();
  }, []);

  async function create() {
    if (!form.name.trim()) return;
    await addDoc(collection(db, "spareparts"), form);
    setForm({ name: "", sku: "", stock: 0, price: 0, lowStockThreshold: 5 });
    setOpenDialog(false);
  }

  async function inc(id: string, incBy = 1) {
    const ref = doc(db, "spareparts", id);
    const p = parts.find((x) => x.id === id);
    await updateDoc(ref, { stock: (p?.stock || 0) + incBy });
  }

  async function remove(id: string) {
    if (!confirm("Delete part?")) return;
    await deleteDoc(doc(db, "spareparts", id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 p-4 sm:p-6 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* === Header Section === */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 border-b border-cyan-700 pb-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">
            ⚙️ Spareparts
          </h2>
          <button
            onClick={() => setOpenDialog(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg shadow-md shadow-cyan-900/30 transition-all w-full sm:w-auto"
          >
            + Add Sparepart
          </button>
        </div>

        {/* === Spareparts List === */}
        <div className="backdrop-blur-md bg-gray-800/50 border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-xl shadow-cyan-900/30">
          {parts.length === 0 ? (
            <div className="text-center text-gray-400 py-6 italic">
              No spareparts available.
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {parts.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3 hover:bg-gray-800/60 rounded-lg px-3 transition-all"
                >
                  <div>
                    <div className="font-semibold text-gray-100">{p.name}</div>
                    <div className="text-sm text-gray-400">
                      SKU: {p.sku} • Price:{" "}
                      <span className="text-green-400">
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div
                      className={`px-3 py-1 rounded-full ${
                        p.stock <= p.lowStockThreshold
                          ? "bg-red-800/50 text-red-400"
                          : "bg-gray-700/50 text-gray-200"
                      }`}
                    >
                      Stock: {p.stock}
                    </div>
                    <button
                      onClick={() => inc(p.id, 1)}
                      className="px-2 py-1 border border-cyan-600 text-cyan-400 rounded hover:bg-cyan-900/50 transition"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => inc(p.id, -1)}
                      className="px-2 py-1 border border-yellow-600 text-yellow-400 rounded hover:bg-yellow-900/50 transition"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="text-red-500 hover:text-red-400 ml-auto sm:ml-2 transition"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* === Dialog for Adding Sparepart === */}
      {openDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-gray-900/80 border border-cyan-700 rounded-2xl shadow-2xl shadow-cyan-900/40 p-6 w-full max-w-lg animate-fadeIn">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center sm:text-left">
              ➕ Add New Sparepart
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  label: "Nama",
                  key: "name",
                  type: "text",
                  placeholder: "Name",
                },
                { label: "SKU", key: "sku", type: "text", placeholder: "SKU" },
                {
                  label: "Stock",
                  key: "stock",
                  type: "number",
                  placeholder: "Stock",
                },
                {
                  label: "Price",
                  key: "price",
                  type: "number",
                  placeholder: "Price",
                },
                {
                  label: "Low Stock Threshold",
                  key: "lowStockThreshold",
                  type: "number",
                  placeholder: "Low stock threshold",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-gray-300 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

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
      )}
    </div>
  );
}
