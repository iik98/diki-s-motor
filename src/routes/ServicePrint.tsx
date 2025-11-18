import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import { ServiceItem, ServiceOrder } from "@/types";

export default function PrintService() {
  const { id } = useParams();
  const [service, setService] = useState<ServiceOrder | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [printMode, setPrintMode] = useState<"a4" | "receipt">("a4");

  // Fetch data
  useEffect(() => {
    async function load() {
      if (!id) return;

      const ref = doc(db, "services", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setService({
          ...(snap.data() as ServiceOrder),
          id: snap.id,
        });
      }

      const itemsSnap = await getDocs(collection(ref, "items"));
      setItems(
        itemsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as ServiceItem),
        }))
      );
    }
    load();
  }, [id]);

  // Auto print after mode changes & service loaded
  useEffect(() => {
    if (service) {
      setTimeout(() => window.print(), 300);
    }
  }, [printMode, service]);

  if (!service) return <div>Loading...</div>;

  return (
    <>
      {/* Print Container */}
      <div className={printMode === "receipt" ? "receipt-paper" : "a4-paper"}>
        <h2 className="text-center font-bold text-lg">Service Receipt</h2>

        <p>ID: {service.id}</p>
        <p>Customer: {service.customerId}</p>
        <p>Unit: {service.unitId}</p>
        <p>Mechanic: {service.mechanicId}</p>
        <p>Labor Cost: Rp {service.laborCost}</p>

        <hr className="my-3" />

        <h3 className="font-semibold mb-2">Parts</h3>
        {items.map((it) => (
          <div className="flex justify-between" key={it.id}>
            <span>{it.partId}</span>
            <span>
              {it.qty} × Rp {it.price}
            </span>
          </div>
        ))}

        <hr className="my-3" />

        <h2 className="text-right font-bold text-xl">
          Total: Rp {service.totalCost}
        </h2>

        <p className="text-center mt-6">Thank you!</p>
      </div>

      {/* Buttons (hidden in print mode) */}
      <div className="no-print flex justify-center gap-3 mt-4">
        <button
          onClick={() => setPrintMode("a4")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Print A4
        </button>

        <button
          onClick={() => setPrintMode("receipt")}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Print Receipt
        </button>
      </div>

      {/* Styles */}
      <style>{`
        @media print {
          .no-print { display: none; }
        }

        /* A4 MODE */
        .a4-paper {
          width: 100%;
          max-width: 800px;
          margin: auto;
          padding: 40px;
          background: white;
          color: black;
          font-family: monospace;
        }

        /* RECEIPT MODE (58mm) */
        .receipt-paper {
          width: 58mm;
          padding: 10px;
          font-size: 12px;
          background: white;
          color: black;
          font-family: monospace;
          margin: auto;
        }

        @media print {
          .receipt-paper {
            width: 58mm !important;
            margin: 0;
            padding: 0;
          }
          .a4-paper {
            width: 100% !important;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}
