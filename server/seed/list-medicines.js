const { initializeFirebase, getDb } = require("../config/firebase");
require("dotenv").config();

initializeFirebase();
const db = getDb();

async function listMedicines() {
  console.log("📋 Перелік ліків у базі даних:\n");
  
  try {
    const snapshot = await db.collection("medicines").get();
    
    if (snapshot.empty) {
      console.log("❌ База даних порожня");
      return;
    }

    snapshot.forEach((doc, index) => {
      const medicine = doc.data();
      console.log(`${index + 1}. ${medicine.name} (ID: ${doc.id})`);
      console.log(`   Категорія: ${medicine.category}`);
      console.log(`   Інструкція: ${medicine.instructionUrl || "немає"}\n`);
    });
    
    console.log(`\nВсього ліків: ${snapshot.size}`);
  } catch (error) {
    console.error("❌ Помилка:", error);
  } finally {
    process.exit(0);
  }
}

listMedicines();
