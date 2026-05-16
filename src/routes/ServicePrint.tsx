import { useEffect, useState, useRef } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import { ServiceItem, ServiceOrder } from "@/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";

function formatToDate(date?: Date | string | number): string {
  return format(date ? new Date(date) : new Date(), "dd/MM/yyyy HH:mm");
}

export default function PrintService() {
  const { id } = useParams();

  const [service, setService] = useState<ServiceOrder | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [printMode] = useState<"a4" | "receipt">("a4");
  const [isPrinting, setIsPrinting] = useState(false);

  const [customer, setCustomer] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);
  const [mechanic, setMechanic] = useState<any>(null);
  const [mechanics, setMechanics] = useState<any[]>([]);

  const [parts, setParts] = useState<Record<string, any>>({});
  const [allParts, setAllParts] = useState<any[]>([]);
  const [allJasa, setAllJasa] = useState<any>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // change service
  const handleChangeService = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setService((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const q = collection(db, "mechanics");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMechanics(list);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collection(db, "spareparts");

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filterPart = list.filter((p: any) => p?.category === "sparepart");
        setAllParts(filterPart);
        const filterJasa = list.filter((p: any) => p?.category === "jasa");
        setAllJasa(filterJasa);
      },
      (error) => {
        console.error("Error fetching spareparts:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;

      // ===== service =====
      const ref = doc(db, "services", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const serviceData = {
        ...(snap.data() as ServiceOrder),
        id: snap.id,
      };

      setService(serviceData);

      // ===== items =====
      const itemsSnap = await getDocs(collection(ref, "items"));
      const list = itemsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as ServiceItem),
      }));
      setItems(list);

      // ===== fetch related (ONLY BY ID) =====
      const [customerSnap, unitSnap, mechanicSnap] = await Promise.all([
        serviceData.customerId
          ? getDoc(doc(db, "customers", serviceData.customerId))
          : null,
        serviceData.unitId
          ? getDoc(doc(db, "units", serviceData.unitId))
          : null,
        serviceData.mechanicId
          ? getDoc(doc(db, "mechanics", serviceData.mechanicId))
          : null,
      ]);

      setCustomer(customerSnap?.data() || null);
      setUnit(unitSnap?.data() || null);
      setMechanic(mechanicSnap?.data() || null);

      // ===== parts (ONLY USED ONES) =====
      const partIds = [...new Set(list.map((i) => i.partId))];

      const partDocs = await Promise.all(
        partIds.map((pid) => getDoc(doc(db, "spareparts", pid)))
      );

      const partMap: Record<string, any> = {};
      partDocs.forEach((p, i) => {
        if (p.exists()) {
          partMap[partIds[i]] = p.data();
        }
      });

      setParts(partMap);
    }

    load();
  }, [id]);
  const [jasaItems, setJasaItems] = useState<any[]>([]);
  const [partItems, setPartItems] = useState<any[]>([]);

  const handleAddJasa = () => {
    setJasaItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "", // ✅ wajib ada
        qty: 1,
        price: 0,
        isNew: true,
      },
    ]);
  };

  const handleAddPart = () => {
    setPartItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        partId: "",
        qty: 1,
        price: 0,
        discount: 0,
        isNew: true,
      },
    ]);
  };

  const handleChange = (
    type: "jasa" | "part",
    id: string,
    field: string,
    value: any
  ) => {
    const setter = type === "jasa" ? setJasaItems : setPartItems;

    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDelete = (type: "jasa" | "part", id: string) => {
    const setter = type === "jasa" ? setJasaItems : setPartItems;

    setter((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (!items.length) return;

    const jasa = items.filter((it) => {
      const part = parts[it.partId];
      return part?.category === "jasa" || it.partId === "manual-jasa";
    });

    const part = items.filter((it) => {
      const partData = parts[it.partId];
      return partData?.category !== "jasa" && it.partId !== "manual-jasa";
    });

    setJasaItems(jasa);
    setPartItems(part);
  }, [items, parts]);

  const totalSparepart = partItems.reduce((sum, it) => {
    return sum + it.qty * it.price;
  }, 0);
  const totalDiscountSparepart = partItems.reduce((sum, it) => {
    const subtotal = it.qty * it.price;
    const discount = it.discount || 0;
    const discountAmount = subtotal * (discount / 100);
    return sum + discountAmount;
  }, 0);
  const totalDiscountJasa = jasaItems.reduce((sum, it) => {
    const subtotal = it.qty * it.price;
    const discount = it.discount || 0;
    const discountAmount = subtotal * (discount / 100);
    return sum + discountAmount;
  }, 0);

  const totalJasa = jasaItems.reduce((sum, it) => {
    return sum + it.qty * it.price;
  }, 0);

  const grandTotal = totalSparepart + totalJasa - totalDiscountJasa - totalDiscountSparepart;

  const handleSaveToFirestore = async () => {
    if (!service?.id) return;

    try {
      const serviceRef = doc(db, "services", service.id);

      // ===== UPDATE SERVICE =====
      await updateDoc(serviceRef, {
        ...service,
        totalCost: grandTotal,
        totalSparepart: totalSparepart,
        totalJasa: totalJasa,
        totalDiscountJasa: totalDiscountJasa,
        // updatedAt: new Date(),
      });

      // ===== DELETE OLD ITEMS =====
      const itemsRef = collection(serviceRef, "items");
      const oldItemsSnap = await getDocs(itemsRef);

      const deletePromises = oldItemsSnap.docs.map((d) =>
        deleteDoc(doc(itemsRef, d.id))
      );

      await Promise.all(deletePromises);

      // ===== SAVE NEW ITEMS (JASA + PART) =====
      const resolvedJasaItems = await Promise.all(
        jasaItems.map(async (it) => {
          let partId = it.partId || it.jasaId;

          if (partId === "manual" || partId === "manual-jasa") {
            const newDocRef = await addDoc(collection(db, "spareparts"), {
              name: it.name || "Manual Jasa",
              price: it.price,
              category: "jasa",
              stock: 0,
              lowStockThreshold: 0,
              sku: "",
            });
            partId = newDocRef.id;
          }

          return {
            partId: partId,
            qty: it.qty,
            price: it.price,
            discount: it.discount || 0,
          };
        })
      );

      const allItems = [
        ...resolvedJasaItems,
        ...partItems.map((it) => ({
          partId: it.partId,
          qty: it.qty,
          price: it.price,
          discount: it.discount || 0,
        })),
      ];

      const addPromises = allItems.map((item) => addDoc(itemsRef, item));

      await Promise.all(addPromises);

      console.log("✅ Saved to Firestore");
    } catch (err) {
      console.error("❌ Error saving:", err);
      alert("Gagal save ke Firestore");
      throw err;
    }
  };

  console.log(service);
  const thStyle = {
    border: "1px solid #000",
    padding: "6px",
    // fontSize: "12px",
    textAlign: "left",
  };

  const tdStyle = {
    border: "1px solid #000",
    padding: "6px",
    // fontSize: "12px",
  };
  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    // fontSize: "12px",
  };

  if (!service) return <div>Loading...</div>;

  /* ================= GENERATE PDF ================= */
  const handleGeneratePDF = async () => {
    if (!printRef.current) return;

    setIsPrinting(true);
    await new Promise((res) => setTimeout(res, 200));

    try {
      await handleSaveToFirestore();

      const canvas = await html2canvas(printRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg");

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // height fleksibel
      const pdf = new jsPDF("p", "mm", [imgWidth, imgHeight]);

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      // 🔥 langsung download
      pdf.save(`service-${service?.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal generate PDF");
    } finally {
      setIsPrinting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-2">
      <div className="max-w-6xl mx-auto bg-white border border-[#CFE8F6] rounded-3xl shadow-sm p-8">
        <div
          ref={printRef}
          className="a4-paper"
          style={{ background: "#fff", color: "#000" }}
        >
          <h2 style={{ textAlign: "center", marginBottom: 10 }}>
            Service Receipt
          </h2>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src="/logo.png"
              alt="logo"
              style={{ width: 350, marginBottom: 10 }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              // fontSize: 20,
            }}
          >
            {/* left */}
            <div>
              <p>ID: {service.id}</p>
              <p>Nama Customer: {customer?.name || "-"}</p>
              <p>No hp Customer: {customer?.telepon || "-"}</p>
              <p>
                Unit:
                {`${unit?.make} ${unit?.model} (${unit?.plate})` ||
                  unit?.model ||
                  "-"}
              </p>
              <p>
                Mechanic:{" "}
                {mechanic?.name && isPrinting ? (
                  mechanic?.name
                ) : (
                  <select

                    name="mechanicId"
                    value={service?.mechanicId || ""}
                    onChange={(e) => {
                      const selectedMech = mechanics.find(
                        (m) => m.id === e.target.value
                      );
                      setService((prev) =>
                        prev ? { ...prev, mechanicId: e.target.value } : prev
                      );
                      setMechanic(selectedMech);
                    }}
                  >
                    <option value="" disabled>
                      Pilih Mechanic
                    </option>

                    {mechanics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </p>
            </div>
            {/* right */}
            <div>
              <p>Date: {formatToDate(service.createdAt?.toDate?.())}</p>
              <p>Alamat Bengkel: Jl sblaska</p>
            </div>
          </div>
          <br />
          <hr />
          <br />
          {/* ================= JASA ================= */}
          <h3>Service</h3>
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}
          >
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama Jasa</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Harga</th>
                <th style={thStyle}>Disc</th>
                <th style={thStyle}>Total</th>
                {!isPrinting && <th style={thStyle}></th>}
              </tr>
            </thead>
            <tbody>
              {jasaItems.map((it, index) => {
                const part = parts[it.partId];

                const subtotal = it.qty * it.price;
                const discount = it.discount || 0;
                const discountAmount = subtotal * (discount / 100);
                const finalTotal = subtotal - discountAmount;

                return (
                  <tr key={it.id}>
                    <td style={tdStyle}>{index + 1}</td>

                    {/* NAMA */}
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        width: 100,
                      }}
                    >
                      {it.isNew && !isPrinting ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <select
                            value={it.jasaId || it.partId || ""}
                            onChange={(e) => {
                              if (e.target.value === "manual") {
                                handleChange("jasa", it.id, "jasaId", "manual");
                                handleChange("jasa", it.id, "name", "");
                                handleChange("jasa", it.id, "price", 0);
                              } else {
                                const selectedPart = allJasa.find(
                                  (p: { id: string }) => p.id === e.target.value
                                );

                                handleChange(
                                  "jasa",
                                  it.id,
                                  "jasaId",
                                  e.target.value
                                );
                                handleChange(
                                  "jasa",
                                  it.id,
                                  "price",
                                  selectedPart?.price || 0
                                );
                                handleChange(
                                  "jasa",
                                  it.id,
                                  "name",
                                  selectedPart?.name || ""
                                );
                              }
                            }}
                          >
                            <option hidden>Pilih Jasa</option>
                            <option value="manual">-- Input Manual --</option>
                            {allJasa.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          {(it.jasaId === "manual" || it.partId === "manual-jasa") && (
                            <input
                              type="text"
                              placeholder="Nama Jasa Manual"
                              value={it.name || ""}
                              onChange={(e) => handleChange("jasa", it.id, "name", e.target.value)}
                              style={{ width: "100%", padding: "4px" }}
                            />
                          )}
                        </div>
                      ) : (
                        part?.name || it.name || "-"
                      )}
                    </td>

                    {/* QTY */}
                    <td style={tdStyle}>
                      {it.isNew && !isPrinting ? (
                        <input
                          type="number"
                          value={it.qty}
                          onChange={(e) =>
                            handleChange(
                              "jasa",
                              it.id,
                              "qty",
                              Number(e.target.value)
                            )
                          }
                          style={{ width: 60 }}
                        />
                      ) : (
                        it.qty
                      )}
                    </td>

                    {/* HARGA */}
                    <td style={tdStyle}>
                      {it.isNew && !isPrinting ? (
                        <input
                          type="number"
                          value={it.price}
                          onChange={(e) =>
                            handleChange(
                              "jasa",
                              it.id,
                              "price",
                              Number(e.target.value)
                            )
                          }
                          style={{ width: 100 }}
                        />
                      ) : (
                        `Rp ${it.price.toLocaleString("id-ID")}`
                      )}
                    </td>

                    {/* DISCOUNT */}
                    <td style={tdStyle}>
                      {it.isNew && !isPrinting ? (
                        <div style={{ display: "flex" }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={it.discount || 0}
                            onChange={(e) =>
                              handleChange(
                                "jasa",
                                it.id,
                                "discount",
                                Number(e.target.value)
                              )
                            }
                            style={{ width: 60 }}
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        `${discount}%`
                      )}
                    </td>

                    {/* TOTAL SETELAH DISCOUNT */}
                    <td style={tdStyle}>
                      Rp {finalTotal.toLocaleString("id-ID")}
                    </td>

                    {!isPrinting && (
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleDelete("jasa", it.id)}
                          style={{
                            color: "red",
                            cursor: "pointer",
                            border: "none",
                            background: "transparent",
                            fontWeight: "bold",
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isPrinting && (
            <button
              onClick={handleAddJasa}
              style={{
                marginTop: 10,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              + Tambah Service
            </button>
          )}

          <br />

          {/* ================= PARTS ================= */}
          <h3>Parts</h3>
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}
          >
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama Item</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Harga</th>
                <th style={thStyle}>Disc</th>
                <th style={thStyle}>Total</th>
                {!isPrinting && <th style={thStyle}></th>}
              </tr>
            </thead>

            <tbody>
              {partItems.map((it, index) => {
                const part = parts[it.partId];

                return (
                  <tr key={it.id}>
                    {/* NO */}
                    <td style={tdStyle}>{index + 1}</td>

                    {/* NAMA ITEM (DROPDOWN) */}
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        width: 180,
                      }}
                    >
                      {it.isNew && !isPrinting ? (
                        <select
                          style={{
                            // width: 180
                          }}
                          value={it.partId || ""}
                          onChange={(e) => {
                            const selectedPart = allParts.find(
                              (p) => p.id === e.target.value
                            );

                            handleChange(
                              "part",
                              it.id,
                              "partId",
                              e.target.value
                            );
                            handleChange(
                              "part",
                              it.id,
                              "price",
                              selectedPart?.price || 0
                            );
                            handleChange(
                              "part",
                              it.id,
                              "name",
                              selectedPart?.name || ""
                            );
                          }}
                        >
                          <option selected hidden>
                            Pilih Part
                          </option>

                          {allParts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        part?.name || it.name || "-"
                      )}
                    </td>

                    {/* QTY */}
                    <td style={tdStyle}>
                      {it.isNew && !isPrinting ? (
                        <input
                          type="number"
                          value={it.qty ?? 1}
                          min={1}
                          onChange={(e) =>
                            handleChange(
                              "part",
                              it.id,
                              "qty",
                              Number(e.target.value)
                            )
                          }
                          style={{ width: 60 }}
                        />
                      ) : (
                        it.qty
                      )}
                    </td>

                    {/* HARGA */}
                    <td style={tdStyle}>
                      Rp {(it.price || 0).toLocaleString("id-ID")}
                    </td>

                    {/* DISCOUNT */}
                    <td style={tdStyle}>
                      {it.isNew && !isPrinting ? (
                        <div style={{ display: "flex" }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={it.discount || 0}
                            onChange={(e) =>
                              handleChange(
                                "part",
                                it.id,
                                "discount",
                                Number(e.target.value)
                              )
                            }
                            style={{ width: 60 }}
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        `${it.discount || 0}%`
                      )}
                    </td>

                    {/* TOTAL */}
                    <td style={tdStyle}>
                      Rp {((it.qty * it.price) - (it.qty * it.price * (it.discount || 0) / 100)).toLocaleString("id-ID")}
                    </td>
                    {!isPrinting && (
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleDelete("part", it.id)}
                          style={{
                            color: "red",
                            cursor: "pointer",
                            border: "none",
                            background: "transparent",
                            fontWeight: "bold",
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isPrinting && (
            <button
              onClick={handleAddPart}
              style={{
                marginTop: 10,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              + Tambah Part
            </button>
          )}

          <hr />

          <div style={{ marginTop: 20 }}>
            <div style={rowStyle}>
              <span>Total Sparepart</span>
              <span>Rp {totalSparepart.toLocaleString("id-ID")}</span>
            </div>

            <div style={rowStyle}>
              <span>Total Jasa</span>
              <span>Rp {totalJasa.toLocaleString("id-ID")}</span>
            </div>
            <div style={rowStyle}>
              <span>Total Discount</span>
              <span>- Rp {(totalDiscountJasa + totalDiscountSparepart).toLocaleString("id-ID")}</span>
            </div>

            <div
              style={{
                ...rowStyle,
                fontWeight: "bold",
                borderTop: "1px solid #000",
                marginTop: 6,
                paddingTop: 6,
              }}
            >
              <span>Grand Total</span>
              <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <br />
          <p>
            Catatan:{" "}
            {service.note && isPrinting ? (
              service?.note
            ) : (
              <input
                className="input"
                name="note"
                value={service?.note || ""}
                onChange={handleChangeService}
              />
            )}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 60,
            }}
          >
            {/* KIRI - KONSUMEN */}
            <div style={{ textAlign: "center", width: "45%" }}>
              <p>Konsumen</p>

              <div
                style={{
                  height: 80,
                }}
              />

              <p style={{ borderTop: "1px solid #000", paddingTop: 4 }}>
                {customer?.name || "Konsumen"}
              </p>
            </div>

            {/* KANAN - MEKANIK */}
            <div style={{ textAlign: "center", width: "45%" }}>
              <p>Mechanic</p>

              <div
                style={{
                  height: 80,
                }}
              />

              <p style={{ borderTop: "1px solid #000", paddingTop: 4 }}>
                {mechanic?.name || "Mechanic"}
              </p>
            </div>
          </div>

          <p style={{ textAlign: "center", marginTop: 20 }}>Thank you!</p>
        </div>

        {/* BUTTON */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            className="
          bg-[#0070B2]
          hover:bg-[#005f96]
          text-white
          px-5 py-2.5
          rounded-xl
          transition
          shadow-sm
        "
            disabled={isPrinting}
            onClick={handleGeneratePDF}
          >
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
          padding: 10mm;
          background: white;
          font-family: monospace;
          font-size:25px;
        }
      `}</style>
      </div>
    </div>
  );
}
