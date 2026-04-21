import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { ServiceOrder } from "@/types";
import { IoIosCheckbox } from "react-icons/io";

interface EnrichedService extends ServiceOrder {
  customerName: string;
  mechanicName: string;
  unitPlate: string;
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<EnrichedService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "services"), async (snapshot) => {
      try {
        const serviceList: ServiceOrder[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            customerId: data.customerId,
            mechanicId: data.mechanicId,
            unitId: data.unitId,
            status: data.status || "open",
            laborCost: data.laborCost || 0,
            totalCost: data.totalCost || 0,
            createdAt: data.createdAt
              ? new Date(data.createdAt.seconds * 1000).toLocaleString("id-ID")
              : "-",
          };
        });

        // Fetch related documents in parallel
        const enriched: EnrichedService[] = await Promise.all(
          serviceList.map(async (service) => {
            const [customerDoc, mechanicDoc, unitDoc] = await Promise.all([
              getDoc(doc(db, "customers", service.customerId)),
              getDoc(doc(db, "mechanics", service.mechanicId)),
              getDoc(doc(db, "units", service.unitId)),
            ]);

            const customerName = customerDoc.exists()
              ? customerDoc.data()?.name || "-"
              : "-";
            const mechanicName = mechanicDoc.exists()
              ? mechanicDoc.data()?.name || "-"
              : "-";
            const unitPlate = unitDoc.exists()
              ? unitDoc.data()?.plate || "-"
              : "-";

            return {
              ...service,
              customerName,
              mechanicName,
              unitPlate,
            };
          })
        );

        setServices(enriched);
      } catch (error) {
        console.error("Error fetching realtime services:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub(); // Cleanup listener on unmount
  }, []);

  //   update status
  const markServiceCompleted = async (serviceId: string) => {
    try {
      const ref = doc(db, "services", serviceId);

      await updateDoc(ref, {
        status: "completed",
        completedAt: serverTimestamp(), // optional
      });

      console.log("Service updated to completed");
      return true;
    } catch (error) {
      console.error("Failed to update service:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
          🧾 Service Order List
        </h2>

        <div className="bg-gray-900/60 border border-cyan-700/50 rounded-xl shadow-md shadow-cyan-700/30 backdrop-blur-md overflow-x-auto">
          {loading ? (
            <div className="text-center py-6 text-cyan-400">Loading...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              No service orders found.
            </div>
          ) : (
            <table className="min-w-full text-sm md:text-base">
              <thead className="bg-cyan-800/30 text-cyan-300 uppercase text-xs md:text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Mechanic</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Labor Cost</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-cyan-800/30 hover:bg-cyan-900/20 transition-colors"
                  >
                    <td className="px-4 py-3">{s.customerName}</td>
                    <td className="px-4 py-3">{s.unitPlate}</td>
                    <td className="px-4 py-3">{s.mechanicName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          s.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {s.status}
                      </span>
                      {s.status === "open" && (
                        <button
                          onClick={() => markServiceCompleted(s.id)}
                          className="px-1 py-1 ml-2  text-green-400 rounded hover:bg-green-900/50 transition"
                        >
                          <IoIosCheckbox size={16} color="green" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      Rp {s.laborCost.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      Rp {s.totalCost.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">{s.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceList;
