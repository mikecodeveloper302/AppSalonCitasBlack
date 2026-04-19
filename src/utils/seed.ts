import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';

export async function seedDatabase() {
  try {
    // Check if we already have data
    const clientsSnap = await getDocs(query(collection(db, 'clients'), limit(1)));
    if (!clientsSnap.empty) {
      console.log('Database already has data, skipping seed.');
      return false;
    }

    console.log('Seeding database...');

    // Seed Clients
    const clients = [
      { name: 'Ana García', email: 'ana@ejemplo.com', phone: '+56 9 1234 5678', notes: 'Prefiere café sin azúcar.', createdAt: new Date().toISOString() },
      { name: 'Carlos Ruiz', email: 'carlos@ejemplo.com', phone: '+56 9 8765 4321', notes: 'Corte clásico.', createdAt: new Date().toISOString() },
      { name: 'Elena Torres', email: 'elena@ejemplo.com', phone: '+56 9 5555 4444', notes: 'Alergia a tintes amoniacales.', createdAt: new Date().toISOString() }
    ];

    for (const client of clients) {
      await addDoc(collection(db, 'clients'), client);
    }

    // Seed Services
    const services = [
      { name: 'Corte Dama', description: 'Corte y peinado profesional.', price: 25000, duration: 45, category: 'Corte', createdAt: new Date().toISOString() },
      { name: 'Corte Varón', description: 'Corte clásico o moderno.', price: 15000, duration: 30, category: 'Corte', createdAt: new Date().toISOString() },
      { name: 'Coloración Global', description: 'Tinte completo con productos premium.', price: 45000, duration: 90, category: 'Color', createdAt: new Date().toISOString() },
      { name: 'Manicure Rusa', description: 'Limpieza profunda y esmaltado.', price: 18000, duration: 60, category: 'Manicure', createdAt: new Date().toISOString() }
    ];

    for (const service of services) {
      await addDoc(collection(db, 'services'), service);
    }

    // Seed Products
    const products = [
      { name: 'Shampoo Argán', description: 'Hidratación profunda.', price: 12000, stock: 15, minStock: 5, category: 'Capilar', createdAt: new Date().toISOString() },
      { name: 'Aceite de Cutículas', description: 'Nutrición para uñas.', price: 5000, stock: 3, minStock: 5, category: 'Manicure', createdAt: new Date().toISOString() }
    ];

    for (const product of products) {
      await addDoc(collection(db, 'products'), product);
    }

    // Seed Staff (Users)
    const staff = [
      { displayName: 'Sofía Estilista', email: 'sofia@salon.com', role: 'staff', createdAt: new Date().toISOString() },
      { displayName: 'Valentina Manicurista', email: 'valentina@salon.com', role: 'staff', createdAt: new Date().toISOString() }
    ];

    for (const member of staff) {
      await addDoc(collection(db, 'users'), member);
    }

    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
