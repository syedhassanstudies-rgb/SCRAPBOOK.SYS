import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc } from 'firebase/firestore';

const app = initializeApp({ projectId: "demo-test" });
const db = getFirestore(app);

async function run() {
  const ref = doc(db, 'users', 'test', 'pieces', 'test-id');
  try {
    await updateDoc(ref, { "style.y": undefined });
  } catch (e: any) {
    console.error("Test undefined:", e.message);
  }
  try {
    await updateDoc(ref, {});
  } catch (e: any) {
    console.error("Test empty:", e.message);
  }
}

run();
