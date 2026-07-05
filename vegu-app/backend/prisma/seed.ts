import { PrismaClient, VendorStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Fresh Vegetables', slug: 'fresh-vegetables', icon: '🥕', color: '#51CF66', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80' },
  { name: 'Fresh Fruits', slug: 'fresh-fruits', icon: '🍎', color: '#FF6B6B', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80' },
  { name: 'Leafy Vegetables', slug: 'leafy-vegetables', icon: '🥬', color: '#2F9E44', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80' },
  { name: 'Exotic Vegetables', slug: 'exotic-vegetables', icon: '🥦', color: '#82C91E', image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400&q=80' },
  { name: 'Dairy', slug: 'dairy', icon: '🥛', color: '#74C0FC', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80' },
  { name: 'Rice & Atta', slug: 'rice-atta', icon: '🌾', color: '#F59F00', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
  { name: 'Oil & Ghee', slug: 'oil-ghee', icon: '🫒', color: '#FCC419', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { name: 'Masala & Spices', slug: 'masala-spices', icon: '🌶️', color: '#FA5252', image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80' },
  { name: 'Snacks', slug: 'snacks', icon: '🍿', color: '#FFD43B', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
  { name: 'Beverages', slug: 'beverages', icon: '🧃', color: '#FF8787', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', color: '#C0AFFF', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80' },
  { name: 'Home Care', slug: 'home-care', icon: '🧽', color: '#66D9E8', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' },
  { name: 'Baby Care', slug: 'baby-care', icon: '🍼', color: '#F783AC', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80' },
  { name: 'Pet Supplies', slug: 'pet-supplies', icon: '🐾', color: '#9775FA', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80' },
];

async function main() {
  console.log('🌱 Seeding VEGU database...\n');

  // Admin user
  const adminEmail = 'lokeshreddym2005@gmail.com';
  const adminPassword = await bcrypt.hash('Lokesh270327', 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Lokesh Admin',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: 'Lokesh Admin',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  const opsPassword = await bcrypt.hash('Ops@2024', 12);
  const operationsAdmin = await prisma.user.upsert({
    where: { email: 'ops@vegu.app' },
    update: {
      name: 'Store Operations',
      password: opsPassword,
      role: 'OWNER',
      isVerified: true,
      isActive: true,
    },
    create: {
      email: 'ops@vegu.app',
      name: 'Store Operations',
      password: opsPassword,
      role: 'OWNER',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Store Ops admin created:', operationsAdmin.email);

  const nelloreStore = await prisma.store.upsert({
    where: { slug: 'nellore-store-1' },
    update: {
      name: 'Nellore Store 1',
      code: 'NEL-1',
      city: 'Nellore',
      state: 'Andhra Pradesh',
      managerId: operationsAdmin.id,
      isActive: true,
    },
    create: {
      name: 'Nellore Store 1',
      slug: 'nellore-store-1',
      code: 'NEL-1',
      city: 'Nellore',
      state: 'Andhra Pradesh',
      managerId: operationsAdmin.id,
      isActive: true,
    },
  });

  const tirupatiStore = await prisma.store.upsert({
    where: { slug: 'tirupati-store-1' },
    update: {
      name: 'Tirupati Store 1',
      code: 'TIR-1',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      isActive: true,
    },
    create: {
      name: 'Tirupati Store 1',
      slug: 'tirupati-store-1',
      code: 'TIR-1',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      isActive: true,
    },
  });

  // Vendor user
  const vendorPassword = await bcrypt.hash('Vendor@2024', 12);
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@vegu.app' },
    update: {},
    create: {
      email: 'vendor@vegu.app',
      name: 'Fresh Farms',
      password: vendorPassword,
      role: 'VENDOR',
      isVerified: true,
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: { storeId: nelloreStore.id },
    create: {
      userId: vendorUser.id,
      storeName: 'Fresh Farms Direct',
      storeSlug: 'fresh-farms-direct',
      description: 'Premium farm-fresh produce delivered daily',
      storeId: nelloreStore.id,
      status: VendorStatus.APPROVED,
      isActive: true,
    },
  });
  console.log('✅ Vendor created:', vendorUser.email);

  const vendorTwoPassword = await bcrypt.hash('Vendor@2024', 12);
  const vendorTwoUser = await prisma.user.upsert({
    where: { email: 'tirupati@vegu.app' },
    update: {},
    create: {
      email: 'tirupati@vegu.app',
      name: 'Vegu Tirupati',
      password: vendorTwoPassword,
      role: 'VENDOR',
      isVerified: true,
    },
  });

  const vendorTwo = await prisma.vendor.upsert({
    where: { userId: vendorTwoUser.id },
    update: { storeId: tirupatiStore.id },
    create: {
      userId: vendorTwoUser.id,
      storeName: 'VEGU Tirupati Central',
      storeSlug: 'vegu-tirupati-central',
      description: 'Tirupati store for fast grocery operations',
      storeId: tirupatiStore.id,
      status: VendorStatus.APPROVED,
      isActive: true,
    },
  });
  console.log('✅ Second store created:', vendorTwoUser.email);

  // Customer user
  const customerPassword = await bcrypt.hash('Customer@2024', 12);
  await prisma.user.upsert({
    where: { email: 'customer@vegu.app' },
    update: {},
    create: {
      email: 'customer@vegu.app',
      name: 'Raj Kumar',
      password: customerPassword,
      role: 'CUSTOMER',
      isVerified: true,
    },
  });
  console.log('✅ Customer created: customer@vegu.app');

  // Categories
  const createdCats = await Promise.all(
    CATEGORIES.map((c, i) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: { ...c, sortOrder: i },
      })
    )
  );
  const catMap = Object.fromEntries(createdCats.map(c => [c.slug, c.id]));
  console.log(`✅ Categories created: ${createdCats.length}`);

  // Products
  const PRODUCTS = [
    { name: 'Alphonso Mangoes Premium', slug: 'alphonso-mangoes', brand: 'Fresh Farms', price: 250, comparePrice: 320, purchasePrice: 190, stock: 80, minStockAlert: 12, batchNumber: 'NEL-FRT-001', discount: 22, rating: 4.9, unit: '1 kg', categoryId: catMap['fresh-fruits'], isFeatured: true, isTrending: true, images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80'], store: 'nellore' },
    { name: 'Kashmiri Red Apples', slug: 'red-apples', brand: 'Fresh Farms', price: 140, comparePrice: 180, purchasePrice: 105, stock: 120, minStockAlert: 15, batchNumber: 'NEL-FRT-002', discount: 22, rating: 4.5, unit: '1 kg', categoryId: catMap['fresh-fruits'], isFeatured: true, images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80'], store: 'nellore' },
    { name: 'Fresh Strawberries Pack', slug: 'fresh-strawberries', brand: 'Berry Fresh', price: 120, comparePrice: 160, purchasePrice: 88, stock: 60, minStockAlert: 8, batchNumber: 'TIR-FRT-001', discount: 25, rating: 4.7, unit: '250 g', categoryId: catMap['fresh-fruits'], isFeatured: true, images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80'], store: 'tirupati' },
    { name: 'Banana Robusta Bunch', slug: 'bananas-dozen', brand: 'Farm Select', price: 49, comparePrice: 60, purchasePrice: 34, stock: 200, minStockAlert: 20, batchNumber: 'NEL-FRT-003', discount: 18, rating: 4.4, unit: '12 pcs', categoryId: catMap['fresh-fruits'], images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80'], store: 'nellore' },
    { name: 'Sweet Watermelon', slug: 'watermelon', brand: 'Farm Select', price: 85, purchasePrice: 58, stock: 40, minStockAlert: 6, batchNumber: 'TIR-FRT-002', rating: 4.3, unit: '1 piece', categoryId: catMap['fresh-fruits'], images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80'], store: 'tirupati' },
    { name: 'Fresh Tomato Loose', slug: 'organic-tomatoes', brand: 'Vegu Fresh', price: 45, comparePrice: 60, purchasePrice: 28, stock: 300, minStockAlert: 25, batchNumber: 'NEL-VEG-001', discount: 25, rating: 4.3, unit: '500 g', categoryId: catMap['fresh-vegetables'], isFeatured: true, images: ['https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&q=80'], store: 'nellore' },
    { name: 'Red Onion Loose', slug: 'red-onions', brand: 'Vegu Fresh', price: 35, purchasePrice: 20, stock: 400, minStockAlert: 30, batchNumber: 'NEL-VEG-002', rating: 4.0, unit: '1 kg', categoryId: catMap['fresh-vegetables'], images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80'], store: 'nellore' },
    { name: 'Potato Loose', slug: 'potatoes', brand: 'Vegu Fresh', price: 50, purchasePrice: 30, stock: 350, minStockAlert: 30, batchNumber: 'NEL-VEG-003', rating: 4.1, unit: '1 kg', categoryId: catMap['fresh-vegetables'], images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80'], store: 'nellore' },
    { name: 'Fresh Carrot Pack', slug: 'fresh-carrots', brand: 'Vegu Fresh', price: 45, purchasePrice: 27, stock: 180, minStockAlert: 18, batchNumber: 'TIR-VEG-001', rating: 4.3, unit: '500 g', categoryId: catMap['fresh-vegetables'], images: ['https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&q=80'], store: 'tirupati' },
    { name: 'Baby Spinach Leaf', slug: 'baby-spinach', brand: 'Leaf Basket', price: 35, purchasePrice: 20, stock: 150, minStockAlert: 15, batchNumber: 'NEL-LFY-001', rating: 4.2, unit: '250 g', categoryId: catMap['leafy-vegetables'], images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80'], store: 'nellore' },
    { name: 'Coriander Leaves', slug: 'coriander-leaves', brand: 'Leaf Basket', price: 12, purchasePrice: 6, stock: 220, minStockAlert: 20, batchNumber: 'NEL-LFY-002', rating: 4.1, unit: '100 g', categoryId: catMap['leafy-vegetables'], images: ['https://images.unsplash.com/photo-1603048719539-9ecb4f5ea417?w=600&q=80'], store: 'nellore' },
    { name: 'Lettuce Iceberg', slug: 'lettuce-iceberg', brand: 'Exotic Greens', price: 70, purchasePrice: 46, stock: 70, minStockAlert: 10, batchNumber: 'TIR-EXO-001', rating: 4.4, unit: '1 head', categoryId: catMap['exotic-vegetables'], images: ['https://images.unsplash.com/photo-1622205313162-be1d5712a43d?w=600&q=80'], store: 'tirupati' },
    { name: 'Broccoli Crown', slug: 'broccoli-crown', brand: 'Exotic Greens', price: 90, purchasePrice: 62, stock: 55, minStockAlert: 8, batchNumber: 'TIR-EXO-002', rating: 4.5, unit: '250 g', categoryId: catMap['exotic-vegetables'], images: ['https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80'], store: 'tirupati' },
    { name: 'Amul Toned Milk', slug: 'amul-toned-milk', brand: 'Amul', price: 62, purchasePrice: 49, stock: 250, minStockAlert: 25, batchNumber: 'NEL-DRY-001', rating: 4.7, unit: '1 litre', categoryId: catMap['dairy'], isFeatured: true, images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80'], store: 'nellore' },
    { name: 'Farm Fresh Eggs Tray', slug: 'farm-fresh-eggs', brand: 'Country Eggs', price: 95, purchasePrice: 74, stock: 180, minStockAlert: 18, batchNumber: 'NEL-DRY-002', rating: 4.8, unit: '12 eggs', categoryId: catMap['dairy'], isFeatured: true, images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80'], store: 'nellore' },
    { name: 'Amul Paneer Block', slug: 'amul-paneer-block', brand: 'Amul', price: 90, comparePrice: 110, purchasePrice: 68, stock: 100, minStockAlert: 12, batchNumber: 'NEL-DRY-003', discount: 18, rating: 4.6, unit: '200 g', categoryId: catMap['dairy'], images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80'], store: 'nellore' },
    { name: 'Nandini Curd', slug: 'nandini-curd', brand: 'Nandini', price: 40, purchasePrice: 28, stock: 110, minStockAlert: 12, batchNumber: 'TIR-DRY-001', rating: 4.3, unit: '400 g', categoryId: catMap['dairy'], images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80'], store: 'tirupati' },
    { name: 'A2 Desi Ghee', slug: 'a2-desi-ghee', brand: 'Anveshan', price: 640, comparePrice: 710, purchasePrice: 510, stock: 45, minStockAlert: 6, batchNumber: 'NEL-OIL-001', rating: 4.8, unit: '500 ml', categoryId: catMap['oil-ghee'], images: ['https://images.unsplash.com/photo-1514996937319-344454492b37?w=600&q=80'], store: 'nellore' },
    { name: 'Fortune Sunflower Oil', slug: 'fortune-sunflower-oil', brand: 'Fortune', price: 175, comparePrice: 190, purchasePrice: 150, stock: 95, minStockAlert: 12, batchNumber: 'NEL-OIL-002', rating: 4.5, unit: '1 litre', categoryId: catMap['oil-ghee'], images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80'], store: 'nellore' },
    { name: 'Saffola Gold Oil', slug: 'saffola-gold-oil', brand: 'Saffola', price: 205, purchasePrice: 178, stock: 88, minStockAlert: 10, batchNumber: 'TIR-OIL-001', rating: 4.4, unit: '1 litre', categoryId: catMap['oil-ghee'], images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80'], store: 'tirupati' },
    { name: 'Aged Basmati Rice', slug: 'aged-basmati-rice', brand: 'India Gate', price: 190, comparePrice: 240, purchasePrice: 148, stock: 200, minStockAlert: 20, batchNumber: 'NEL-RIC-001', discount: 21, rating: 4.8, unit: '1 kg', categoryId: catMap['rice-atta'], isFeatured: true, images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80'], store: 'nellore' },
    { name: 'Sona Masoori Rice', slug: 'sona-masoori-rice', brand: 'Daawat', price: 82, purchasePrice: 64, stock: 210, minStockAlert: 24, batchNumber: 'TIR-RIC-001', rating: 4.4, unit: '1 kg', categoryId: catMap['rice-atta'], images: ['https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80'], store: 'tirupati' },
    { name: 'Aashirvaad Whole Wheat Atta', slug: 'whole-wheat-atta', brand: 'Aashirvaad', price: 88, purchasePrice: 68, stock: 200, minStockAlert: 20, batchNumber: 'NEL-ATT-001', rating: 4.4, unit: '1 kg', categoryId: catMap['rice-atta'], images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80'], store: 'nellore' },
    { name: 'Besan Flour', slug: 'besan-flour', brand: '24 Mantra', price: 72, purchasePrice: 54, stock: 140, minStockAlert: 14, batchNumber: 'TIR-ATT-001', rating: 4.2, unit: '500 g', categoryId: catMap['rice-atta'], images: ['https://images.unsplash.com/photo-1559767949-0faa5c7e9992?w=600&q=80'], store: 'tirupati' },
    { name: 'Garam Masala', slug: 'garam-masala', brand: 'Everest', price: 68, purchasePrice: 46, stock: 130, minStockAlert: 14, batchNumber: 'NEL-SPC-001', rating: 4.5, unit: '100 g', categoryId: catMap['masala-spices'], images: ['https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80'], store: 'nellore' },
    { name: 'Turmeric Powder', slug: 'turmeric-powder', brand: 'Aachi', price: 34, purchasePrice: 22, stock: 180, minStockAlert: 18, batchNumber: 'NEL-SPC-002', rating: 4.6, unit: '100 g', categoryId: catMap['masala-spices'], images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80'], store: 'nellore' },
    { name: 'Chilli Powder', slug: 'chilli-powder', brand: 'Aachi', price: 42, purchasePrice: 30, stock: 170, minStockAlert: 16, batchNumber: 'TIR-SPC-001', rating: 4.4, unit: '100 g', categoryId: catMap['masala-spices'], images: ['https://images.unsplash.com/photo-1615485737651-72d09f85f8b4?w=600&q=80'], store: 'tirupati' },
    { name: 'Tata Salt', slug: 'tata-salt', brand: 'Tata', price: 28, purchasePrice: 18, stock: 240, minStockAlert: 24, batchNumber: 'NEL-SPC-003', rating: 4.7, unit: '1 kg', categoryId: catMap['masala-spices'], images: ['https://images.unsplash.com/photo-1518110925495-b3762b6a5a97?w=600&q=80'], store: 'nellore' },
    { name: 'Dark Chocolate 70 Percent', slug: 'dark-chocolate-70', brand: 'Lindt', price: 165, comparePrice: 220, purchasePrice: 126, stock: 100, minStockAlert: 12, batchNumber: 'NEL-SNK-001', discount: 25, rating: 4.8, unit: '100 g', categoryId: catMap['snacks'], isFeatured: true, isTrending: true, images: ['https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80'], store: 'nellore' },
    { name: 'Potato Chips Masala', slug: 'crispy-potato-chips', brand: 'Lays', price: 30, purchasePrice: 18, stock: 300, minStockAlert: 25, batchNumber: 'NEL-SNK-002', rating: 4.2, unit: '73 g', categoryId: catMap['snacks'], images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80'], store: 'nellore' },
    { name: 'Marie Gold Biscuits', slug: 'marie-gold-biscuits', brand: 'Britannia', price: 38, purchasePrice: 24, stock: 220, minStockAlert: 20, batchNumber: 'TIR-SNK-001', rating: 4.3, unit: '250 g', categoryId: catMap['snacks'], images: ['https://images.unsplash.com/photo-1582053433976-25c00369fc93?w=600&q=80'], store: 'tirupati' },
    { name: 'Haldiram Aloo Bhujia', slug: 'haldiram-aloo-bhujia', brand: 'Haldiram', price: 62, purchasePrice: 46, stock: 115, minStockAlert: 14, batchNumber: 'TIR-SNK-002', rating: 4.6, unit: '200 g', categoryId: catMap['snacks'], images: ['https://images.unsplash.com/photo-1604908176997-431c3a7d36a7?w=600&q=80'], store: 'tirupati' },
    { name: 'Fresh Orange Juice', slug: 'cold-pressed-oj', brand: 'Paper Boat', price: 110, comparePrice: 145, purchasePrice: 86, stock: 120, minStockAlert: 12, batchNumber: 'NEL-BEV-001', discount: 24, rating: 4.6, unit: '1 litre', categoryId: catMap['beverages'], isFeatured: true, isTrending: true, images: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=80'], store: 'nellore' },
    { name: 'Green Tea Bags', slug: 'premium-green-tea', brand: 'Tetley', price: 130, comparePrice: 160, purchasePrice: 98, stock: 100, minStockAlert: 10, batchNumber: 'NEL-BEV-002', discount: 19, rating: 4.5, unit: '25 bags', categoryId: catMap['beverages'], images: ['https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&q=80'], store: 'nellore' },
    { name: 'Bru Instant Coffee', slug: 'bru-instant-coffee', brand: 'Bru', price: 168, purchasePrice: 132, stock: 90, minStockAlert: 10, batchNumber: 'TIR-BEV-001', rating: 4.5, unit: '100 g', categoryId: catMap['beverages'], images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80'], store: 'tirupati' },
    { name: 'Dove Soap', slug: 'dove-soap', brand: 'Dove', price: 46, purchasePrice: 31, stock: 160, minStockAlert: 18, batchNumber: 'NEL-PC-001', rating: 4.5, unit: '100 g', categoryId: catMap['personal-care'], images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80'], store: 'nellore' },
    { name: 'Clinic Plus Shampoo', slug: 'clinic-plus-shampoo', brand: 'Clinic Plus', price: 128, purchasePrice: 96, stock: 100, minStockAlert: 10, batchNumber: 'NEL-PC-002', rating: 4.2, unit: '340 ml', categoryId: catMap['personal-care'], images: ['https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&q=80'], store: 'nellore' },
    { name: 'Colgate Strong Teeth', slug: 'colgate-strong-teeth', brand: 'Colgate', price: 62, purchasePrice: 44, stock: 135, minStockAlert: 15, batchNumber: 'TIR-PC-001', rating: 4.6, unit: '200 g', categoryId: catMap['personal-care'], images: ['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80'], store: 'tirupati' },
    { name: 'Surf Excel Matic', slug: 'surf-excel-matic', brand: 'Surf Excel', price: 210, purchasePrice: 168, stock: 90, minStockAlert: 10, batchNumber: 'NEL-HC-001', rating: 4.7, unit: '1 kg', categoryId: catMap['home-care'], images: ['https://images.unsplash.com/photo-1583947582886-f40ec95dd752?w=600&q=80'], store: 'nellore' },
    { name: 'Vim Dishwash Gel', slug: 'vim-dishwash-gel', brand: 'Vim', price: 92, purchasePrice: 68, stock: 105, minStockAlert: 12, batchNumber: 'NEL-HC-002', rating: 4.4, unit: '750 ml', categoryId: catMap['home-care'], images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80'], store: 'nellore' },
    { name: 'Lizol Floor Cleaner', slug: 'lizol-floor-cleaner', brand: 'Lizol', price: 155, purchasePrice: 120, stock: 78, minStockAlert: 10, batchNumber: 'TIR-HC-001', rating: 4.5, unit: '1 litre', categoryId: catMap['home-care'], images: ['https://images.unsplash.com/photo-1626806787461-102c1a67e0c8?w=600&q=80'], store: 'tirupati' },
    { name: 'Pampers Diaper Pants', slug: 'pampers-diaper-pants', brand: 'Pampers', price: 499, purchasePrice: 410, stock: 42, minStockAlert: 5, batchNumber: 'NEL-BC-001', rating: 4.8, unit: 'M 34 pcs', categoryId: catMap['baby-care'], images: ['https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'], store: 'nellore' },
    { name: 'Himalaya Baby Lotion', slug: 'himalaya-baby-lotion', brand: 'Himalaya', price: 175, purchasePrice: 136, stock: 64, minStockAlert: 8, batchNumber: 'TIR-BC-001', rating: 4.5, unit: '200 ml', categoryId: catMap['baby-care'], images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80'], store: 'tirupati' },
    { name: 'Pedigree Adult Dog Food', slug: 'pedigree-dog-food', brand: 'Pedigree', price: 299, purchasePrice: 238, stock: 58, minStockAlert: 8, batchNumber: 'NEL-PET-001', rating: 4.7, unit: '1.2 kg', categoryId: catMap['pet-supplies'], images: ['https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&q=80'], store: 'nellore' },
    { name: 'Whiskas Ocean Fish', slug: 'whiskas-ocean-fish', brand: 'Whiskas', price: 145, purchasePrice: 112, stock: 72, minStockAlert: 10, batchNumber: 'TIR-PET-001', rating: 4.6, unit: '480 g', categoryId: catMap['pet-supplies'], images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80'], store: 'tirupati' },
  ];

  let productCount = 0;
  for (const p of PRODUCTS) {
    const { store, ...productData } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        price: p.price,
        brand: p.brand ?? null,
        comparePrice: p.comparePrice ?? null,
        purchasePrice: p.purchasePrice ?? null,
        stock: p.stock,
        minStockAlert: p.minStockAlert ?? 10,
        batchNumber: p.batchNumber ?? null,
        discount: p.discount ?? 0,
        rating: p.rating,
        unit: p.unit,
        categoryId: p.categoryId,
        vendorId: store === 'tirupati' ? vendorTwo.id : vendor.id,
        storeId: store === 'tirupati' ? tirupatiStore.id : nelloreStore.id,
        isFeatured: p.isFeatured ?? false,
        isTrending: p.isTrending ?? false,
        images: p.images,
        description: `Premium quality ${p.name.toLowerCase()}. Sourced fresh daily for maximum nutrition and taste.`,
        tags: [p.name.toLowerCase().split(' ')[0], 'fresh', 'premium'],
      },
      create: {
        ...productData,
        vendorId: store === 'tirupati' ? vendorTwo.id : vendor.id,
        storeId: store === 'tirupati' ? tirupatiStore.id : nelloreStore.id,
        comparePrice: p.comparePrice ?? null,
        purchasePrice: p.purchasePrice ?? null,
        minStockAlert: p.minStockAlert ?? 10,
        batchNumber: p.batchNumber ?? null,
        discount: p.discount ?? 0,
        isFeatured: p.isFeatured ?? false,
        isTrending: p.isTrending ?? false,
        description: `Premium quality ${p.name.toLowerCase()}. Sourced fresh daily for maximum nutrition and taste.`,
        tags: [p.name.toLowerCase().split(' ')[0], 'fresh', 'premium'],
      },
    });
    productCount++;
  }
  console.log(`✅ Products created: ${productCount}`);

  const inventoryManagerPass = await bcrypt.hash('Inventory@2024', 12);
  const inventoryManager = await prisma.user.upsert({
    where: { email: 'inventory.nellore@vegu.app' },
    update: {
      role: 'INVENTORY_MANAGER',
      password: inventoryManagerPass,
      isVerified: true,
      isActive: true,
    },
    create: {
      email: 'inventory.nellore@vegu.app',
      name: 'Nellore Inventory Lead',
      password: inventoryManagerPass,
      role: 'INVENTORY_MANAGER',
      isVerified: true,
      isActive: true,
    },
  });

  const packingStaffPass = await bcrypt.hash('Packing@2024', 12);
  const packingStaff = await prisma.user.upsert({
    where: { email: 'packing.nellore@vegu.app' },
    update: {
      role: 'PACKING_STAFF',
      password: packingStaffPass,
      isVerified: true,
      isActive: true,
    },
    create: {
      email: 'packing.nellore@vegu.app',
      name: 'Nellore Packing Staff',
      password: packingStaffPass,
      role: 'PACKING_STAFF',
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: inventoryManager.id },
    update: {
      storeId: nelloreStore.id,
      status: 'ACTIVE',
      createdById: operationsAdmin.id,
    },
    create: {
      userId: inventoryManager.id,
      storeId: nelloreStore.id,
      employeeCode: 'NEL-INV-001',
      status: 'ACTIVE',
      createdById: operationsAdmin.id,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: packingStaff.id },
    update: {
      storeId: nelloreStore.id,
      status: 'ACTIVE',
      createdById: operationsAdmin.id,
    },
    create: {
      userId: packingStaff.id,
      storeId: nelloreStore.id,
      employeeCode: 'NEL-PCK-001',
      status: 'ACTIVE',
      createdById: operationsAdmin.id,
    },
  });

  // Banners
  await prisma.banner.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Fresh Fruits & Veggies', subtitle: 'Delivered in 30 minutes', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1200&q=80', link: '/products?category=fresh-fruits', sortOrder: 1 },
      { title: 'Dairy Essentials', subtitle: 'Farm to your door', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1200&q=80', link: '/products?category=dairy', sortOrder: 2 },
      { title: 'Weekly Essentials', subtitle: 'Save up to 30%', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80', link: '/products', sortOrder: 3 },
    ],
  });
  console.log('✅ Banners created');

  // Coupons
  const COUPONS = [
    { code: 'VEGU10',  description: '10% off on your order',              discountType: 'percentage', discountValue: 10,  minOrderValue: 100, maxDiscount: 50,  isActive: true },
    { code: 'VEGU20',  description: '20% off on orders above ₹300',       discountType: 'percentage', discountValue: 20,  minOrderValue: 300, maxDiscount: 100, isActive: true },
    { code: 'FRESH50', description: 'Flat ₹50 off on your first order',   discountType: 'flat',       discountValue: 50,  minOrderValue: 200, isActive: true },
    { code: 'SAVE100', description: 'Flat ₹100 off on orders above ₹500', discountType: 'flat',       discountValue: 100, minOrderValue: 500, isActive: true },
    { code: 'FREEDEL', description: '₹40 delivery fee waived on any order', discountType: 'flat',     discountValue: 40,  minOrderValue: 1,   isActive: true },
  ];
  for (const c of COUPONS) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: c, create: c });
  }
  console.log(`✅ Coupons seeded: ${COUPONS.map(c => c.code).join(', ')}`);

  console.log('\n🎉 Seed complete!');
  console.log('─'.repeat(40));
  console.log('Admin:    lokeshreddym2005@gmail.com / Lokesh270327');
  console.log('StoreOps: ops@vegu.app / Ops@2024');
  console.log('Vendor:   vendor@vegu.app   / Vendor@2024');
  console.log('Customer: customer@vegu.app / Customer@2024');
  console.log('─'.repeat(40));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
