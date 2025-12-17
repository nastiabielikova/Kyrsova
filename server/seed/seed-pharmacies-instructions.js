const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Використовуємо ту ж ініціалізацію, що і в основному проекті
const { initializeFirebase, getDb } = require("../config/firebase");

// Ініціалізуємо Firebase
initializeFirebase();
const db = getDb();

// Дані аптек
const pharmacies = [
  {
    name: "Аптека №1 - Центральна",
    city: "Київ",
    address: "вул. Хрещатик, 15",
    phone: "+380 44 123 4567",
    email: "pharmacy1@example.com",
    workingHours: "8:00 - 22:00",
    description: "Центральна аптека з широким асортиментом медикаментів та консультацією фармацевтів",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Аптека №2 - Лівобережна",
    city: "Київ",
    address: "вул. Лісна, 42",
    phone: "+380 44 234 5678",
    email: "pharmacy2@example.com",
    workingHours: "9:00 - 21:00",
    description: "Аптека на лівому березі з доступними цінами",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Аптека №3 - Швидка допомога",
    city: "Київ",
    address: "пр-т Перемоги, 88",
    phone: "+380 44 345 6789",
    email: "pharmacy3@example.com",
    workingHours: "Цілодобово",
    description: "Цілодобова аптека для екстрених випадків",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Аптека №4 - Сімейна",
    city: "Львів",
    address: "вул. Шевченка, 25",
    phone: "+380 32 456 7890",
    email: "pharmacy4@example.com",
    workingHours: "8:00 - 20:00",
    description: "Сімейна аптека з персональним підходом до кожного клієнта",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Аптека №5 - Здоров'я",
    city: "Львів",
    address: "вул. Городоцька, 156",
    phone: "+380 32 567 8901",
    email: "pharmacy5@example.com",
    workingHours: "9:00 - 21:00",
    description: "Аптека з консультацією лікарів та вимірюванням тиску",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Аптека №6 - Морська",
    city: "Одеса",
    address: "Дерибасівська вул., 10",
    phone: "+380 48 678 9012",
    email: "pharmacy6@example.com",
    workingHours: "8:00 - 22:00",
    description: "Аптека в центрі Одеси з доставкою по місту",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Аптека №7 - Медичний центр",
    city: "Харків",
    address: "вул. Сумська, 77",
    phone: "+380 57 789 0123",
    email: "pharmacy7@example.com",
    workingHours: "9:00 - 20:00",
    description: "Аптека при медичному центрі з рецептурним відділом",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Аптека №8 - Студентська",
    city: "Харків",
    address: "вул. Клочківська, 200",
    phone: "+380 57 890 1234",
    email: "pharmacy8@example.com",
    workingHours: "8:00 - 21:00",
    description: "Аптека зі знижками для студентів",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Відповідність назв ліків до інструкцій
const medicineInstructionMap = {
  "Парацетамол": "sample-paracetamol.txt",
  "Ібупрофен": "sample-ibuprofen.txt",
  "Аспірин": "sample-aspirin.txt",
};

async function seedPharmacies() {
  console.log("🏥 Додавання аптек до бази даних...");
  
  try {
    const batch = db.batch();
    let count = 0;

    for (const pharmacy of pharmacies) {
      const docRef = db.collection("pharmacies").doc();
      batch.set(docRef, pharmacy);
      count++;
    }

    await batch.commit();
    console.log(`✅ Успішно додано ${count} аптек`);
  } catch (error) {
    console.error("❌ Помилка додавання аптек:", error);
  }
}

async function addInstructionsToMedicines() {
  console.log("📄 Додавання інструкцій до ліків...");
  
  try {
    const SERVER_HOST = process.env.SERVER_HOST || "http://localhost:5000";
    const medicinesSnapshot = await db.collection("medicines").get();
    
    let count = 0;
    const batch = db.batch();

    medicinesSnapshot.forEach((doc) => {
      const medicine = doc.data();
      
      // Перевіряємо, чи містить назва ліку одне з ключових слів
      for (const [keyword, instructionFile] of Object.entries(medicineInstructionMap)) {
        if (medicine.name.includes(keyword)) {
          const instructionUrl = `${SERVER_HOST}/instructions/${instructionFile}`;
          batch.update(doc.ref, {
            instructionUrl,
            instructionFilename: instructionFile,
            updatedAt: new Date().toISOString(),
          });
          count++;
          console.log(`  📌 Додано інструкцію для: ${medicine.name}`);
          break; // Виходимо з циклу після знаходження першого співпадіння
        }
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`✅ Успішно додано інструкції до ${count} ліків`);
    } else {
      console.log("ℹ️ Не знайдено ліків для додавання інструкцій");
    }
  } catch (error) {
    console.error("❌ Помилка додавання інструкцій:", error);
  }
}

async function main() {
  console.log("🚀 Початок seed скрипту...\n");

  try {
    // Додаємо аптеки
    await seedPharmacies();
    console.log();

    // Додаємо інструкції до ліків
    await addInstructionsToMedicines();
    console.log();

    console.log("✨ Seed скрипт завершено успішно!");
  } catch (error) {
    console.error("❌ Критична помилка:", error);
  } finally {
    process.exit(0);
  }
}

// Запуск
main();
