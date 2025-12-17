/*
 * Скрипт заповнення тестових даних у Firestore і Firebase Auth
 * Використання:
 * 1) Налаштуйте server/.env або GOOGLE_APPLICATION_CREDENTIALS
 * 2) Запустіть:
 *    node server/seed/seed.js
 * 1) або очистити і заповнити заново:
 *    node server/seed/seed.js --force
 */

const { initializeFirebase, getDb, admin } = require("../config/firebase");
require("dotenv").config();

(async () => {
  try {
    initializeFirebase();
    const db = getDb();

    const argv = process.argv.slice(2);
    const FORCE = argv.includes("--force");
    const DOWNLOAD_IMAGES = argv.includes("--download-images");
    // Для масової заміни невідповідних/landscape/stock-зображень на локальний fallback
    const REPLACE_SCENIC =
      argv.includes("--replace-scenic") || argv.includes("--force-fallback");

    console.log("⚙️  Починаю процес seed (FORCE:", FORCE, ")");

    // Перевіримо чи Firestore доступний — іноді API може бути не ввімкненим
    let firestoreAvailable = true;
    try {
      await db.collection("medicines").limit(1).get();
    } catch (err) {
      firestoreAvailable = false;
      console.warn(
        "⚠️ Firestore недоступний або API не ввімкнено. Будуть виконані лише Auth операції.",
      );
    }

    // Функція для видалення колекції (для dev лише!)
    async function deleteCollection(collectionPath, batchSize = 500) {
      const collectionRef = db.collection(collectionPath);
      const query = collectionRef.limit(batchSize);

      return new Promise(async (resolve, reject) => {
        try {
          let deleted = 0;
          do {
            const snapshot = await query.get();
            if (snapshot.size === 0) {
              break;
            }

            const batch = db.batch();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            deleted = snapshot.size;
            // Якщо багато - loop
          } while (deleted >= batchSize);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }

    // Список seed користувачів — визначаємо до логіки FORCE (щоб можна було їх видалити)
    const seedUsers = [
      {
        email: "admin@apteka.local",
        password: "Admin123!",
        displayName: "Адміністратор",
        role: "admin",
      },
      {
        email: "ivan@apteka.local",
        password: "User12345!",
        displayName: "Іван Клієнт",
        role: "user",
      },
      {
        email: "olena@apteka.local",
        password: "User12345!",
        displayName: "Олена Клієнт",
        role: "user",
      },
    ];

    // Очистити колекції, якщо --force
    if (FORCE) {
      console.log("🧹 Очищення колекцій (FORCE)");
      // Видалення створених тестових користувачів у Firebase Auth
      console.log("🧹 Видалення тестових користувачів Auth (FORCE)");
      for (const u of seedUsers) {
        try {
          const user = await admin.auth().getUserByEmail(u.email);
          if (user) {
            await admin.auth().deleteUser(user.uid);
            console.log(
              `🗑️ Видалено Auth користувача ${u.email} (uid=${user.uid})`,
            );
          }
        } catch (e) {
          if (e.code && e.code === "auth/user-not-found") {
            // нічого не робимо -- користувач не створений
          } else {
            console.warn(
              `Помилка при видаленні користувача ${u.email}:`,
              e.message || e,
            );
          }
        }
      }
      if (firestoreAvailable) {
        console.log("🧹 Firestore доступний — очищаю колекції...");
        await deleteCollection("orders");
        await deleteCollection("medicines");
        await deleteCollection("users");
      } else {
        console.warn("Пропуск очищення Firestore — Firestore недоступний.");
      }
    }

    // Додаємо користувачів: admin та тестові користувачі (seedUsers визначені вище)

    const createdUsersMap = {};

    for (const u of seedUsers) {
      try {
        // Перевіряємо чи є користувач у Firebase Auth
        const existing = await admin.auth().getUserByEmail(u.email);
        console.log(
          `👤 Користувач ${u.email} вже існує (uid=${existing.uid}), пропускаємо створення`,
        );
        createdUsersMap[u.email] = existing.uid;
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          const userRecord = await admin.auth().createUser({
            email: u.email,
            password: u.password,
            displayName: u.displayName,
          });
          console.log(
            `➕ Створено користувача ${u.email} (uid=${userRecord.uid})`,
          );
          createdUsersMap[u.email] = userRecord.uid;
        } else {
          throw err;
        }
      }

      // Створюємо/оновлюємо Firestore профіль (лише якщо Firestore доступний)
      const uid = createdUsersMap[u.email];
      if (firestoreAvailable) {
        await db.collection("users").doc(uid).set(
          {
            email: u.email,
            displayName: u.displayName,
            role: u.role,
            phoneNumber: "",
            address: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } else {
        console.warn(
          `Пропускаю створення профілю у Firestore для ${u.email}: Firestore недоступний`,
        );
      }
    }

    // Додаємо медикаменти
    if (!firestoreAvailable) {
      console.warn("Пропуск додавання медикаментів: Firestore недоступний");
    }
    const medicines = [
      {
        name: "Парацетамол 500 мг",
        description: "Анальгетик та жарознижувальний засіб",
        price: 35.5,
        quantity: 120,
        category: "Знеболювальні",
        manufacturer: "Apteka Labs",
        expirationDate: "2026-12-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Парацетамол",
      },
      {
        name: "Аспірин 100 мг",
        description: "Профілактика тромбозів",
        price: 45.0,
        quantity: 75,
        category: "Кардіологічні",
        manufacturer: "HealthCorp",
        expirationDate: "2027-12-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Аспірин",
      },
      {
        name: "Амоксицилін 250 мг",
        description: "Антибіотик широкого спектра",
        price: 120.0,
        quantity: 40,
        category: "Антибіотики",
        manufacturer: "Antibio",
        expirationDate: "2026-06-30",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Амоксицилін",
      },
      {
        name: "Ібупрофен 200 мг",
        description: "Протизапальний та знеболювальний",
        price: 50.0,
        quantity: 100,
        category: "Знеболювальні",
        manufacturer: "MediPlus",
        expirationDate: "2025-09-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Ібупрофен",
      },
      {
        name: "Цефалексин 500 мг",
        description: "Антибіотик для інфекцій дихальних шляхів",
        price: 140.0,
        quantity: 60,
        category: "Антибіотики",
        manufacturer: "PharmaTech",
        expirationDate: "2026-03-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Цефалексин",
      },
      {
        name: "Лізиноприл 10 мг",
        description: "Гіпотензивний засіб",
        price: 220.0,
        quantity: 35,
        category: "Кардіологічні",
        manufacturer: "HeartWell",
        expirationDate: "2027-01-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Лізиноприл",
      },
      {
        name: "Аторвастатин 20 мг",
        description: "Зниження рівня холестерину",
        price: 290.0,
        quantity: 50,
        category: "Кардіологічні",
        manufacturer: "CardioRx",
        expirationDate: "2027-06-30",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Аторвастатин",
      },
      {
        name: "Омепразол 20 мг",
        description: "Проти виразки та гастриту",
        price: 95.0,
        quantity: 120,
        category: "Гастроентерологія",
        manufacturer: "GastroCare",
        expirationDate: "2026-11-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Омепразол",
      },
      {
        name: "Метформін 500 мг",
        description: "Контроль рівня глюкози при діабеті",
        price: 150.0,
        quantity: 80,
        category: "Ендокринологія",
        manufacturer: "GlucoHealth",
        expirationDate: "2027-08-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Метформін",
      },
      {
        name: "Лоперамід 2 мг",
        description: "Препарат від діареї",
        price: 30.0,
        quantity: 200,
        category: "Гастроентерологія",
        manufacturer: "FastStop",
        expirationDate: "2026-04-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Лоперамід",
      },
      {
        name: "Вітамін D3 1000 IU",
        description: "Підтримка кісток та імунітету",
        price: 99.0,
        quantity: 300,
        category: "Вітаміни",
        manufacturer: "NutriVita",
        expirationDate: "2028-12-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Вітамін+D3",
      },
      {
        name: "Вітамін C 500 мг",
        description: "Імунітет та антиоксидант",
        price: 75.0,
        quantity: 220,
        category: "Вітаміни",
        manufacturer: "NutriVita",
        expirationDate: "2028-10-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Вітамін+C",
      },
      {
        name: "Сальбутамол інгалятор 100 мкг",
        description: "Бронходилятатор при астмі",
        price: 430.0,
        quantity: 40,
        category: "Респіраторні",
        manufacturer: "BreathEasy",
        expirationDate: "2025-07-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Інгалятор+Сальбутамол",
      },
      {
        name: "Сироп від кашлю 120 мл",
        description: "Заспокійливий сироп від кашлю",
        price: 60.0,
        quantity: 180,
        category: "Респіраторні",
        manufacturer: "CoughFree",
        expirationDate: "2026-02-28",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Сироп+від+кашлю",
      },
      {
        name: "Мірамистин 0.01% 50 мл",
        description: "Антисептик для місцевого застосування",
        price: 85.0,
        quantity: 150,
        category: "Дерматологія",
        manufacturer: "SafeSkin",
        expirationDate: "2027-05-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Мірамистин",
      },
      {
        name: "Крем від дерматиту 30 г",
        description: "Крем місцевого застосування при дерматитах",
        price: 165.0,
        quantity: 70,
        category: "Дерматологія",
        manufacturer: "SkinCare",
        expirationDate: "2026-09-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Крем+від+дерматиту",
      },
      {
        name: "Пробіотики 30 капсул",
        description: "Підтримка мікрофлори кишечника",
        price: 210.0,
        quantity: 150,
        category: "Гастроентерологія",
        manufacturer: "BioBalance",
        expirationDate: "2028-03-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Пробіотики",
      },
      {
        name: "Цинк 25 мг",
        description: "Підтримка імунітету",
        price: 60.0,
        quantity: 200,
        category: "Вітаміни",
        manufacturer: "MineralPlus",
        expirationDate: "2028-05-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Цинк",
      },
      {
        name: "Кеторолак 10 мг",
        description: "Нестероїдний протизапальний засіб",
        price: 55.0,
        quantity: 60,
        category: "Знеболювальні",
        manufacturer: "PainRelief",
        expirationDate: "2026-07-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Кеторолак",
      },
      {
        name: "Нітрогліцерин 0.4 мг/с",
        description: "Клапан для купірування нападів стенокардії",
        price: 310.0,
        quantity: 20,
        category: "Кардіологічні",
        manufacturer: "CardioRx",
        expirationDate: "2025-12-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Нітрогліцерин",
      },
      {
        name: "Еритроміцин 250 мг",
        description: "Антибіотик для інфекцій шкіри та дихальних шляхів",
        price: 130.0,
        quantity: 48,
        category: "Антибіотики",
        manufacturer: "Antimicrob",
        expirationDate: "2026-02-28",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Еритроміцин",
      },
      {
        name: "Флутиказон назальний спрей 50 мкг",
        description: "Назальний кортикостероїд для алергічного риніту",
        price: 270.0,
        quantity: 55,
        category: "Респіраторні",
        manufacturer: "AllerFree",
        expirationDate: "2025-11-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Флутиказон",
      },
      {
        name: "Доксициклін 100 мг",
        description: "Антибіотик широкого спектра дії",
        price: 200.0,
        quantity: 60,
        category: "Антибіотики",
        manufacturer: "Antibio",
        expirationDate: "2026-08-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Доксициклін",
      },
      {
        name: "Альфа-ліпоєва кислота 600 мг",
        description: "Антиоксидант для підтримки нервової системи",
        price: 180.0,
        quantity: 120,
        category: "Неврологія",
        manufacturer: "NeuroSupport",
        expirationDate: "2027-10-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Альфа-ліпоєва",
      },
      {
        name: "Диклофенак 50 мг",
        description: "НПЗП для зменшення запалення",
        price: 70.0,
        quantity: 90,
        category: "Знеболювальні",
        manufacturer: "PainAway",
        expirationDate: "2026-06-30",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Диклофенак",
      },
      {
        name: "Магній 300 мг",
        description: "Підтримка серцево-судинної і нервової системи",
        price: 120.0,
        quantity: 160,
        category: "Вітаміни",
        manufacturer: "MineralPlus",
        expirationDate: "2028-08-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Магній",
      },
      {
        name: "Клофелін 0.2 мг",
        description: "Гіпотензивний засіб",
        price: 245.0,
        quantity: 30,
        category: "Кардіологічні",
        manufacturer: "HeartWell",
        expirationDate: "2026-11-30",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Клофелін",
      },
      {
        name: "Гідроксизин 25 мг",
        description: "Антигістамінний засіб з седативним ефектом",
        price: 90.0,
        quantity: 65,
        category: "Алергія",
        manufacturer: "AllerCare",
        expirationDate: "2027-02-28",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Гідроксизин",
      },
      {
        name: "Симвастатин 10 мг",
        description: "Зниження рівня холестерину",
        price: 160.0,
        quantity: 70,
        category: "Кардіологічні",
        manufacturer: "CardioRx",
        expirationDate: "2027-03-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Симвастатин",
      },
      {
        name: "Цетрин 10 мг",
        description: "Антигістамінний препарат",
        price: 88.0,
        quantity: 150,
        category: "Алергія",
        manufacturer: "AllerCare",
        expirationDate: "2028-04-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Цетрин",
      },
      {
        name: "Лоратадин 10 мг",
        description: "Антигістамінний препарат без седативного ефекту",
        price: 85.0,
        quantity: 160,
        category: "Алергія",
        manufacturer: "AllerCare",
        expirationDate: "2028-07-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Лоратадин",
      },
      {
        name: "Калію хлорид 600 мг",
        description: "Реаміналізація при дефіциті калію",
        price: 120.0,
        quantity: 40,
        category: "Вітаміни",
        manufacturer: "MineralPlus",
        expirationDate: "2027-09-30",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Калію+хлорид",
      },
      {
        name: "Налоксон назальний спрей 4 мг",
        description: "Антидот при передозуванні опіоїдами",
        price: 350.0,
        quantity: 10,
        category: "Аварійні",
        manufacturer: "SafeMed",
        expirationDate: "2025-10-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Налоксон",
      },
      {
        name: "Травматичний бинт 5 м x 10 см",
        description: "Перев'язувальний матеріал",
        price: 45.0,
        quantity: 300,
        category: "Медична аптека",
        manufacturer: "MedSupplies",
        expirationDate: "2030-12-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Бинт",
      },
      {
        name: "Термометр електронний",
        description: "Для вимірювання температури",
        price: 320.0,
        quantity: 80,
        category: "Медична аптека",
        manufacturer: "MediTools",
        expirationDate: "2030-01-01",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Термометр",
      },
      {
        name: "Пластир бактерицидний 10 шт.",
        description: "Для захисту дрібних ран",
        price: 28.0,
        quantity: 400,
        category: "Медична аптека",
        manufacturer: "MedSupplies",
        expirationDate: "2030-06-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Пластир",
      },
      {
        name: "Шовний матеріал 3/0",
        description: "Для хірургічних швів",
        price: 420.0,
        quantity: 12,
        category: "Медична аптека",
        manufacturer: "SurgiPro",
        expirationDate: "2029-09-30",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Шовний+матеріал",
      },
      {
        name: "Бромгексин сироп 100 мл",
        description: "Муколітик для полегшення кашлю",
        price: 70.0,
        quantity: 160,
        category: "Респіраторні",
        manufacturer: "Mucolytix",
        expirationDate: "2026-05-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Бромгексин",
      },
      {
        name: "Еналаприл 5 мг",
        description: "Зниження артеріального тиску",
        price: 195.0,
        quantity: 45,
        category: "Кардіологічні",
        manufacturer: "HeartWell",
        expirationDate: "2027-04-30",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Еналаприл",
      },
      {
        name: "Гепарин 5000 ОД/ml 10 мл",
        description: "Антикоагулянт для ін'єкцій",
        price: 680.0,
        quantity: 24,
        category: "Кардіологічні",
        manufacturer: "SafeInjection",
        expirationDate: "2026-01-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Гепарин",
      },
      {
        name: "Інсулін N 100 ОД/мл 10 мл",
        description: "Тривалої дії інсулін",
        price: 850.0,
        quantity: 40,
        category: "Ендокринологія",
        manufacturer: "InsuCare",
        expirationDate: "2026-10-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Інсулін+N",
      },
      {
        name: "Інсулін R 100 ОД/мл 10 мл",
        description: "Короткої дії інсулін",
        price: 880.0,
        quantity: 36,
        category: "Ендокринологія",
        manufacturer: "InsuCare",
        expirationDate: "2026-10-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Інсулін+R",
      },
      {
        name: "Ацикловір 200 мг",
        description: "Противірусний для лікування герпесу",
        price: 160.0,
        quantity: 48,
        category: "Інфекції",
        manufacturer: "ViroStop",
        expirationDate: "2026-05-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Ацикловір",
      },
      {
        name: "Прозерин 0.5 мг",
        description: "Лікарський засіб при міастенії",
        price: 400.0,
        quantity: 20,
        category: "Неврологія",
        manufacturer: "NeuroSupport",
        expirationDate: "2025-08-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Прозерин",
      },
      {
        name: "Калій магнію B6",
        description: "Комплекс при дефіциті калію, магнію та вітаміну B6",
        price: 140.0,
        quantity: 180,
        category: "Вітаміни",
        manufacturer: "MineralPlus",
        expirationDate: "2028-02-28",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Калій+Магній+B6",
      },
      {
        name: "Альмагель 120 мл",
        description: "Антацидний препарат для шлунку",
        price: 95.0,
        quantity: 140,
        category: "Гастроентерологія",
        manufacturer: "GastroCare",
        expirationDate: "2026-12-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Альмагель",
      },
      {
        name: "Сірчаний крем 50 г",
        description: "Протиакне засіб та для шкіри",
        price: 70.0,
        quantity: 110,
        category: "Дерматологія",
        manufacturer: "DermCare",
        expirationDate: "2027-09-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Сірчаний+крем",
      },
      {
        name: "Прегабалін 75 мг",
        description: "Лікарський засіб при невропатичному болю",
        price: 350.0,
        quantity: 45,
        category: "Неврологія",
        manufacturer: "NeuroRelief",
        expirationDate: "2027-03-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Прегабалін",
      },
      {
        name: "Фолиева кислота 400 мкг",
        description:
          "Для підтримки вагітності та при дефіциті фолієвої кислоти",
        price: 55.0,
        quantity: 260,
        category: "Вітаміни",
        manufacturer: "NutriVita",
        expirationDate: "2029-04-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Фолиева+кислота",
      },
      {
        name: "Кетоконазол крем 20 г",
        description: "Проти грибкових інфекцій шкіри",
        price: 110.0,
        quantity: 85,
        category: "Дерматологія",
        manufacturer: "DermCare",
        expirationDate: "2026-08-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Кетоконазол",
      },
      {
        name: "Ранитидин 150 мг",
        description: "Антацидний препарат (альтернативний)",
        price: 80.0,
        quantity: 60,
        category: "Гастроентерологія",
        manufacturer: "GastroCare",
        expirationDate: "2025-09-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Ранитидин",
      },
      {
        name: "Кларитроміцин 500 мг",
        description: "Антибіотик для інфекцій дихальних шляхів",
        price: 180.0,
        quantity: 48,
        category: "Антибіотики",
        manufacturer: "Antibio",
        expirationDate: "2026-12-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Кларитроміцин",
      },
      {
        name: "Дексаметазон 4 мг",
        description: "Стероїд для зниження запалення",
        price: 120.0,
        quantity: 90,
        category: "Запальні",
        manufacturer: "SteroidCare",
        expirationDate: "2026-05-31",
        prescription: true,
        imageUrl: "https://placehold.co/400x250?text=Дексаметазон",
      },
      {
        name: "Саліциловий лосьйон 100 мл",
        description: "Проти акне і для ексфоліації шкіри",
        price: 95.0,
        quantity: 140,
        category: "Дерматологія",
        manufacturer: "SkinCare",
        expirationDate: "2026-11-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Саліциловий+лосьйон",
      },
      {
        name: "Пантенол спрей 50 мл",
        description: "Заспокійливий спрей для опіків і ран",
        price: 70.0,
        quantity: 190,
        category: "Дерматологія",
        manufacturer: "FirstAidPro",
        expirationDate: "2028-01-31",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Пантенол",
      },
      {
        name: "Полівітаміни для дітей 60 таб.",
        description: "Комплекс вітамінів для дітей",
        price: 140.0,
        quantity: 160,
        category: "Вітаміни",
        manufacturer: "KidVita",
        expirationDate: "2029-06-30",
        prescription: false,
        imageUrl: "https://placehold.co/400x250?text=Полівітаміни+для+дітей",
      },
    ];

    // Генератор посилань на фото для медичних товарів (кожне ім'я дає детерміноване фото)
    const fs = require("fs");
    const path = require("path");

    // Серверний хост (для повернення абсолютного URL до зображень)
    const SERVER_HOST =
      process.env.SERVER_HOST ||
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 5000}`;

    // Повертає локальний абсолютний шлях (HTTP URL) до зображення, якщо файл існує
    function localImageUrlFor(name) {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-а-яіїєґ-]/gi, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const imagesDir = path.join(__dirname, "..", "public", "images", "meds");
      const candidates = [
        `${slug}.jpg`,
        `${slug}.jpeg`,
        `${slug}.png`,
        `${slug}.webp`,
      ];
      for (const f of candidates) {
        const p = path.join(imagesDir, f);
        if (fs.existsSync(p)) {
          // повертаємо абсолютний HTTP URL — сервер Express повинен роздавати цю папку
          return `${SERVER_HOST}/images/meds/${f}`;
        }
      }
      return null;
    }

    // завжди спробуємо скопіювати seed/fallback.jpg до public (щоб мати fallback завжди)
    try {
      const imagesDirRoot = path.join(
        __dirname,
        "..",
        "public",
        "images",
        "meds",
      );
      const seedFallback = path.join(__dirname, "fallback.jpg");
      const publicFallback = path.join(imagesDirRoot, "fallback.jpg");
      if (fs.existsSync(seedFallback) && !fs.existsSync(publicFallback)) {
        if (!fs.existsSync(imagesDirRoot))
          fs.mkdirSync(imagesDirRoot, { recursive: true });
        try {
          fs.copyFileSync(seedFallback, publicFallback);
          console.log(
            "✔️ Копія seed/fallback.jpg -> public/images/meds/fallback.jpg (налаштовано)",
          );
        } catch (e) {
          console.warn(
            "Не вдалось скопіювати seed/fallback.jpg на початку seed:",
            e.message || e,
          );
        }
      }
    } catch (e) {
      // ignore
    }

    // Якщо потрібні стійкі реально-орієнтовані фото, можна заповнити цю мапу локальними файлами
    // або додати зовнішні посилання (Unsplash, Wikimedia, тощо). Якщо локальний файл знайдений,
    // використовуємо його, інакше повертаємо посилання на Picsum (як fallback).
    function makeImageUrl(name) {
      const local = localImageUrlFor(name);
      if (local) return local;
      // Якщо нема локального фото конкретного препарату — перевіримо наявність generic tablets
      const genericLocal = `${SERVER_HOST}/images/meds/tablets.jpg`;
      const genericPath = path.join(
        __dirname,
        "..",
        "public",
        "images",
        "meds",
        "tablets.jpg",
      );
      if (fs.existsSync(genericPath)) return genericLocal;
      const slug = encodeURIComponent(
        name.replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
      );
      // Якщо немає локальних зображень — fallback на Picsum (або можна змінити на Unsplash)
      // Як останній fallback — якщо локального fallback.jpg немає, використаємо сервісний fallback
      return `https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80`;
    }

    // Чи відповідає URL типу "scenic" / lifestyle фото (villa, house, pool etc.)
    function isScenicUrl(url) {
      if (!url) return false;
      try {
        const u = new URL(url);
        const hostname = u.hostname.toLowerCase();
        const badHosts = [
          "images.unsplash.com",
          "unsplash.com",
          "images.pexels.com",
          "pexels.com",
          "cdn.pixabay.com",
          "pixabay.com",
        ];
        for (const h of badHosts) if (hostname.includes(h)) return true;
        const path = (u.pathname || "").toLowerCase();
        const scenicKeywords = [
          "villa",
          "house",
          "pool",
          "beach",
          "apartment",
          "resort",
          "interior",
          "exterior",
          "hotel",
          "livingroom",
          "living-room",
          "kitchen",
          "bedroom",
          "real-estate",
        ];
        for (const k of scenicKeywords) if (path.includes(k)) return true;
        return false;
      } catch (e) {
        return false;
      }
    }

    // Якщо є файл seed/med_images.json, можна завантажити реальні фото, викликавши
    // npm run seed -- --force --download-images
    async function downloadImagesFromMapping() {
      const imagesMapPath = path.join(__dirname, "med_images.json");
      if (!fs.existsSync(imagesMapPath)) return;
      console.log(
        "⬇️  Завантажую зображення з mapping med_images.json (може зайняти час)...",
      );
      const raw = fs.readFileSync(imagesMapPath, "utf8");
      let mapping = {};
      try {
        mapping = JSON.parse(raw);
      } catch (e) {
        console.warn("Не вдалось розпарсити med_images.json:", e.message);
        return;
      }
      const imagesDir = path.join(__dirname, "..", "public", "images", "meds");
      // Якщо у папці seed є fallback.jpg (наприклад, ви завантажили його тут), скопіюємо його
      const seedFallback = path.join(__dirname, "fallback.jpg");
      const publicFallback = path.join(imagesDir, "fallback.jpg");
      if (fs.existsSync(seedFallback) && !fs.existsSync(publicFallback)) {
        try {
          if (!fs.existsSync(imagesDir))
            fs.mkdirSync(imagesDir, { recursive: true });
          fs.copyFileSync(seedFallback, publicFallback);
          console.log(
            "✔️ Використано seed/fallback.jpg як локальний fallback image",
          );
        } catch (e) {
          console.warn(
            "Не вдалось скопіювати seed/fallback.jpg:",
            e.message || e,
          );
        }
      }
      if (!fs.existsSync(imagesDir))
        fs.mkdirSync(imagesDir, { recursive: true });
      for (const [name, url] of Object.entries(mapping)) {
        if (!url) continue;
        const slug = name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-а-яіїєґ-]/gi, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        const parsedPath = new URL(url).pathname;
        const extMatch = parsedPath.match(/\.(jpg|jpeg|png|webp)$/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
        // Якщо зазначено __generic_tablets__, збережемо як tablets.<ext>
        const fileName =
          name === "__generic_tablets__" ? `tablets.jpg` : `${slug}.${ext}`;
        const filePath = path.join(imagesDir, fileName);
        if (fs.existsSync(filePath)) {
          console.log(`  ✔️ Локальний файл вже існує для ${name}: ${fileName}`);
          continue;
        }
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`  ❌ Неможливо завантажити ${name}: ${url}`);
            continue;
          }
          const arrayBuffer = await res.arrayBuffer();
          fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
          console.log(`  ✔️ Завантажено ${name} -> ${fileName}`);
        } catch (e) {
          console.warn(
            `  ❌ Помилка при завантаженні ${name}:`,
            e.message || e,
          );
        }
      }
      // Після завантаження mapping — якщо є tablets.* файл, зробимо tablets.jpg (уніфіковано)
      if (fs.existsSync(imagesDir)) {
        // Після завантаження mapping — якщо є tablets.* або вже є fallback.jpg - відновимо fallback.jpg
        const candidates = fs
          .readdirSync(imagesDir)
          .filter((f) => /^tablets\./i.test(f));
        if (candidates.length > 0) {
          const src = path.join(imagesDir, candidates[0]);
          const dst = path.join(imagesDir, "fallback.jpg");
          if (!fs.existsSync(dst)) {
            try {
              fs.copyFileSync(src, dst);
            } catch (e) {
              // ignore
            }
          }
        }
        // Якщо у нас немає fallback.jpg, але є наявний generic '__generic_tablets__' (tablets.jpg) – перекопіюємо
        const fallbackPath = path.join(imagesDir, "fallback.jpg");
        if (!fs.existsSync(fallbackPath)) {
          const genericFiles = fs
            .readdirSync(imagesDir)
            .filter((f) => /^tablets\./i.test(f));
          if (genericFiles.length > 0) {
            try {
              fs.copyFileSync(
                path.join(imagesDir, genericFiles[0]),
                fallbackPath,
              );
            } catch (e) {}
          }
        }
      }
    }

    // Додатково: для препаратів без локальних зображень спробуємо знайти файли на Wikimedia Commons
    async function findAndDownloadFromWikimedia(names) {
      if (!Array.isArray(names) || names.length === 0) return;
      const imagesDir = path.join(__dirname, "..", "public", "images", "meds");
      if (!fs.existsSync(imagesDir))
        fs.mkdirSync(imagesDir, { recursive: true });
      for (const name of names) {
        const local = localImageUrlFor(name);
        if (local) continue; // already have local image
        try {
          const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
            name,
          )}&srnamespace=6&srprop=snippet&srlimit=3`;
          const res = await fetch(searchUrl);
          if (!res.ok) continue;
          const json = await res.json();
          const results =
            json.query && json.query.search ? json.query.search : [];
          for (const r of results) {
            const title = r.title; // e.g., 'File:Paracetamol_650.jpg'
            const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&titles=${encodeURIComponent(
              title,
            )}&iiprop=url`;
            const infoRes = await fetch(infoUrl);
            if (!infoRes.ok) continue;
            const infoJson = await infoRes.json();
            const pages =
              infoJson.query && infoJson.query.pages
                ? infoJson.query.pages
                : {};
            const pageKey = Object.keys(pages)[0];
            const page = pages[pageKey];
            if (page && page.imageinfo && page.imageinfo.length > 0) {
              const url = page.imageinfo[0].url;
              const parsedPath = new URL(url).pathname;
              const extMatch = parsedPath.match(/\.(jpg|jpeg|png|webp)$/i);
              const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
              const slug = name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-а-яіїєґ-]/gi, "")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
              const fileName = `${slug}.${ext}`;
              const filePath = path.join(imagesDir, fileName);
              if (fs.existsSync(filePath)) break;
              const imgRes = await fetch(url);
              if (!imgRes.ok) break;
              const arrayBuffer = await imgRes.arrayBuffer();
              fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
              console.log(
                `  ✔️ Авто-завантажено з Wikimedia: ${name} -> ${fileName}`,
              );
              // Оновимо med_images.json, щоб на наступний раз знати URL (Wikimedia)
              try {
                const mapPath = path.join(__dirname, "med_images.json");
                let mapData = {};
                if (fs.existsSync(mapPath)) {
                  try {
                    mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));
                  } catch (e) {
                    mapData = {};
                  }
                }
                mapData[name] = url;
                fs.writeFileSync(
                  mapPath,
                  JSON.stringify(mapData, null, 2),
                  "utf8",
                );
              } catch (e) {
                // ignore write errors
              }
              break;
            }
          }
        } catch (e) {
          // ignore errors; we'll fallback later
        }
      }
    }

    if (DOWNLOAD_IMAGES) {
      await downloadImagesFromMapping();
      // Як додаткове, спробуємо знайти і завантажити зображення з Wikimedia для лікарських засобів
      try {
        const medNames = medicines.map((m) => m.name);
        await findAndDownloadFromWikimedia(medNames);
      } catch (e) {
        // ignore
      }
    }
    let medsRef = null;
    let addedMeds = [];
    if (firestoreAvailable) {
      medsRef = db.collection("medicines");
      const snapshotAllMed = await medsRef.get();
      const existingMedNames = new Set(
        snapshotAllMed.docs.map((d) => d.data().name),
      );

      addedMeds = [];
      // Якщо прапор REPLACE_SCENIC — оновимо існуючі записи у Firestore (замінимо scenic images на fallback)
      if (REPLACE_SCENIC) {
        try {
          const snapshotAll = await medsRef.get();
          for (const doc of snapshotAll.docs) {
            const d = doc.data();
            const currentUrl = d.imageUrl;
            const fallbackUrl = `${SERVER_HOST}/images/meds/fallback.jpg`;
            if (
              currentUrl &&
              isScenicUrl(currentUrl) &&
              !currentUrl.startsWith(SERVER_HOST)
            ) {
              await doc.ref.update({
                imageUrl: fallbackUrl,
                updatedAt: new Date().toISOString(),
              });
              console.log(
                `🟧 Оновлено існуючий медикамент ${d.name}: scenic image -> fallback`,
              );
            }
          }
        } catch (e) {
          console.warn("Помилка при оновленні scenic images:", e.message || e);
        }
      }
      for (const med of medicines) {
        // Якщо не вказано imageUrl або вказано placeholder - генеруємо реалістичну картинку
        // Зараз підтримуємо локальні фотографії у server/public/images/meds/<slug>.(jpg|png|webp)
        const fallbackUrl = `${SERVER_HOST}/images/meds/fallback.jpg`;
        if (
          !med.imageUrl ||
          med.imageUrl.includes("placehold") ||
          med.imageUrl.includes("placehold.co") ||
          med.imageUrl.includes("via.placeholder.com")
        ) {
          med.imageUrl = makeImageUrl(med.name);
        } else {
          // навіть якщо imageUrl заданий — намагaємось використовувати локальний файл на основі назви
          const local = localImageUrlFor(med.name);
          if (local) {
            med.imageUrl = local;
          } else {
            // Якщо вказано внешний URL, але ми хочемо замінити scenic/stock зображення на fallback
            if (REPLACE_SCENIC && isScenicUrl(med.imageUrl)) {
              med.imageUrl = fallbackUrl;
              console.log(
                `🟧 Замінено scenic image для ${med.name} на fallback`,
              );
            }
          }
        }
        if (existingMedNames.has(med.name)) {
          console.log(`💊 Медикамент ${med.name} вже існує, пропускаємо`);
        } else {
          const docRef = await medsRef.add({
            ...med,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log(`💊 Додано медикамент ${med.name} (id=${docRef.id})`);
          med.id = docRef.id;
          addedMeds.push({ id: docRef.id, ...med });
        }
      }

      // Однакові ліки не будуть повторно додані; з existingMedNames ми зчитали попередні
      // Якщо нема зараз доданихMeds і є існуючі - плечемо id з Firestore
      if (addedMeds.length === 0) {
        // Підберемо кілька існуючих медикаментів для сліпого створення замовлення
        console.log(
          "🔎 Пошук існуючих медикаментів для створення прикладу замовлення...",
        );
        const snapshot = await medsRef.limit(3).get();
        snapshot.forEach((doc) => {
          const d = doc.data();
          addedMeds.push({ id: doc.id, ...d });
        });
      }
    }

    // Створюємо приклад замовлення для користувача Ivan (якщо його UID відомий)
    if (!firestoreAvailable) {
      console.warn("Пропуск створення замовлення: Firestore недоступний");
    }
    const ivanUid = createdUsersMap["ivan@apteka.local"];

    if (ivanUid && addedMeds.length > 0) {
      // Формуємо items з наявних медикаментів
      const item = addedMeds[0];
      const orderItems = [
        {
          medicineId: item.id,
          name: item.name,
          price: item.price,
          quantity: 2,
          total: item.price * 2,
        },
      ];

      // Збільшуємо запис в orders
      const ordersCollection = db.collection("orders");
      const orderDoc = {
        userId: ivanUid,
        userEmail: "ivan@apteka.local",
        items: orderItems,
        totalAmount: orderItems.reduce((s, it) => s + it.total, 0),
        deliveryAddress: "м. Київ, вул. Тестова, 1",
        phoneNumber: "+380501234567",
        notes: "Тестове замовлення",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const orderRef = await ordersCollection.add(orderDoc);
      console.log(
        `📦 Створене тестове замовлення (id=${orderRef.id}) для ${ivanUid}`,
      );

      // Оновлення кількості товару
      const medRef = medsRef.doc(item.id);
      const medSnap = await medRef.get();
      const newQty = Math.max(0, (medSnap.data().quantity || 0) - 2);
      await medRef.update({
        quantity: newQty,
        updatedAt: new Date().toISOString(),
      });
      console.log(`📦 Оновлено кількість ${item.name} -> ${newQty}`);
    }

    console.log("✅ Seed завершено");
    process.exit(0);
  } catch (err) {
    console.error("❌ Помилка при seed:", err);
    // Якщо Firestore API не ввімкнено, вивести більш зрозумілу підказку
    try {
      const { code, details } = err;
      if (code === 7 && details && details.includes("Cloud Firestore API")) {
        console.error(
          "\n⚠️ Виглядає на те, що Cloud Firestore API не ввімкнено для проєкту (SERVICE_DISABLED).",
        );
        console.error(
          "Відкрийте: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=apteka-ee589",
        );
        console.error(
          "Якщо ви вже ввімкнули, зачекайте кілька хвилин і спробуйте знову.",
        );
      }
    } catch (e) {
      // ignore parsing
    }
    process.exit(1);
  }
})();
