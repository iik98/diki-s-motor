import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

interface Customer {
  id?: string;
  name: string;
  telepon: string;
  address: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Customer>({
    name: "",
    telepon: "",
    address: "",
  });
  const nav = useNavigate();

  // Load customers from Firestore
  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "customers"));
      setCustomers(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Customer) }))
      );
    }
    load();
  }, []);

  // Add new customer
  async function create(e?: React.FormEvent) {
    e?.preventDefault();
    const { name, telepon, address } = form;
    if (!name || !telepon || !address)
      return alert("Please fill in all fields.");
    const ref = await addDoc(collection(db, "customers"), form);
    setCustomers((prev) => [{ id: ref.id, ...form }, ...prev]);
    setForm({ name: "", telepon: "", address: "" });
    setOpen(false);
  }

  // Delete customer
  async function remove(id: string) {
    if (!confirm("Delete customer?")) return;
    await deleteDoc(doc(db, "customers", id));
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  // Handle input change (single state)
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-100 p-6 font-mono">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_#00ffff]">
            Customers
          </h2>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md shadow-lg shadow-cyan-500/30 transition-transform hover:scale-105"
          >
            + Add Customer
          </button>
        </div>

        <div className="bg-gray-900/60 rounded-xl border border-cyan-700/40 backdrop-blur-md shadow-md shadow-cyan-700/20 p-4">
          {customers.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No customers found.
            </p>
          )}
          <ul className="divide-y divide-gray-700">
            {customers.map((c) => (
              <li
                onClick={() => nav(`/customers/${c.id}`)}
                key={c.id}
                className="flex justify-between items-center py-3 px-2 hover:bg-cyan-950/30 rounded-md transition"
              >
                <div>
                  <Link
                    to={`/customers/${c.id}`}
                    className="text-lg text-cyan-300 hover:text-cyan-400 block"
                  >
                    {c.name}
                  </Link>
                  <p className="text-sm text-gray-400">
                    📞 {c.telepon || "-"} <br />
                    📍 {c.address || "-"}
                  </p>
                </div>
                <button
                  onClick={() => remove(c.id!)}
                  className="text-red-500 hover:text-red-400 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add Customer Dialog */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={create}
            className="bg-gray-900 border border-cyan-700 rounded-xl p-6 w-full max-w-md shadow-xl shadow-cyan-700/40 relative animate-fadeIn"
          >
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              Add New Customer
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter customer name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-cyan-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Phone</label>
                <input
                  type="text"
                  name="telepon"
                  placeholder="Enter phone number"
                  value={form.telepon}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-cyan-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Address</label>
                <textarea
                  name="address"
                  placeholder="Enter customer address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-cyan-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white shadow-cyan-500/40 shadow-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
