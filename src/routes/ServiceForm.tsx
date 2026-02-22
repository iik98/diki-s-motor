import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { createServiceOrderWithItems } from "../utils/firestore";
import { Customer, Mechanic, Sparepart, Unit } from "@/types";
import { useNavigate } from "react-router-dom";

export default function ServiceForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [parts, setParts] = useState<Sparepart[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const nav = useNavigate();

  const [form, setForm] = useState({
    customerId: "",
    unitId: "",
    mechanicId: "",
    laborCost: 0,
  });
  const [items, setItems] = useState<
    { partId: string; qty: number; price: number }[]
  >([]);

  useEffect(() => {
    async function load() {
      const cs = await getDocs(collection(db, "customers"));
      setCustomers(
        cs.docs.map((d) => ({ id: d.id, ...(d.data() as Customer) }))
      );
      const us = await getDocs(collection(db, "units"));
      setUnits(us.docs.map((d) => ({ id: d.id, ...(d.data() as Unit) })));
      const ps = await getDocs(collection(db, "spareparts"));
      setParts(ps.docs.map((d) => ({ ...(d.data() as Sparepart), id: d.id })));
      const ms = await getDocs(collection(db, "mechanics"));
      setMechanics(
        ms.docs.map((d) => ({ ...(d.data() as Mechanic), id: d.id }))
      );
    }
    load();
  }, []);

  function addItem(partId: string) {
    const p = parts.find((x) => x.id === partId);
    if (!p) return;
    setItems((prev) => [...prev, { partId, qty: 1, price: p.price }]);
  }

  const submit = async () => {
    try {
      // create reference for new service document
      const servicesCol = collection(db, "services");
      const serviceDocRef = doc(servicesCol);

      // prepare base service data
      const serviceData = {
        ...form,
        createdAt: serverTimestamp(),
        status: "open",
        totalCost: 0,
      };

      // create service document
      await setDoc(serviceDocRef, serviceData);

      let partsTotal = 0;

      // iterate over items to add them to subcollection and update stock
      for (const item of items) {
        const partRef = doc(db, "spareparts", item.partId);
        const partSnap = await getDoc(partRef);

        if (!partSnap.exists()) {
          throw new Error(`Part ${item.partId} not found`);
        }

        const partData = partSnap.data() as any;
        const currentStock = partData.stock || 0;

        if (currentStock < item.qty) {
          throw new Error(`Not enough stock for ${partData.name}`);
        }

        // reduce stock
        await updateDoc(partRef, {
          stock: currentStock - item.qty,
        });

        // add item to service/items subcollection
        const itemsCol = collection(serviceDocRef, "items");
        const itemDocRef = doc(itemsCol);
        await setDoc(itemDocRef, {
          partId: item.partId,
          qty: item.qty,
          price: item.price,
        });

        partsTotal += item.qty * item.price;
      }

      const totalCost = partsTotal + (form.laborCost || 0);

      // update service total
      await updateDoc(serviceDocRef, { totalCost });

      // alert("✅ Service created successfully!");
      setForm({ customerId: "", unitId: "", mechanicId: "", laborCost: 0 });
      setItems([]);
      nav(`/print-service/${serviceDocRef.id}`);
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-cyan-400 border-b border-cyan-700 pb-3 mb-6">
          🛠️ Create Service Order
        </h2>

        {/* Customer & Unit Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 backdrop-blur-md bg-gray-800/60 border border-gray-700 rounded-2xl p-5 shadow-xl shadow-cyan-900/30">
          {/* Customer */}
          <div className="flex flex-col">
            <label className="text-sm text-cyan-300 mb-1">Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="bg-gray-900 text-gray-100 border border-cyan-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div className="flex flex-col">
            <label className="text-sm text-cyan-300 mb-1">Unit</label>
            <select
              value={form.unitId}
              onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              className="bg-gray-900 text-gray-100 border border-cyan-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select unit</option>
              {units
                .filter((u) => u.customerId === form.customerId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.make} {u.model} ({u.plate})
                  </option>
                ))}
            </select>
          </div>

          {/* Mechanic */}
          <div className="flex flex-col">
            <label className="text-sm text-cyan-300 mb-1">Mechanic</label>
            <select
              value={form.mechanicId}
              onChange={(e) => setForm({ ...form, mechanicId: e.target.value })}
              className="bg-gray-900 text-gray-100 border border-cyan-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select mechanic</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Labor Cost */}
          <div className="flex flex-col">
            <label className="text-sm text-cyan-300 mb-1">Labor Cost</label>
            <input
              type="number"
              placeholder="Enter labor cost"
              value={form.laborCost}
              onChange={(e) =>
                setForm({ ...form, laborCost: Number(e.target.value) })
              }
              className="bg-gray-900 text-gray-100 border border-cyan-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Parts Selection */}
        <div className="mt-6 backdrop-blur-md bg-gray-800/60 border border-gray-700 rounded-2xl p-5 shadow-xl shadow-cyan-900/30">
          <h3 className="text-xl font-semibold text-cyan-300 mb-3">
            🔧 Parts Used
          </h3>

          {/* Parts dropdown */}
          <div className="flex flex-col mb-4">
            <label className="text-sm text-cyan-300 mb-1">Select Part</label>
            <select
              onChange={(e) => {
                addItem(e.target.value);
                e.target.value = "";
              }}
              className="bg-gray-900 text-gray-100 border border-cyan-700 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Add part...</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Items */}
          {items.length > 0 && (
            <div className="divide-y divide-gray-700">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 py-2 px-2 hover:bg-gray-700/40 rounded transition-all"
                >
                  <div className="flex-1">
                    {parts.find((p) => p.id === it.partId)?.name}
                  </div>
                  <div className="flex-1">
                    {parts.find((p) => p.id === it.partId)?.category}
                  </div>

                  {/* Quantity Label + Input */}
                  <div className="flex flex-col">
                    <label className="text-xs text-cyan-300 mb-1">Qty</label>
                    <input
                      type="number"
                      value={it.qty}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        setItems((prev) => {
                          const copy = [...prev];
                          copy[idx].qty = qty;
                          return copy;
                        });
                      }}
                      className="w-20 bg-gray-900 text-gray-100 border border-cyan-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="w-24 text-green-400 font-semibold">
                    Rp {it.price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-semibold shadow-lg shadow-cyan-900/40 transition-all"
          >
            ✅ Create Service
          </button>
        </div>
      </div>
    </div>
  );
}
