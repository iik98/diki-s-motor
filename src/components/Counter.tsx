import { db } from "@/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
// import { db } from "./firebase";

/**
 * collection:
 * settings/serviceCounter
 *
 * struktur:
 * {
 *   current: 1
 * }
 */

export const generateServiceId = async () => {
  const counterRef = doc(db, "settings", "serviceCounter");

  try {
    const newNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      // jika belum ada
      if (!counterDoc.exists()) {
        transaction.set(counterRef, {
          current: 1,
          updatedAt: serverTimestamp(),
        });

        return 1;
      }

      const current = counterDoc.data().current || 0;

      const next = current + 1;

      transaction.update(counterRef, {
        current: next,
        updatedAt: serverTimestamp(),
      });

      return next;
    });

    // format contoh: SRV-0001
    const serviceId = `SRV-${String(newNumber).padStart(4, "0")}`;

    return serviceId;
  } catch (error) {
    console.error("Failed generate service id:", error);
    throw error;
  }
};
