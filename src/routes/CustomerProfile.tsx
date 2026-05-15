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
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateServiceId } from "@/components/Counter";
import { useNavigate } from "react-router-dom";

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

  /* ================= LOAD CUSTOMER ================= */

  useEffect(() => {
    async function load() {
      const custRef = doc(db, "customers", customerId);

      const custSnap = await getDoc(custRef);

      if (custSnap.exists()) {
        setCustomer({
          id: custSnap.id,
          ...(custSnap.data() as any),
        });
      }

      const unitsSnap = await getDocs(
        query(collection(db, "units"), where("customerId", "==", customerId))
      );

      setUnits(
        unitsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    }

    load();
  }, [customerId]);

  /* ================= LOAD HISTORY ================= */

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
        servSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    }

    loadHistory();
  }, [selectedUnit, customerId]);

  /* ================= ADD UNIT ================= */

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.make || !form.model || !form.plate) return;

    const ref = await addDoc(collection(db, "units"), {
      ...form,
      customerId,
      createdAt: serverTimestamp(),
    });

    setUnits((prev) => [
      {
        id: ref.id,
        ...form,
      },
      ...prev,
    ]);

    setForm({
      make: "",
      model: "",
      plate: "",
      year: "",
    });

    setOpen(false);
  }
  const nav = useNavigate();

  const createService = async (data: any) => {
    try {
      // console.log(data);
      const serviceId = await generateServiceId();

      // console.log(serviceId);

      const serviceDocRef = doc(db, "services", serviceId);

      // prepare base service data
      const serviceData = {
        customerId: data?.customerId,
        unitId: data?.unitId,
        createdAt: serverTimestamp(),
        status: "open",
        totalCost: 0,
      };

      // create service document
      await setDoc(serviceDocRef, serviceData);
      nav(`/print-service/${serviceDocRef.id}`);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ================= HEADER ================= */}

        <div className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
          <h2 className="text-3xl font-bold text-[#0070B2]">
            {customer?.name || "Loading..."}
          </h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-[#F8FBFD] rounded-2xl p-4 border border-[#EEF7FC]">
              <div className="text-slate-500 mb-1">Phone</div>

              <div className="font-medium text-slate-700">
                {customer?.telepon || "-"}
              </div>
            </div>

            <div className="bg-[#F8FBFD] rounded-2xl p-4 border border-[#EEF7FC]">
              <div className="text-slate-500 mb-1">Address</div>

              <div className="font-medium text-slate-700">
                {customer?.address || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* ================= UNITS ================= */}

        <section className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <h3 className="text-2xl font-bold text-[#0070B2]">🏍️ Units</h3>

            <button
              onClick={() => setOpen(true)}
              className="
                px-5 py-2.5 rounded-xl
                bg-[#0070B2]
                hover:bg-[#005f96]
                text-white
                transition
              "
            >
              + Add Unit
            </button>
          </div>

          {units.length === 0 ? (
            <div className="text-slate-400 italic">No registered units</div>
          ) : (
            <ul className="space-y-3">
              {units.map((u) => (
                <li
                  key={u.id}
                  className="bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-6"
                >
                  <div
                    className="
                    flex flex-col md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                    p-4 
                  "
                  >
                    <div>
                      <div className="font-semibold text-slate-700">
                        {u.make} {u.model}
                      </div>

                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span
                          className="
                          px-3 py-1 rounded-full
                          bg-[#EAF6FD]
                          text-[#0070B2]
                          text-xs font-medium
                        "
                        >
                          {u.plate}
                        </span>

                        {u.year && (
                          <span
                            className="
                            px-3 py-1 rounded-full
                            bg-gray-100
                            text-slate-600
                            text-xs font-medium
                          "
                          >
                            {u.year}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() =>
                          createService({
                            customerId,
                            unitId: u.id,
                            plate: u.plate,
                          })
                        }
                        className={`
                      px-4 py-2 rounded-xl text-sm text-yellow-600 transition border border-yellow-200
                            hover:bg-yellow-50
                            "`}
                      >
                        Buat Service
                      </button>
                      <button
                        onClick={() => setSelectedUnit(u.id)}
                        className={`
                      px-4 ml-2 py-2 rounded-xl text-sm transition
                      ${
                        selectedUnit === u.id
                          ? "bg-[#0070B2] text-white"
                          : "border border-[#CFE8F6] text-[#0070B2] hover:bg-[#F8FBFD]"
                      }
                    `}
                      >
                        {selectedUnit === u.id ? "Selected" : "History"}
                      </button>
                    </div>
                  </div>
                  {selectedUnit && selectedUnit === u.id && (
                    <section>
                      <h3 className="text-2xl font-bold text-[#0070B2] mb-5">
                        🧾 Service History
                      </h3>

                      {history.length === 0 ? (
                        <div className="text-slate-400 italic">
                          No recorded services for this unit
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {history.map((h) => (
                            <ServiceCard key={h.id} service={h} />
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ================= SERVICE HISTORY ================= */}
      </div>

      {/* ================= MODAL ================= */}

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={addUnit}
            className="
              bg-white
              border border-[#CFE8F6]
              rounded-3xl
              p-6
              w-full
              max-w-md
              shadow-xl
              animate-fadeIn
            "
          >
            <h3 className="text-2xl font-bold text-[#0070B2] mb-5">
              Add New Unit
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-slate-600 mb-1">Make</label>

                <input
                  placeholder="e.g. Honda"
                  value={form.make}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      make: e.target.value,
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

              <div>
                <label className="block text-slate-600 mb-1">Model</label>

                <input
                  placeholder="e.g. Supra X"
                  value={form.model}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      model: e.target.value,
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

              <div>
                <label className="block text-slate-600 mb-1">
                  Plate Number
                </label>

                <input
                  placeholder="e.g. B 1234 XYZ"
                  value={form.plate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      plate: e.target.value.toUpperCase(),
                    })
                  }
                  className="
                    w-full px-4 py-2.5 uppercase
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

              <div>
                <label className="block text-slate-600 mb-1">Year</label>

                <input
                  type="number"
                  placeholder="e.g. 2020"
                  value={form.year}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      year: e.target.value,
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

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                  px-4 py-2.5 rounded-xl
                  border border-[#CFE8F6]
                  hover:bg-[#F8FBFD]
                  text-slate-600
                  transition
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                className="
                  px-5 py-2.5 rounded-xl
                  bg-[#0070B2]
                  hover:bg-[#005f96]
                  text-white
                  transition
                "
              >
                Save
              </button>
            </div>
          </form>
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
  );
}

/* ================= SERVICE CARD ================= */

function ServiceCard({ service }: { service: any }) {
  const [mechanicName, setMechanicName] = React.useState<string>("Loading...");

  const [items, setItems] = React.useState<any[]>([]);

  const created = service.createdAt?.seconds
    ? new Date(service.createdAt.seconds * 1000).toLocaleString()
    : "—";

  /* ================= LOAD MECHANIC ================= */

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

  /* ================= LOAD ITEMS ================= */

  React.useEffect(() => {
    async function loadItems() {
      try {
        const itemsRef = collection(db, "services", service.id, "items");

        const snap = await getDocs(itemsRef);

        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();

            try {
              const partRef = doc(db, "spareparts", data.partId);

              const partSnap = await getDoc(partRef);

              const partName = partSnap.exists()
                ? (partSnap.data() as any).name
                : "Unknown Part";

              return {
                id: d.id,
                ...data,
                partName,
              };
            } catch {
              return {
                id: d.id,
                ...data,
                partName: "Unknown Part",
              };
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
    <div
      className="
        p-5 rounded-3xl
        border border-[#CFE8F6]
        bg-white
        shadow-sm
        hover:shadow-md
        transition
      "
    >
      {/* DATE */}

      <div className="text-sm text-slate-400 mb-4">{created}</div>

      {/* INFO */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-[#F8FBFD] rounded-2xl p-4 border border-[#EEF7FC]">
          <div className="text-slate-500 text-sm mb-1">Mechanic</div>

          <div className="font-semibold text-[#0070B2]">{mechanicName}</div>
        </div>

        <div className="bg-[#F8FBFD] rounded-2xl p-4 border border-[#EEF7FC]">
          <div className="text-slate-500 text-sm mb-1">Status</div>

          <div className="font-semibold text-slate-700">{service.status}</div>
        </div>

        <div className="bg-[#F8FBFD] rounded-2xl p-4 border border-[#EEF7FC]">
          <div className="text-slate-500 text-sm mb-1">Total</div>

          <div className="font-bold text-green-600">
            Rp {service.totalCost?.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      {/* ITEMS */}

      <div className="border-t border-[#EEF7FC] pt-4">
        <div className="text-[#0070B2] font-semibold mb-3">
          🔧 Spare Parts Used
        </div>

        {items.length === 0 ? (
          <div className="text-slate-400 italic text-sm">
            No parts used in this service.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="
                  flex justify-between items-center
                  p-3 rounded-2xl
                  bg-[#F8FBFD]
                  border border-[#EEF7FC]
                "
              >
                <div className="font-medium text-slate-700">
                  {item.partName}
                </div>

                <div className="text-slate-500">x{item.qty}</div>

                <div className="font-semibold text-slate-700">
                  Rp {(item.price * item.qty).toLocaleString("id-ID")}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 bg-[#F8FBFD] rounded-2xl p-4 border border-[#EEF7FC]">
          <div className="text-slate-500 text-sm mb-1">
            Catatan: {service.note}
          </div>
        </div>
      </div>
    </div>
  );
}
