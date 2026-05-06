import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function SparepartName({ partId }: { partId: string }) {
  const [name, setName] = useState<string>("...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partId) return;

    const fetchPart = async () => {
      try {
        const ref = doc(db, "spareparts", partId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setName(snap.data().name || "-");
        } else {
          setName("Not found");
        }
      } catch (err) {
        console.error("Error fetch sparepart:", err);
        setName("Error");
      } finally {
        setLoading(false);
      }
    };

    fetchPart();
  }, [partId]);

  if (loading) return <span className="text-gray-400">...</span>;

  return <span>{name}</span>;
}
