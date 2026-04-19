export const MOCK_CLIENTS = [
  { id: 'c1', name: 'Ana García', email: 'ana@ejemplo.com', phone: '+56 9 1234 5678', notes: 'Prefiere café sin azúcar.', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Carlos Ruiz', email: 'carlos@ejemplo.com', phone: '+56 9 8765 4321', notes: 'Corte clásico.', createdAt: new Date().toISOString() },
  { id: 'c3', name: 'Elena Torres', email: 'elena@ejemplo.com', phone: '+56 9 5555 4444', notes: 'Alergia a tintes amoniacales.', createdAt: new Date().toISOString() }
];

export const MOCK_SERVICES = [
  { id: 's1', name: 'Corte Dama', description: 'Corte y peinado profesional.', price: 25000, duration: 45, category: 'Corte' },
  { id: 's2', name: 'Corte Varón', description: 'Corte clásico o moderno.', price: 15000, duration: 30, category: 'Corte' },
  { id: 's3', name: 'Coloración Global', description: 'Tinte completo con productos premium.', price: 45000, duration: 90, category: 'Color' },
  { id: 's4', name: 'Manicure Rusa', description: 'Limpieza profunda y esmaltado.', price: 18000, duration: 60, category: 'Manicure' }
];

export const MOCK_STAFF = [
  { id: 'st1', displayName: 'Miguel Admin', role: 'admin', email: 'admin@salon.com' },
  { id: 'st2', displayName: 'Sofía Estilista', role: 'staff', email: 'sofia@salon.com' }
];

export const MOCK_APPOINTMENTS = [
  {
    id: 'a1',
    clientId: 'c1',
    clientName: 'Ana García',
    serviceId: 's1',
    serviceName: 'Corte Dama',
    staffId: 'st2',
    staffName: 'Sofía Estilista',
    startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    status: 'confirmed',
    totalPrice: 25000,
    notes: 'Puntual'
  },
  {
    id: 'a2',
    clientId: 'c2',
    clientName: 'Carlos Ruiz',
    serviceId: 's2',
    serviceName: 'Corte Varón',
    staffId: 'st1',
    staffName: 'Miguel Admin',
    startTime: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
    status: 'pending',
    totalPrice: 15000,
    notes: ''
  }
];

export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Shampoo Hidratante', category: 'Cabello', price: 12000, stock: 15, minStock: 5, description: 'Shampoo para cabello seco.' },
  { id: 'p2', name: 'Esmalte Rojo', category: 'Uñas', price: 5000, stock: 3, minStock: 5, description: 'Esmalte de larga duración.' },
  { id: 'p3', name: 'Crema Facial', category: 'Piel', price: 25000, stock: 8, minStock: 3, description: 'Crema hidratante de día.' }
];

export const MOCK_INVOICES = [
  { id: 'i1', clientId: 'c1', clientName: 'Ana García', total: 25000, paymentMethod: 'card', status: 'paid', createdAt: new Date().toISOString(), items: [{ description: 'Corte Dama', price: 25000 }] },
  { id: 'i2', clientId: 'c2', clientName: 'Carlos Ruiz', total: 15000, paymentMethod: 'cash', status: 'pending', createdAt: new Date().toISOString(), items: [{ description: 'Corte Varón', price: 15000 }] }
];

export const MOCK_PROMOTIONS = [
  { id: 'pr1', name: 'Especial Verano', description: '20% de descuento en todos los cortes.', discountType: 'percentage', discountValue: 20, startDate: '2024-01-01', endDate: '2024-12-31', active: true },
  { id: 'pr2', name: 'Lunes de Uñas', description: '$5000 de descuento en manicure.', discountType: 'fixed', discountValue: 5000, startDate: '2024-01-01', endDate: '2024-12-31', active: false }
];
