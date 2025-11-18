import { db } from '../firebase';
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function createServiceOrderWithItems(service: any, items: any[]) {
  const servicesCol = collection(db, 'services');
  const serviceDocRef = doc(servicesCol);

  await runTransaction(db, async (tx) => {
    tx.set(serviceDocRef, { ...service, createdAt: serverTimestamp(), status: 'open', totalCost: 0 });

    let partsTotal = 0;
    for (const item of items) {
      const partRef = doc(db, 'spareparts', item.partId);
      const partSnap = await tx.get(partRef);
      if (!partSnap.exists()) throw new Error(`Part ${item.partId} not found`);
      const partData = partSnap.data() as any;
      const currentStock = partData.stock || 0;
      if (currentStock < item.qty) throw new Error(`Not enough stock for ${partData.name}`);

      tx.update(partRef, { stock: currentStock - item.qty });

      const itemsCol = collection(serviceDocRef, 'items');
      const itemRef = doc(itemsCol);
      tx.set(itemRef, { partId: item.partId, qty: item.qty, price: item.price });

      partsTotal += item.qty * item.price;
    }

    const totalCost = partsTotal + (service.laborCost || 0);
    tx.update(serviceDocRef, { totalCost });
  });
}
