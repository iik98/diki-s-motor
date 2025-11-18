import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export default function CustomerProfile({
  customerId,
}: {
  customerId: string;
}) {
  const [customer, setCustomer] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    plate: "",
    year: "",
  });

  // Load customer + units
  useEffect(() => {
    async function load() {
      const custRef = doc(db, "customers", customerId);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists())
        setCustomer({ id: custSnap.id, ...(custSnap.data() as any) });

      const unitsSnap = await getDocs(
        query(collection(db, "units"), where("customerId", "==", customerId))
      );
      setUnits(unitsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    }
    load();
  }, [customerId]);

  // Load service history when unit selected
  useEffect(() => {
    async function loadHistory() {
      if (!selectedUnit) return;
      const servSnap = await getDocs(
        query(
          collection(db, "services"),
          where("customerId", "==", customerId),
          where("unitId", "==", selectedUnit),
          orderBy("createdAt", "desc")
        )
      );
      setHistory(
        servSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    }
    loadHistory();
  }, [selectedUnit, customerId]);

  // Create a new unit
  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.make || !form.model || !form.plate) return;
    const ref = await addDoc(collection(db, "units"), {
      ...form,
      customerId,
      createdAt: serverTimestamp(),
    });
    setUnits((prev) => [{ id: ref.id, ...form }, ...prev]);
    setForm({ make: "", model: "", plate: "", year: "" });
    setOpen(false);
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 font-mono">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h2 className="text-3xl font-bold text-cyan-400 border-b border-cyan-700 pb-2 mb-6">
          {customer?.name || "Loading..."}
        </h2>

        {/* Units Section */}
        <section className="backdrop-blur-md bg-gray-800/60 border border-gray-700 rounded-2xl p-5 shadow-xl shadow-cyan-900/30 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl text-cyan-300 font-semibold flex items-center gap-2">
              🏍️ Units
            </h3>
            <button
              onClick={() => setOpen(true)}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow shadow-cyan-500/30 text-sm transition"
            >
              + Add Unit
            </button>
          </div>

          {units.length === 0 ? (
            <div className="text-gray-500 italic">No registered units</div>
          ) : (
            <ul className="divide-y divide-gray-700 mb-3">
              {units.map((u) => (
                <li
                  key={u.id}
                  className="py-2 hover:bg-gray-700/40 rounded-lg px-2 transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="text-gray-200">
                      {u.make} {u.model}
                    </span>
                    <span className="text-cyan-400 ml-2">({u.plate})</span>
                  </div>
                  <button
                    onClick={() => setSelectedUnit(u.id)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      selectedUnit === u.id
                        ? "bg-cyan-700 text-white"
                        : "bg-gray-700 hover:bg-cyan-800"
                    }`}
                  >
                    {selectedUnit === u.id ? "Selected" : "Select"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Show only if unit selected */}
        {selectedUnit && (
          <section className="backdrop-blur-md bg-gray-800/60 border border-gray-700 rounded-2xl p-5 shadow-xl shadow-cyan-900/30">
            <h3 className="text-xl text-cyan-300 font-semibold mb-3 flex items-center gap-2">
              🧾 Service History
            </h3>
            {history.length === 0 ? (
              <div className="text-gray-500 italic">
                No recorded services for this unit
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <ServiceCard key={h.id} service={h} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* === Add Unit Modal === */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={addUnit}
            className="bg-gray-900 border border-cyan-700 rounded-xl p-6 w-full max-w-md shadow-xl shadow-cyan-700/40 relative animate-fadeIn"
          >
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              Add New Unit
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-gray-300 mb-1">Make</label>
                <input
                  className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
                  placeholder="e.g. Honda"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Model</label>
                <input
                  className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
                  placeholder="e.g. Supra X"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Plate Number</label>
                <input
                  className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full uppercase"
                  placeholder="e.g. B 1234 XYZ"
                  value={form.plate}
                  onChange={(e) =>
                    setForm({ ...form, plate: e.target.value.toUpperCase() })
                  }
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Year</label>
                <input
                  type="number"
                  className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
                  placeholder="e.g. 2020"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
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
    </div>
  );
}

function ServiceCard({ service }: { service: any }) {
  const [mechanicName, setMechanicName] = React.useState<string>("Loading...");
  const [items, setItems] = React.useState<any[]>([]);
  const created = service.createdAt?.seconds
    ? new Date(service.createdAt.seconds * 1000).toLocaleString()
    : "—";

  // Load mechanic name
  React.useEffect(() => {
    async function loadMechanic() {
      if (!service.mechanicId) {
        setMechanicName("—");
        return;
      }
      try {
        const ref = doc(db, "mechanics", service.mechanicId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          setMechanicName(data.name || "Unknown");
        } else {
          setMechanicName("Unknown");
        }
      } catch (err) {
        console.error("Error loading mechanic:", err);
        setMechanicName("Error");
      }
    }
    loadMechanic();
  }, [service.mechanicId]);

  // Load items used in service
  React.useEffect(() => {
    async function loadItems() {
      try {
        const itemsRef = collection(db, "services", service.id, "items");
        const snap = await getDocs(itemsRef);

        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            // Get part name
            try {
              const partRef = doc(db, "spareparts", data.partId);
              const partSnap = await getDoc(partRef);
              const partName = partSnap.exists()
                ? (partSnap.data() as any).name
                : "Unknown Part";
              return { id: d.id, ...data, partName };
            } catch {
              return { id: d.id, ...data, partName: "Unknown Part" };
            }
          })
        );

        setItems(list);
      } catch (err) {
        console.error("Error loading items:", err);
      }
    }

    if (service.id) loadItems();
  }, [service.id]);

  return (
    <div className="p-4 bg-gray-900/70 border border-cyan-800 rounded-xl hover:shadow-md hover:shadow-cyan-900/30 transition-all">
      <div className="text-sm text-gray-400 mb-2">{created}</div>

      {/* Header info */}
      <div className="flex justify-between text-gray-200 mb-2">
        <div>
          Mechanic:{" "}
          <span className="text-cyan-400 font-semibold">{mechanicName}</span>
        </div>
        <div>
          Labor:{" "}
          <span className="text-cyan-400 font-semibold">
            Rp {service.laborCost?.toLocaleString("id-ID")}
          </span>
        </div>
        <div>
          Total:{" "}
          <span className="text-green-400 font-bold">
            Rp {service.totalCost?.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="mt-3 border-t border-gray-700 pt-2">
        <div className="text-sm text-cyan-300 font-semibold mb-1">
          🔧 Spare Parts Used:
        </div>
        {items.length === 0 ? (
          <div className="text-gray-500 italic text-sm">
            No parts used in this service.
          </div>
        ) : (
          <ul className="divide-y divide-gray-800 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between py-1 text-gray-300"
              >
                <div className="flex-1">{item.partName}</div>
                <div className="w-20 text-center">x{item.qty}</div>
                <div className="w-28 text-right text-gray-400">
                  Rp {(item.price * item.qty).toLocaleString("id-ID")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
