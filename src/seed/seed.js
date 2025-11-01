const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const seedData = async () => {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || "foodierank");

    console.log("🧹 Limpiando colecciones...");
    await Promise.all([
      db.collection("users").deleteMany({}),
      db.collection("categories").deleteMany({}),
      db.collection("restaurants").deleteMany({}),
      db.collection("dishes").deleteMany({}),
      db.collection("reviews").deleteMany({})
    ]);

    console.log("👤 Creando usuarios...");
    const hashedAdmin = await bcrypt.hash("admin123", 10);
    const hashedUser = await bcrypt.hash("user123", 10);

    const users = [
      {
        username: "admin",
        email: "admin@foodierank.com",
        password: hashedAdmin,
        role: "admin",
        createdAt: new Date()
      },
      {
        username: "carlos",
        email: "carlos@foodierank.com",
        password: hashedUser,
        role: "user",
        createdAt: new Date()
      },
      {
        username: "fabian",
        email: "fabian@foodierank.com",
        password: hashedUser,
        role: "user",
        createdAt: new Date()
      }
    ];

    const { insertedIds: userIds } = await db.collection("users").insertMany(users);

    console.log("🍴 Creando categorías...");
    const categories = [
      { name: "Comida rápida", description: "Hamburguesas, perros, pizzas" },
      { name: "Gourmet", description: "Alta cocina y experiencias únicas" },
      { name: "Vegetariano", description: "Platos sin carne" },
      { name: "Sushi", description: "Comida japonesa tradicional" }
    ];

    const { insertedIds: categoryIds } = await db.collection("categories").insertMany(categories);

    console.log("🏪 Creando restaurantes...");
    const restaurants = [
      {
        name: "BurgerZone",
        description: "Especialistas en hamburguesas artesanales",
        category: "Comida rápida",
        location: "Bogotá, Colombia",
        approved: true,
        createdAt: new Date()
      },
      {
        name: "Sakura",
        description: "Auténtico sushi japonés",
        category: "Sushi",
        location: "Medellín, Colombia",
        approved: true,
        createdAt: new Date()
      },
      {
        name: "VerdeVida",
        description: "Cocina vegetariana y saludable",
        category: "Vegetariano",
        location: "Cali, Colombia",
        approved: true,
        createdAt: new Date()
      }
    ];

    const { insertedIds: restaurantIds } = await db.collection("restaurants").insertMany(restaurants);

    console.log("🍔 Creando platos...");
    const dishes = [
      {
        name: "Classic Burger",
        description: "Carne, queso, tomate y lechuga",
        restaurantId: restaurantIds[0],
        price: 25000,
        category: "Comida rápida",
        createdAt: new Date()
      },
      {
        name: "Sushi Roll de Salmón",
        description: "Rolls frescos con salmón y aguacate",
        restaurantId: restaurantIds[1],
        price: 32000,
        category: "Sushi",
        createdAt: new Date()
      },
      {
        name: "Ensalada VerdeVida",
        description: "Ensalada fresca con aderezo natural",
        restaurantId: restaurantIds[2],
        price: 18000,
        category: "Vegetariano",
        createdAt: new Date()
      }
    ];

    const { insertedIds: dishIds } = await db.collection("dishes").insertMany(dishes);

    console.log("⭐ Creando reseñas...");
    const reviews = [
      {
        userId: userIds[1],
        restaurantId: restaurantIds[0],
        dishId: dishIds[0],
        comment: "Excelente sabor y atención",
        rating: 5,
        likes: 10,
        dislikes: 1,
        createdAt: new Date()
      },
      {
        userId: userIds[2],
        restaurantId: restaurantIds[1],
        dishId: dishIds[1],
        comment: "Buen sushi, pero un poco caro",
        rating: 4,
        likes: 6,
        dislikes: 0,
        createdAt: new Date()
      },
      {
        userId: userIds[2],
        restaurantId: restaurantIds[2],
        dishId: dishIds[2],
        comment: "Muy saludable y sabroso",
        rating: 5,
        likes: 8,
        dislikes: 0,
        createdAt: new Date()
      }
    ];

    await db.collection("reviews").insertMany(reviews);

    console.log("✅ Seed ejecutado correctamente.");
    console.log("Usuarios creados:", Object.values(userIds));
    console.log("Restaurantes creados:", Object.values(restaurantIds));
  } catch (err) {
    console.error("❌ Error en seed:", err);
  } finally {
    await client.close();
  }
};

seedData();
