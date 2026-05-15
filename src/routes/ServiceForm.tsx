import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Customer, Sparepart, Unit } from "@/types";
import { useNavigate } from "react-router-dom";
import { generateServiceId } from "@/components/Counter";

export default function ServiceForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [parts, setParts] = useState<Sparepart[]>([]);

  const nav = useNavigate();

  const [form, setForm] = useState({
    customerId: "",
    unitId: "",
  });

  const [items, setItems] = useState<
    { partId: string; qty: number; price: number }[]
  >([]);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    async function load() {
      const cs = await getDocs(collection(db, "customers"));
      setCustomers(
        cs.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Customer),
        }))
      );

      const us = await getDocs(collection(db, "units"));
      setUnits(
        us.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Unit),
        }))
      );

      const ps = await getDocs(collection(db, "spareparts"));

      setParts(
        ps.docs.map((d) => ({
          ...(d.data() as Sparepart),
          id: d.id,
        }))
      );
    }

    load();
  }, []);

  /* ================= ADD PART ================= */

  function addItem(partId: string) {
    const p = parts.find((x) => x.id === partId);

    if (!p) return;

    setItems((prev) => [
      ...prev,
      {
        partId,
        qty: 1,
        price: p.price,
      },
    ]);
  }

  /* ================= REMOVE PART ================= */

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  /* ================= SUBMIT ================= */

  const submit = async () => {
    try {
      const serviceId = await generateServiceId();
      const serviceDocRef = doc(db, "services", serviceId);

      const serviceData = {
        ...form,
        createdAt: serverTimestamp(),
        status: "open",
        totalCost: 0,
      };

      await setDoc(serviceDocRef, serviceData);

      let partsTotal = 0;

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
          sold: (partData.sold || 0) + item.qty,
        });

        // save item
        const itemsCol = collection(serviceDocRef, "items");

        const itemDocRef = doc(itemsCol);

        await setDoc(itemDocRef, {
          partId: item.partId,
          qty: item.qty,
          price: item.price,
        });

        partsTotal += item.qty * item.price;
      }

      // update total
      await updateDoc(serviceDocRef, {
        totalCost: partsTotal,
      });

      // reset
      setForm({
        customerId: "",
        unitId: "",
      });

      setItems([]);

      nav(`/print-service/${serviceDocRef.id}`);
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-8">
        {/* ================= HEADER ================= */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0070B2]">
            🛠️ Create Service Order
          </h2>

          <p className="text-slate-500 mt-2">
            Create a new service transaction and add spareparts used.
          </p>
        </div>

        {/* ================= CUSTOMER & UNIT ================= */}
        <div
          className="
            bg-[#F8FBFD]
            border border-[#D9ECF7]
            rounded-2xl
            p-6
            mb-6
          "
        >
          <h3 className="text-lg font-semibold text-slate-700 mb-5">
            Customer Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CUSTOMER */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Customer
              </label>

              <select
                value={form.customerId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerId: e.target.value,
                    unitId: "",
                  })
                }
                className="
                  w-full
                  bg-white
                  border border-[#CFE8F6]
                  rounded-xl
                  px-4 py-3
                  text-slate-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0070B2]/20
                  focus:border-[#0070B2]
                "
              >
                <option value="">Select customer</option>

                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* UNIT */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Unit
              </label>

              <select
                value={form.unitId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unitId: e.target.value,
                  })
                }
                className="
                  w-full
                  bg-white
                  border border-[#CFE8F6]
                  rounded-xl
                  px-4 py-3
                  text-slate-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0070B2]/20
                  focus:border-[#0070B2]
                "
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
          </div>
        </div>

        {/* ================= TOTAL ================= */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            className="
                mt-5
                w-full
                bg-[#0070B2]
                hover:bg-[#005f96]
                text-white
                py-3
                rounded-2xl
                font-semibold
                transition
                shadow-sm
              "
          >
            Create Service
          </button>
        </div>
      </div>
    </div>
  );
}
