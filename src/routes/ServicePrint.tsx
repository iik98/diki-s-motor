import { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import { ServiceItem, ServiceOrder } from "@/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PrintService() {
  const { id } = useParams();

  const [service, setService] = useState<ServiceOrder | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [printMode, setPrintMode] = useState<"a4" | "receipt">("a4");

  const [customers, setCustomers] = useState<Record<string, any>>({});
  const [units, setUnits] = useState<Record<string, any>>({});
  const [mechanics, setMechanics] = useState<Record<string, any>>({});
  const [parts, setParts] = useState<Record<string, any>>({});

  const printRef = useRef<HTMLDivElement>(null);

  /* ================= LOAD DATA ================= */
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
      const list = itemsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as ServiceItem),
      }));

      setItems(list);

      const [custSnap, unitSnap, mechSnap, partSnap] = await Promise.all([
        getDocs(collection(db, "customers")),
        getDocs(collection(db, "units")),
        getDocs(collection(db, "mechanics")),
        getDocs(collection(db, "spareparts")),
      ]);

      const mapDocs = (snap: any) =>
        Object.fromEntries(snap.docs.map((d: any) => [d.id, d.data()]));

      setCustomers(mapDocs(custSnap));
      setUnits(mapDocs(unitSnap));
      setMechanics(mapDocs(mechSnap));
      setParts(mapDocs(partSnap));
    }

    load();
  }, [id]);

  if (!service) return <div>Loading...</div>;

  /* ================= HELPERS ================= */
  const getName = (map: any, id?: string) =>
    map?.[id || ""]?.name || map?.[id || ""]?.model || id || "-";

  /* ================= GENERATE PDF ================= */
  const handleGeneratePDF = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf =
        printMode === "receipt"
          ? new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: [58, canvas.height * 0.264],
            })
          : new jsPDF("p", "mm", "a4");

      if (printMode === "receipt") {
        pdf.addImage(imgData, "PNG", 0, 0, 58, canvas.height * 0.264);
      } else {
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      // buka tab baru
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      const newWindow = window.open(url, "_blank");

      // fallback kalau diblok
      if (!newWindow) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `service-${service.id}.pdf`;
        link.click();
      }
    } catch (err) {
      console.error("PDF error:", err);
      alert("Gagal generate PDF");
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <div
        ref={printRef}
        className={printMode === "receipt" ? "receipt-paper" : "a4-paper"}
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        <h2
          style={{ textAlign: "center", fontWeight: "bold", marginBottom: 10 }}
        >
          Service Receipt
        </h2>
        <div style={{ textAlign: "center" }}>
          <img
            src="/logo.png" // ganti sesuai path kamu
            alt="logo"
            style={{
              width: 250,
              margin: "0 auto",
              display: "block",
            }}
          />
        </div>
        <p>ID: {service.id}</p>
        <p>Customer: {getName(customers, service.customerId)}</p>
        <p>Unit: {getName(units, service.unitId)}</p>
        <p>Mechanic: {getName(mechanics, service.mechanicId)}</p>
        <p>Labor Cost: Rp {service.laborCost}</p>

        <hr style={{ marginTop: 10 }} />

        <h3>Parts</h3>

        {items.map((it) => (
          <div
            key={it.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: printMode === "receipt" ? 12 : 14,
            }}
          >
            <span>{getName(parts, it.partId)}</span>
            <span>
              {it.qty} × Rp {it.price}
            </span>
          </div>
        ))}

        <hr style={{ marginTop: 10 }} />

        <h2 style={{ textAlign: "right" }}>Total: Rp {service.totalCost}</h2>

        <p style={{ textAlign: "center", marginTop: 20 }}>Thank you!</p>
      </div>

      {/* BUTTONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginTop: 20,
        }}
      >
        {/* <button onClick={() => setPrintMode("a4")}>A4 Mode</button>
        <button onClick={() => setPrintMode("receipt")}>Receipt Mode</button> */}
        <button className="button" onClick={handleGeneratePDF}>
          Save PDF
        </button>
      </div>

      <style>{`
        body {
          background: #f5f5f5;
        }

        .a4-paper {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          padding: 20mm;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: monospace;
        }

        .receipt-paper {
          width: 58mm;
          margin: 20px auto;
          padding: 10px;
          font-size: 12px;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: monospace;
        }
      `}</style>
    </>
  );
}
