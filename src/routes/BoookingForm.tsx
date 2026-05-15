import React, { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateServiceId } from "@/components/Counter";

const BookingService = () => {
  const [loading, setLoading] = useState(false);

  // ================= CUSTOMER =================

  const [customer, setCustomer] = useState({
    name: "",
    telepon: "",
    address: "",
  });

  // ================= UNIT =================

  const [unit, setUnit] = useState({
    make: "",
    model: "",
    plate: "",
    year: "",
  });

  // ================= BOOKING INFO =================

  const [bookingInfo, setBookingInfo] = useState({
    bookingDate: "",
    keluhan: "",
  });

  // ================= SUBMIT =================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // ================= CREATE CUSTOMER =================

      const customerRef = await addDoc(collection(db, "customers"), {
        name: customer.name,
        telepon: customer.telepon,
        address: customer.address,
        createdAt: serverTimestamp(),
      });

      // ================= CREATE UNIT =================

      const unitRef = doc(collection(db, "units"));

      await setDoc(unitRef, {
        customerId: customerRef.id,

        make: unit.make,

        model: unit.model,

        plate: unit.plate.toUpperCase(),

        year: unit.year,

        createdAt: serverTimestamp(),
      });

      // ================= CREATE SERVICE =================
      const serviceId = await generateServiceId();
      const serviceDocRef = doc(db, "services", serviceId);

      await setDoc(serviceDocRef, {
        customerId: customerRef.id,

        unitId: unitRef.id,

        bookingDate: bookingInfo.bookingDate ? Timestamp.fromDate(new Date(bookingInfo.bookingDate)) : null,

        keluhan: bookingInfo.keluhan,

        createdAt: serverTimestamp(),

        status: "booked",
      });

      alert("Booking berhasil dibuat");

      // RESET

      setCustomer({
        name: "",
        telepon: "",
        address: "",
      });

      setUnit({
        make: "",
        model: "",
        plate: "",
        year: "",
      });

      setBookingInfo({
        bookingDate: "",
        keluhan: "",
      });
    } catch (error) {
      console.log(error);

      alert("Gagal membuat booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#EAF6FD] p-4 md:p-8">
      {/* ================= BACKGROUND LOGO ================= */}

      <img
        src="/logo.png"
        alt="logo"
        className="
      hidden md:block

      absolute
      w-[2080px]

      opacity-[0.08]
      rotate-[-18deg]

      pointer-events-none
      select-none
    "
      />

      {/* ================= MOBILE LOGO ================= */}

      <div className="md:hidden flex justify-center mb-6 mt-2">
        <img src="/logo.png" alt="logo" className="w-48 object-contain" />
      </div>

      {/* ================= CONTENT ================= */}

      <div
        className="
      relative z-10
      max-w-3xl mx-auto

      bg-white/80
      backdrop-blur-sm

      border border-[#CFE8F6]
      rounded-3xl
      shadow-sm
      overflow-hidden
    "
      >
        {/* ================= HEADER ================= */}

        <div className="bg-[#0070B2] px-6 py-5 text-white">
          <h1 className="text-3xl font-bold">🔧 Booking Service</h1>
        </div>

        {/* ================= FORM ================= */}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* ================= CUSTOMER ================= */}

          <div>
            <h2 className="text-2xl font-bold text-[#0070B2] mb-4">
              Customer Information
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-slate-600 mb-1">Nama</label>

                <input
                  required
                  type="text"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      name: e.target.value,
                    })
                  }
                  placeholder="Nama customer"
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
              "
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">No Telepon</label>

                <input
                  required
                  type="text"
                  value={customer.telepon}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      telepon: e.target.value,
                    })
                  }
                  placeholder="08xxxxxxxxxx"
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
              "
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Alamat</label>

                <textarea
                  rows={3}
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      address: e.target.value,
                    })
                  }
                  placeholder="Alamat customer"
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
                resize-none
              "
                />
              </div>
            </div>
          </div>

          {/* ================= UNIT ================= */}

          <div>
            <h2 className="text-2xl font-bold text-[#0070B2] mb-4">
              Informasi Kendaraan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 mb-1">Brand</label>

                <input
                  required
                  type="text"
                  value={unit.make}
                  onChange={(e) =>
                    setUnit({
                      ...unit,
                      make: e.target.value,
                    })
                  }
                  placeholder="Honda"
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
              "
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Model</label>

                <input
                  required
                  type="text"
                  value={unit.model}
                  onChange={(e) =>
                    setUnit({
                      ...unit,
                      model: e.target.value,
                    })
                  }
                  placeholder="Beat / Supra X"
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
              "
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Plate Number
                </label>

                <input
                  required
                  type="text"
                  value={unit.plate}
                  onChange={(e) =>
                    setUnit({
                      ...unit,
                      plate: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="B 1234 XYZ"
                  className="
                w-full px-4 py-3 uppercase
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
              "
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Year</label>

                <input
                  required
                  type="number"
                  value={unit.year}
                  onChange={(e) =>
                    setUnit({
                      ...unit,
                      year: e.target.value,
                    })
                  }
                  placeholder="2024"
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
              "
                />
              </div>
            </div>
          </div>

          {/* ================= BOOKING INFO ================= */}

          <div>
            <h2 className="text-2xl font-bold text-[#0070B2] mb-4">
              Informasi Booking
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-slate-600 mb-1">Tanggal Booking</label>

                <input
                  required
                  type="date"
                  value={bookingInfo.bookingDate}
                  onChange={(e) =>
                    setBookingInfo({
                      ...bookingInfo,
                      bookingDate: e.target.value,
                    })
                  }
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
              "
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Keluhan</label>

                <textarea
                  required
                  rows={4}
                  value={bookingInfo.keluhan}
                  onChange={(e) =>
                    setBookingInfo({
                      ...bookingInfo,
                      keluhan: e.target.value,
                    })
                  }
                  placeholder="Motor susah hidup, rem bunyi, dll"
                  className="
                w-full px-4 py-3
                border border-[#CFE8F6]
                rounded-2xl
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[#0070B2]/20
                resize-none
              "
                />
              </div>
            </div>
          </div>

          {/* ================= ACTION ================= */}

          <button
            type="submit"
            disabled={loading}
            className="
          w-full py-4 rounded-2xl
          bg-[#0070B2]
          hover:bg-[#005f96]
          disabled:opacity-50
          text-white
          font-semibold
          transition
        "
          >
            {loading ? "Saving..." : "Book Service"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingService;

// import React, { useEffect, useState } from "react";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "../firebase";
// import { useNavigate } from "react-router-dom";

// interface Mechanic {
//   id: string;
//   name: string;
// }

// interface Sparepart {
//   id: string;
//   name: string;
//   price: number;
// }

// const BookingService: React.FC = () => {
//   const nav = useNavigate();

//   const [loading, setLoading] = useState(false);

//   const [mechanics, setMechanics] = useState<Mechanic[]>([]);

//   const [services, setServices] = useState<Sparepart[]>([]);

//   const [form, setForm] = useState({
//     customerName: "",
//     phone: "",
//     plate: "",
//     unit: "",
//     complaint: "",
//     mechanicId: "",
//     bookingDate: "",
//   });

//   const [selectedServices, setSelectedServices] = useState<any[]>([]);

//   // ================= FETCH DATA =================

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [mechSnap, serviceSnap] = await Promise.all([
//         getDocs(collection(db, "mechanics")),

//         getDocs(collection(db, "jasa")),
//       ]);

//       setMechanics(
//         mechSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...(doc.data() as any),
//         }))
//       );

//       setServices(
//         serviceSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...(doc.data() as any),
//         }))
//       );
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // ================= ADD SERVICE =================

//   const addService = (service: Sparepart) => {
//     const exist = selectedServices.find((s) => s.id === service.id);

//     if (exist) return;

//     setSelectedServices([
//       ...selectedServices,
//       {
//         ...service,
//         qty: 1,
//       },
//     ]);
//   };

//   // ================= REMOVE SERVICE =================

//   const removeService = (id: string) => {
//     setSelectedServices(selectedServices.filter((s) => s.id !== id));
//   };

//   // ================= SUBMIT =================

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       setLoading(true);

//       const totalCost = selectedServices.reduce(
//         (acc, item) => acc + item.price * item.qty,
//         0
//       );

//       await addDoc(collection(db, "services"), {
//         customerName: form.customerName,

//         phone: form.phone,

//         plate: form.plate,

//         unit: form.unit,

//         complaint: form.complaint,

//         mechanicId: form.mechanicId,

//         services: selectedServices,

//         totalCost,

//         status: "booked",

//         bookingAt: form.bookingDate,

//         createdAt: serverTimestamp(),
//       });

//       alert("Booking berhasil dibuat");

//       nav("/");
//     } catch (error) {
//       console.log(error);
//       alert("Gagal membuat booking");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#EAF6FD] p-4 md:p-8">
//       <div className="max-w-4xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm overflow-hidden">
//         {/* HEADER */}

//         <div className="bg-[#0070B2] px-6 py-5 text-white">
//           <h1 className="text-3xl font-bold">🔧 Booking Service</h1>

//           <p className="text-sm text-blue-100 mt-1">
//             Booking service kendaraan tanpa login
//           </p>
//         </div>

//         {/* FORM */}

//         <form onSubmit={handleSubmit} className="p-6 space-y-8">
//           {/* CUSTOMER */}

//           <div>
//             <h2 className="text-xl font-bold text-[#0070B2] mb-4">
//               Customer Information
//             </h2>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm text-slate-600 mb-1">
//                   Nama Customer
//                 </label>

//                 <input
//                   required
//                   type="text"
//                   value={form.customerName}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       customerName: e.target.value,
//                     })
//                   }
//                   className="w-full px-4 py-3 border border-[#CFE8F6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20"
//                   placeholder="Nama customer"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm text-slate-600 mb-1">
//                   No Telepon
//                 </label>

//                 <input
//                   required
//                   type="text"
//                   value={form.phone}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       phone: e.target.value,
//                     })
//                   }
//                   className="w-full px-4 py-3 border border-[#CFE8F6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20"
//                   placeholder="08xxxxxxxxxx"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* VEHICLE */}

//           <div>
//             <h2 className="text-xl font-bold text-[#0070B2] mb-4">
//               Vehicle Information
//             </h2>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm text-slate-600 mb-1">
//                   Plat Nomor
//                 </label>

//                 <input
//                   required
//                   type="text"
//                   value={form.plate}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       plate: e.target.value.toUpperCase(),
//                     })
//                   }
//                   className="w-full uppercase px-4 py-3 border border-[#CFE8F6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20"
//                   placeholder="B 1234 XYZ"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm text-slate-600 mb-1">
//                   Kendaraan
//                 </label>

//                 <input
//                   required
//                   type="text"
//                   value={form.unit}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       unit: e.target.value,
//                     })
//                   }
//                   className="w-full px-4 py-3 border border-[#CFE8F6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20"
//                   placeholder="Honda Beat / Supra X"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* BOOKING */}

//           <div>
//             <h2 className="text-xl font-bold text-[#0070B2] mb-4">
//               Booking Information
//             </h2>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm text-slate-600 mb-1">
//                   Tanggal Booking
//                 </label>

//                 <input
//                   required
//                   type="date"
//                   value={form.bookingDate}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       bookingDate: e.target.value,
//                     })
//                   }
//                   className="w-full px-4 py-3 border border-[#CFE8F6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm text-slate-600 mb-1">
//                   Pilih Mechanic
//                 </label>

//                 <select
//                   required
//                   value={form.mechanicId}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       mechanicId: e.target.value,
//                     })
//                   }
//                   className="w-full px-4 py-3 border border-[#CFE8F6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20 bg-white"
//                 >
//                   <option value="">Pilih mechanic</option>

//                   {mechanics.map((m) => (
//                     <option key={m.id} value={m.id}>
//                       {m.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* COMPLAINT */}

//           <div>
//             <label className="block text-sm text-slate-600 mb-1">Keluhan</label>

//             <textarea
//               rows={4}
//               value={form.complaint}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   complaint: e.target.value,
//                 })
//               }
//               className="w-full px-4 py-3 border border-[#CFE8F6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0070B2]/20 resize-none"
//               placeholder="Motor susah hidup, rem bunyi, dll"
//             />
//           </div>

//           {/* SERVICES */}

//           <div>
//             <h2 className="text-xl font-bold text-[#0070B2] mb-4">
//               Pilih Jasa
//             </h2>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//               {services.map((service) => (
//                 <button
//                   type="button"
//                   key={service.id}
//                   onClick={() => addService(service)}
//                   className="border border-[#CFE8F6] rounded-2xl p-4 text-left hover:bg-[#F8FBFD] transition"
//                 >
//                   <div className="font-semibold text-slate-700">
//                     {service.name}
//                   </div>

//                   <div className="text-sm text-[#0070B2] mt-1">
//                     Rp {service.price?.toLocaleString("id-ID")}
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* SELECTED */}

//           <div>
//             <h2 className="text-xl font-bold text-[#0070B2] mb-4">
//               Selected Services
//             </h2>

//             {selectedServices.length === 0 ? (
//               <div className="text-slate-400 border border-dashed border-[#CFE8F6] rounded-2xl p-6 text-center">
//                 Belum ada jasa dipilih
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {selectedServices.map((item) => (
//                   <div
//                     key={item.id}
//                     className="flex items-center justify-between border border-[#CFE8F6] rounded-2xl p-4"
//                   >
//                     <div>
//                       <div className="font-medium text-slate-700">
//                         {item.name}
//                       </div>

//                       <div className="text-sm text-[#0070B2]">
//                         Rp {item.price?.toLocaleString("id-ID")}
//                       </div>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() => removeService(item.id)}
//                       className="text-red-500 hover:text-red-600"
//                     >
//                       Remove
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* TOTAL */}

//           <div className="bg-[#F8FBFD] border border-[#CFE8F6] rounded-2xl p-5 flex items-center justify-between">
//             <div>
//               <div className="text-sm text-slate-500">Estimated Total</div>

//               <div className="text-3xl font-bold text-[#0070B2]">
//                 Rp
//                 {selectedServices
//                   .reduce((acc, item) => acc + item.price * item.qty, 0)
//                   .toLocaleString("id-ID")}
//               </div>
//             </div>
//           </div>

//           {/* ACTION */}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-[#0070B2] hover:bg-[#005f96] disabled:opacity-50 text-white py-4 rounded-2xl font-semibold transition"
//           >
//             {loading ? "Saving..." : "Book Service"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default BookingService;
