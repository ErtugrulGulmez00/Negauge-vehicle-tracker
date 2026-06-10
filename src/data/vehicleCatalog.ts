export interface CatalogBrand {
  name: string;
  type: 'car' | 'motorcycle';
}

export const VEHICLE_CATALOG: CatalogBrand[] = [
  // Otomobil Markaları
  { name: 'BMW', type: 'car' },
  { name: 'Mercedes-Benz', type: 'car' },
  { name: 'Audi', type: 'car' },
  { name: 'Volkswagen', type: 'car' },
  { name: 'Toyota', type: 'car' },
  { name: 'Renault', type: 'car' },
  { name: 'Fiat', type: 'car' },
  { name: 'Ford', type: 'car' },
  { name: 'Hyundai', type: 'car' },
  { name: 'Honda', type: 'car' },
  { name: 'Peugeot', type: 'car' },
  { name: 'Opel', type: 'car' },
  { name: 'Tesla', type: 'car' },
  { name: 'Dacia', type: 'car' },
  { name: 'Skoda', type: 'car' },
  { name: 'Seat', type: 'car' },
  { name: 'Volvo', type: 'car' },
  { name: 'Alfa Romeo', type: 'car' },
  { name: 'Porsche', type: 'car' },
  { name: 'Cupra', type: 'car' },
  { name: 'Jeep', type: 'car' },
  { name: 'Land Rover', type: 'car' },
  { name: 'Kia', type: 'car' },
  { name: 'Nissan', type: 'car' },
  { name: 'Citroen', type: 'car' },
  { name: 'Mazda', type: 'car' },
  { name: 'Suzuki', type: 'car' },
  { name: 'Subaru', type: 'car' },
  { name: 'Mitsubishi', type: 'car' },
  { name: 'Chevrolet', type: 'car' },

  // Motosiklet Markaları
  { name: 'Yamaha', type: 'motorcycle' },
  { name: 'Honda Moto', type: 'motorcycle' },
  { name: 'Vespa', type: 'motorcycle' },
  { name: 'Kawasaki', type: 'motorcycle' },
  { name: 'BMW Motorrad', type: 'motorcycle' },
  { name: 'KTM', type: 'motorcycle' },
  { name: 'Suzuki Moto', type: 'motorcycle' },
  { name: 'Harley-Davidson', type: 'motorcycle' },
  { name: 'Ducati', type: 'motorcycle' },
  { name: 'Aprilia', type: 'motorcycle' },
  { name: 'Baja', type: 'motorcycle' },
  { name: 'Husqvarna', type: 'motorcycle' }
];
