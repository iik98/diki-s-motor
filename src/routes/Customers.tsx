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
    const serviceDocRef = doc(db, "services", `ORD-${formUnit.plate}-1`);

    // prepare base service data
    const serviceData = {
      customerId: ref.id,
      unitId: refUinit.id,
      createdAt: serverTimestamp(),
      status: "open",
      totalCost: 0,
    };

    // create service document
    const refServ = await setDoc(serviceDocRef, serviceData);
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
  const [searchPlate, setSearchPlate] = useState("");

  const handleSearch = async () => {
    if (!searchPlate) {
      fetchPage("initial");
      return;
    }

    // cari unit berdasarkan plate
    const unitSnap = await getDocs(
      query(
        collection(db, "units"),
        where("plate", ">=", searchPlate.toUpperCase()),
        where("plate", "<=", searchPlate.toUpperCase() + "\uf8ff")
      )
    );

    if (unitSnap.empty) {
      setCustomers([]);
      return;
    }

    const customerIds = [
      ...new Set(unitSnap.docs.map((doc) => doc.data().customerId)),
    ];

    // ambil customer dari hasil unit
    const customerSnap = await getDocs(
      query(collection(db, "customers"), where("__name__", "in", customerIds))
    );

    // mapping unit ke customer
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
            + Tambah Customer
          </button>
        </div>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Search plate..."
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
            className="px-3 py-2 bg-gray-800 border border-cyan-700 rounded w-full"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-cyan-600 rounded"
          >
            Search
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
                    <br />
                  </p>
                  <div
                    className="text-sm text-gray-400 "
                    style={{ display: "flex" }}
                  >
                    <FaMotorcycle />
                    <div style={{ marginLeft: 10, display: "flex" }}>
                      {" "}
                      {c?.units?.map((u: any) => (
                        <p key={u.plate}>{u.plate}| </p>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => remove(c.id!)}
                  className="text-red-500 hover:text-red-400 hover:underline"
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => fetchPage("prev")}
              className="flex items-center gap-1"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
              Prev
            </button>

            <button
              onClick={() => fetchPage("next")}
              className="flex items-center gap-1"
            >
              Next
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          {/* <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg max-h-[90vh] overflow-hidden"> */}
          <div className="overflow-y-auto max-h-[90vh] p-4">
            <form
              onSubmit={create}
              className="bg-gray-900 border border-cyan-700 rounded-xl p-6 w-full max-w-md shadow-xl shadow-cyan-700/40 relative animate-fadeIn"
            >
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">
                Tambah Customer Baru
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1">Nama</label>
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
                  <label className="block text-gray-300 mb-1">No Telepon</label>
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
                  <label className="block text-gray-300 mb-1">Alamat</label>
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
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">
                Add New Unit
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Merek</label>
                  <input
                    className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
                    placeholder="e.g. Honda"
                    value={formUnit.make}
                    onChange={(e) =>
                      setFormUnit({ ...formUnit, make: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Model</label>
                  <input
                    className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
                    placeholder="e.g. Supra X"
                    value={formUnit.model}
                    onChange={(e) =>
                      setFormUnit({ ...formUnit, model: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">
                    Plate Number
                  </label>
                  <input
                    className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full uppercase"
                    placeholder="e.g. B 1234 XYZ"
                    value={formUnit.plate}
                    onChange={(e) =>
                      setFormUnit({
                        ...formUnit,
                        plate: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Tahun</label>
                  <input
                    type="number"
                    className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
                    placeholder="e.g. 2020"
                    value={formUnit.year}
                    onChange={(e) =>
                      setFormUnit({ ...formUnit, year: e.target.value })
                    }
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
            {/* </div> */}
          </div>
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
