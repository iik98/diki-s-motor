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

      setMechanics(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    }

    load();
  }, []);

  async function create() {
    if (!name.trim()) return;

    const ref = await addDoc(collection(db, "mechanics"), {
      name,
    });

    setMechanics((prev) => [
      {
        id: ref.id,
        name,
      },
      ...prev,
    ]);

    setName("");
    setOpenDialog(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete mechanic?")) return;

    await deleteDoc(doc(db, "mechanics", id));

    setMechanics((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-[#0070B2]">🛠️ Mechanics</h2>

            <p className="text-slate-500 mt-1 text-sm">
              Manage workshop mechanics list
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
            + Add Mechanic
          </button>
        </div>

        {/* LIST */}
        <div className="bg-white border border-[#CFE8F6] rounded-2xl shadow-sm overflow-hidden">
          {mechanics.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No mechanics added yet
            </div>
          ) : (
            <ul>
              {mechanics.map((m) => (
                <li
                  key={m.id}
                  className="
                    flex items-center justify-between
                    px-5 py-4
                    border-b border-[#EEF7FC]
                    last:border-b-0
                    hover:bg-[#F8FBFD]
                    transition
                  "
                >
                  <div>
                    <div className="font-semibold text-slate-700">{m.name}</div>

                    <div className="text-sm text-slate-400 mt-1">
                      Workshop Mechanic
                    </div>
                  </div>

                  <button
                    onClick={() => remove(m.id)}
                    className="
                      px-3 py-2
                      rounded-xl
                      text-red-500
                      hover:bg-red-50
                      transition
                    "
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* DIALOG */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="overflow-y-auto max-h-[90vh] w-full max-w-md">
            <div
              className="
                bg-white
                border border-[#CFE8F6]
                rounded-3xl
                shadow-xl
                p-6
                animate-fadeIn
              "
            >
              {/* TITLE */}
              <h3 className="text-2xl font-bold text-[#0070B2] mb-6">
                ➕ Add New Mechanic
              </h3>

              {/* INPUT */}
              <div>
                <label className="block text-slate-600 mb-1">
                  Mechanic Name
                </label>

                <input
                  type="text"
                  placeholder="Enter mechanic name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

      {/* ANIMATION */}
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
  );
}
