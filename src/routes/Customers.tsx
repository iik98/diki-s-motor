import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  endBefore,
  limitToLast,
} from "firebase/firestore";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { FaMotorcycle } from "react-icons/fa6";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import { generateServiceId } from "@/components/Counter";

interface Customer {
  id?: string;
  name: string;
  telepon: string;
  address: string;
  units?: any[];
}
const PAGE_SIZE = 10;
export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Customer>({
    name: "",
    telepon: "",
    address: "",
  });
  const [formUnit, setFormUnit] = useState({
    make: "",
    model: "",
    plate: "",
    year: "",
  });
  const nav = useNavigate();
  console.log(customers);
  // Load customers from Firestore
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const fetchPage = async (direction: "next" | "prev" | "initial") => {
    let q;

    if (direction === "next" && lastDoc) {
      q = query(
        collection(db, "customers"),
        orderBy("name"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
    } else if (direction === "prev" && firstDoc) {
      q = query(
        collection(db, "customers"),
        orderBy("name"),
        endBefore(firstDoc),
        limitToLast(PAGE_SIZE)
      );
    } else {
      q = query(collection(db, "customers"), orderBy("name"), limit(PAGE_SIZE));
    }

    const customerSnap = await getDocs(q);
    if (customerSnap.empty) return;

    setFirstDoc(customerSnap.docs[0]);
    setLastDoc(customerSnap.docs[customerSnap.docs.length - 1]);

    const customerIds = customerSnap.docs.map((d) => d.id);

    // ✅ TANPA chunk
    const unitSnap = await getDocs(
      query(collection(db, "units"), where("customerId", "in", customerIds))
    );

    const unitsByCustomer: Record<string, any[]> = {};

    unitSnap.docs.forEach((doc: any) => {
      const data = { id: doc.id, ...doc.data() };
      const customerId = data.customerId;

      if (!unitsByCustomer[customerId]) {
        unitsByCustomer[customerId] = [];
      }

      unitsByCustomer[customerId].push(data);
    });

    const result: Customer[] = customerSnap.docs.map((d) => {
      const data = d.data() as Customer;

      return {
        id: d.id,
        ...data,
        units: unitsByCustomer[d.id] || [],
      };
    });

    setCustomers(result);
  };

  useEffect(() => {
    fetchPage("initial");
  }, []);

  // Add new customer
  async function create(e?: React.FormEvent) {
    e?.preventDefault();
    const { name, telepon, address } = form;
    const { plate, make, model, year } = formUnit;
    if (!name || !telepon || !address || !plate || !make || !model || !year)
      return alert("isi form yg belum diisi!");
    const ref = await addDoc(collection(db, "customers"), {
      ...form,
      createdAt: serverTimestamp(),
    });
    const refUinit = await addDoc(collection(db, "units"), {
      ...formUnit,
      customerId: ref.id,
      createdAt: serverTimestamp(),
    });
    setCustomers((prev) => [{ id: ref.id, ...form }, ...prev]);
    const serviceId = await generateServiceId();
    const serviceDocRef = doc(db, "services", serviceId);

    // prepare base service data
    const serviceData = {
      customerId: ref.id,
      unitId: refUinit.id,
      createdAt: serverTimestamp(),
      status: "open",
      totalCost: 0,
    };

    // create service document
    await setDoc(serviceDocRef, serviceData);
    setForm({ name: "", telepon: "", address: "" });
    setFormUnit({ make: "", model: "", plate: "", year: "" });
    nav(`/print-service/${serviceDocRef.id}`);
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

  // search
  const [search, setSearch] = useState("");

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchPage("initial");
      return;
    }

    const keyword = search;

    // =========================
    // SEARCH CUSTOMER NAME
    // =========================
    const customerSnapByName = await getDocs(
      query(
        collection(db, "customers"),
        orderBy("name"),
        where("name", ">=", keyword),
        where("name", "<=", keyword + "\uf8ff")
      )
    );

    // =========================
    // SEARCH UNIT PLATE
    // =========================
    const unitSnap = await getDocs(
      query(
        collection(db, "units"),
        orderBy("plate"),
        where("plate", ">=", keyword),
        where("plate", "<=", keyword + "\uf8ff")
      )
    );

    // customer ids dari hasil plate
    const customerIdsFromUnits = unitSnap.docs.map((d) => d.data().customerId);

    // customer ids dari hasil nama
    const customerIdsFromCustomers = customerSnapByName.docs.map((d) => d.id);

    // gabungkan + unique
    const customerIds = [
      ...new Set([...customerIdsFromUnits, ...customerIdsFromCustomers]),
    ];

    if (customerIds.length === 0) {
      setCustomers([]);
      return;
    }

    // Firestore IN max 10
    const chunks = [];
    for (let i = 0; i < customerIds.length; i += 10) {
      chunks.push(customerIds.slice(i, i + 10));
    }

    const customerResults = await Promise.all(
      chunks.map((chunk) =>
        getDocs(
          query(collection(db, "customers"), where("__name__", "in", chunk))
        )
      )
    );

    // =========================
    // GET ALL UNITS
    // =========================
    const allUnitResults = await Promise.all(
      chunks.map((chunk) =>
        getDocs(
          query(collection(db, "units"), where("customerId", "in", chunk))
        )
      )
    );

    const unitsByCustomer: Record<string, any[]> = {};

    allUnitResults.forEach((snap) => {
      snap.docs.forEach((doc) => {
        const data = {
          id: doc.id,
          ...doc.data(),
        };

        const customerId = data.customerId;

        if (!unitsByCustomer[customerId]) {
          unitsByCustomer[customerId] = [];
        }

        unitsByCustomer[customerId].push(data);
      });
    });

    // =========================
    // FINAL RESULT
    // =========================
    const result: Customer[] = [];

    customerResults.forEach((snap) => {
      snap.docs.forEach((d) => {
        const data = d.data() as Customer;

        result.push({
          id: d.id,
          ...data,
          units: unitsByCustomer[d.id] || [],
        });
      });
    });

    setCustomers(result);
  };

  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-3xl font-bold text-[#0070B2]">Customers</h2>

          <button
            onClick={() => setOpen(true)}
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
            + Tambah Customer
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search customer / plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
          w-full px-4 py-2.5 rounded-xl
          border border-[#CFE8F6]
          bg-white
          text-slate-700
          focus:outline-none
          focus:ring-2
          focus:ring-[#0070B2]/20
          focus:border-[#0070B2]
        "
          />

          <button
            onClick={handleSearch}
            className="
          px-5 py-2.5 rounded-xl
          bg-[#0070B2]
          hover:bg-[#005f96]
          text-white
          transition
          whitespace-nowrap
        "
          >
            Search
          </button>
        </div>

        {/* CUSTOMER LIST */}
        {customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No customers found.
          </div>
        ) : (
          <ul className="bg-white border border-[#CFE8F6] rounded-2xl shadow-sm overflow-hidden">
            {customers.map((c) => (
              <li
                key={c.id}
                onClick={() => nav(`/customers/${c.id}`)}
                className="
              flex justify-between items-start gap-4
              px-5 py-4
              border-b border-[#EEF7FC]
              last:border-b-0
              hover:bg-[#F8FBFD]
              hover:shadow-sm
              transition
              cursor-pointer
            "
              >
                {/* LEFT */}
                <div className="flex-1">
                  <Link
                    to={`/customers/${c.id}`}
                    className="font-semibold text-slate-700 text-lg"
                  >
                    {c.name}
                  </Link>

                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p>📞 {c.telepon || "-"}</p>
                    <p>📍 {c.address || "-"}</p>
                  </div>

                  {/* UNITS */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <FaMotorcycle className="text-[#0070B2]" />

                    {c?.units?.map((u: any) => (
                      <span
                        key={u.plate}
                        className="
                      px-3 py-1
                      rounded-full
                      bg-[#EAF6FD]
                      text-[#0070B2]
                      text-xs
                      font-medium
                    "
                      >
                        {u.plate}
                      </span>
                    ))}
                  </div>
                </div>

                {/* RIGHT */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(c.id!);
                  }}
                  className="
                px-3 py-2 rounded-xl
                text-red-500
                hover:bg-red-50
                transition
                text-sm
              "
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* PAGINATION */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => fetchPage("prev")}
            className="
          flex items-center gap-2
          px-4 py-2
          rounded-xl
          border border-[#CFE8F6]
          hover:bg-[#F8FBFD]
          text-slate-600
          transition
        "
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Prev
          </button>

          <button
            onClick={() => fetchPage("next")}
            className="
          flex items-center gap-2
          px-4 py-2
          rounded-xl
          border border-[#CFE8F6]
          hover:bg-[#F8FBFD]
          text-slate-600
          transition
        "
          >
            Next
            <HiOutlineArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="overflow-y-auto max-h-[90vh]">
            <form
              onSubmit={create}
              className="
            bg-white
            border border-[#CFE8F6]
            rounded-3xl
            p-6
            w-full
            max-w-md
            shadow-xl
            relative
            animate-fadeIn
          "
            >
              {/* TITLE */}
              <h3 className="text-2xl font-bold text-[#0070B2] mb-5">
                Tambah Customer Baru
              </h3>

              {/* CUSTOMER FORM */}
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 mb-1">Nama</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter customer name"
                    value={form.name}
                    onChange={handleChange}
                    className="
                  w-full px-4 py-2
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
                    No Telepon
                  </label>

                  <input
                    type="text"
                    name="telepon"
                    placeholder="Enter phone number"
                    value={form.telepon}
                    onChange={handleChange}
                    className="
                  w-full px-4 py-2
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
                  <label className="block text-slate-600 mb-1">Alamat</label>

                  <textarea
                    name="address"
                    placeholder="Enter customer address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    className="
                  w-full px-4 py-2
                  bg-white
                  border border-[#CFE8F6]
                  rounded-xl
                  text-slate-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0070B2]/20
                  focus:border-[#0070B2]
                  resize-none
                "
                  />
                </div>
              </div>

              {/* UNIT */}
              <h3 className="text-xl font-bold text-[#0070B2] mt-8 mb-4">
                Add New Unit
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Merek</label>

                  <input
                    placeholder="e.g. Honda"
                    value={formUnit.make}
                    onChange={(e) =>
                      setFormUnit({
                        ...formUnit,
                        make: e.target.value,
                      })
                    }
                    className="
                  w-full px-4 py-2
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
                    value={formUnit.model}
                    onChange={(e) =>
                      setFormUnit({
                        ...formUnit,
                        model: e.target.value,
                      })
                    }
                    className="
                  w-full px-4 py-2
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
                    value={formUnit.plate}
                    onChange={(e) =>
                      setFormUnit({
                        ...formUnit,
                        plate: e.target.value.toUpperCase(),
                      })
                    }
                    className="
                  w-full px-4 py-2 uppercase
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
                  <label className="block text-slate-600 mb-1">Tahun</label>

                  <input
                    type="number"
                    placeholder="e.g. 2020"
                    value={formUnit.year}
                    onChange={(e) =>
                      setFormUnit({
                        ...formUnit,
                        year: e.target.value,
                      })
                    }
                    className="
                  w-full px-4 py-2
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

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                px-4 py-2 rounded-xl
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
                px-5 py-2 rounded-xl
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
