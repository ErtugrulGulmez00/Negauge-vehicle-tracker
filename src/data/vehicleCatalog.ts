export interface CatalogBrand {
  name: string;
  type: 'car' | 'motorcycle';
  models: string[];
}

export const VEHICLE_CATALOG: CatalogBrand[] = [
  // Otomobil Markaları
  {
    name: 'BMW',
    type: 'car',
    models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', 'i4', 'iX', 'iX3', 'X1', 'X3', 'X5', 'X6']
  },
  {
    name: 'Mercedes-Benz',
    type: 'car',
    models: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE', 'EQA', 'EQB', 'EQC', 'EQE']
  },
  {
    name: 'Audi',
    type: 'car',
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'e-tron GT']
  },
  {
    name: 'Volkswagen',
    type: 'car',
    models: ['Polo', 'Golf', 'T-Roc', 'Tiguan', 'Passat', 'Arteon', 'Taigo', 'Touareg', 'ID.3', 'ID.4', 'ID.5']
  },
  {
    name: 'Toyota',
    type: 'car',
    models: ['Yaris', 'Corolla', 'C-HR', 'RAV4', 'Land Cruiser', 'Hilux', 'Proace City', 'Supra']
  },
  {
    name: 'Renault',
    type: 'car',
    models: ['Clio', 'Taliant', 'Captur', 'Megane', 'Kadjar', 'Austral', 'Koleos', 'Zoe']
  },
  {
    name: 'Fiat',
    type: 'car',
    models: ['500', '500X', 'Panda', 'Egea', 'Egea Cross', 'Doblo', 'Fiorino']
  },
  {
    name: 'Ford',
    type: 'car',
    models: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Mustang Mach-E', 'Ranger', 'Transit']
  },
  {
    name: 'Hyundai',
    type: 'car',
    models: ['i10', 'i20', 'i30', 'Elantra', 'Bayon', 'Kona', 'Tucson', 'Santa Fe', 'IONIQ 5', 'IONIQ 6']
  },
  {
    name: 'Honda',
    type: 'car',
    models: ['Jazz', 'City', 'Civic', 'HR-V', 'CR-V', 'Accord']
  },
  {
    name: 'Peugeot',
    type: 'car',
    models: ['208', '308', '408', '508', '2008', '3008', '5008', 'Rifter']
  },
  {
    name: 'Opel',
    type: 'car',
    models: ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland', 'Combo']
  },
  {
    name: 'Tesla',
    type: 'car',
    models: ['Model 3', 'Model Y', 'Model S', 'Model X']
  },
  {
    name: 'Dacia',
    type: 'car',
    models: ['Sandero', 'Sandero Stepway', 'Jogger', 'Duster', 'Spring']
  },
  {
    name: 'Skoda',
    type: 'car',
    models: ['Fabia', 'Scala', 'Kamiq', 'Octavia', 'Superb', 'Karoq', 'Kodiaq', 'Enyaq']
  },
  {
    name: 'Seat',
    type: 'car',
    models: ['Ibiza', 'Arona', 'Leon', 'Ateca', 'Tarraco']
  },
  {
    name: 'Volvo',
    type: 'car',
    models: ['XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'V90', 'C40', 'EX30']
  },

  // Motosiklet Markaları
  {
    name: 'Yamaha',
    type: 'motorcycle',
    models: ['NMAX 125', 'XMAX 250', 'TMAX', 'YZF-R125', 'YZF-R25', 'YZF-R7', 'YZF-R1', 'MT-25', 'MT-07', 'MT-09', 'MT-10', 'Tenere 700']
  },
  {
    name: 'Honda Moto',
    type: 'motorcycle',
    models: ['Dio', 'Activa125', 'PCX125', 'Forza 250', 'CB125F', 'CB250R', 'CB500F', 'CB650R', 'CBR650R', 'Africa Twin', 'Gold Wing']
  },
  {
    name: 'Vespa',
    type: 'motorcycle',
    models: ['Primavera 150', 'Sprint 150', 'GTS 300', 'Sei Giorni', 'Elettrica']
  },
  {
    name: 'Kawasaki',
    type: 'motorcycle',
    models: ['Ninja 400', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Z400', 'Z650', 'Z900', 'Z H2', 'Versys 650']
  },
  {
    name: 'BMW Motorrad',
    type: 'motorcycle',
    models: ['G 310 R', 'F 900 R', 'S 1000 RR', 'R 1250 GS', 'R 1300 GS', 'C 400 GT', 'CE 04']
  },
  {
    name: 'KTM',
    type: 'motorcycle',
    models: ['Duke 125', 'Duke 250', 'Duke 390', 'Duke 790', 'Duke 890', 'Duke 1290 Super Duke', '390 Adventure', '890 Adventure']
  },
  {
    name: 'Suzuki Moto',
    type: 'motorcycle',
    models: ['Address 125', 'V-Strom 250', 'V-Strom 650', 'Hayabusa', 'GSX-R1000', 'GSX-S750', 'Katana']
  }
];
