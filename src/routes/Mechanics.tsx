import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Mechanic } from "@/types";

export default function Mechanics() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [name, setName] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "mechanics"));
      setMechanics(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    }
    load();
  }, []);

  async function create() {
    if (!name.trim()) return;
    const ref = await addDoc(collection(db, "mechanics"), { name });
    setMechanics((prev) => [{ id: ref.id, name }, ...prev]);
    setName("");
    setOpenDialog(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete mechanic?")) return;
    await deleteDoc(doc(db, "mechanics", id));
    setMechanics((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b border-cyan-700 pb-3">
          <h2 className="text-3xl font-bold text-cyan-400">🛠️ Mechanics</h2>
          <button
            onClick={() => setOpenDialog(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg shadow-md shadow-cyan-900/30 transition-all"
          >
            + Add Mechanic
          </button>
        </div>

        <div className="backdrop-blur-md bg-gray-800/50 border border-gray-700 rounded-2xl p-5 shadow-xl shadow-cyan-900/30">
          <ul className="divide-y divide-gray-700">
            {mechanics.map((m) => (
              <li
                key={m.id}
                className="flex justify-between items-center py-2 px-2 hover:bg-gray-700/40 rounded transition-all"
              >
                <div className="text-gray-100 font-medium">{m.name}</div>
                <button
                  onClick={() => remove(m.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  Delete
                </button>
              </li>
            ))}
            {mechanics.length === 0 && (
              <li className="py-2 text-gray-500 text-sm text-center">
                No mechanics added yet
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Dialog for Adding Mechanic */}
      {openDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-gray-900/80 border border-cyan-700 rounded-2xl shadow-2xl shadow-cyan-900/40 p-6 w-full max-w-md animate-fadeIn">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              ➕ Add New Mechanic
            </h3>
            <input
              className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenDialog(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={create}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow shadow-cyan-900/30"
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
