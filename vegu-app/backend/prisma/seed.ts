import { PrismaClient, VendorStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Fruits',          slug: 'fruits',          icon: '🍎', color: '#FF6B6B', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80' },
  { name: 'Vegetables',      slug: 'vegetables',      icon: '🥦', color: '#51CF66', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80' },
  { name: 'Dairy & Eggs',    slug: 'dairy-eggs',      icon: '🥛', color: '#74C0FC', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80' },
  { name: 'Snacks',          slug: 'snacks',          icon: '🍿', color: '#FFD43B', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
  { name: 'Beverages',       slug: 'beverages',       icon: '🧃', color: '#FF8787', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { name: 'Grains & Pulses', slug: 'grains-pulses',   icon: '🌾', color: '#FFA94D', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
  { name: 'Meat & Seafood',  slug: 'meat-seafood',    icon: '🍖', color: '#F783AC', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80' },
  { name: 'Bakery',          slug: 'bakery',          icon: '🍞', color: '#D9480F', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80' },
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
    update: {},
    create: {
      userId: vendorUser.id,
      storeName: 'Fresh Farms Direct',
      storeSlug: 'fresh-farms-direct',
      description: 'Premium farm-fresh produce delivered daily',
      status: VendorStatus.APPROVED,
      isActive: true,
    },
  });
  console.log('✅ Vendor created:', vendorUser.email);

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
    { name: 'Alphonso Mangoes Premium', slug: 'alphonso-mangoes', price: 250, comparePrice: 320, stock: 80, discount: 22, rating: 4.9, unit: '1 kg', categoryId: catMap['fruits'], isFeatured: true, isTrending: true, images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80'] },
    { name: 'Kashmiri Red Apples', slug: 'red-apples', price: 140, comparePrice: 180, stock: 120, discount: 22, rating: 4.5, unit: '1 kg', categoryId: catMap['fruits'], isFeatured: true, images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80'] },
    { name: 'Fresh Strawberries Pack', slug: 'fresh-strawberries', price: 120, comparePrice: 160, stock: 60, discount: 25, rating: 4.7, unit: '250 g', categoryId: catMap['fruits'], isFeatured: true, images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80'] },
    { name: 'Banana Robusta Bunch', slug: 'bananas-dozen', price: 49, comparePrice: 60, stock: 200, discount: 18, rating: 4.4, unit: '12 pcs', categoryId: catMap['fruits'], images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80'] },
    { name: 'Sweet Watermelon', slug: 'watermelon', price: 85, stock: 40, rating: 4.3, unit: '1 piece', categoryId: catMap['fruits'], images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80'] },
    { name: 'Fresh Tomato Loose', slug: 'organic-tomatoes', price: 45, comparePrice: 60, stock: 300, discount: 25, rating: 4.3, unit: '500 g', categoryId: catMap['vegetables'], isFeatured: true, images: ['https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&q=80'] },
    { name: 'Baby Spinach Leaf', slug: 'baby-spinach', price: 35, stock: 150, rating: 4.2, unit: '250 g', categoryId: catMap['vegetables'], images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80'] },
    { name: 'Red Onion Loose', slug: 'red-onions', price: 35, stock: 400, rating: 4.0, unit: '1 kg', categoryId: catMap['vegetables'], images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80'] },
    { name: 'Potato Loose', slug: 'potatoes', price: 50, stock: 350, rating: 4.1, unit: '1 kg', categoryId: catMap['vegetables'], images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80'] },
    { name: 'Bell Peppers Mixed Pack', slug: 'rainbow-bell-peppers', price: 95, comparePrice: 130, stock: 80, discount: 27, rating: 4.6, unit: '3 pcs', categoryId: catMap['vegetables'], isFeatured: true, isTrending: true, images: ['https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=600&q=80'] },
    { name: 'Fresh Carrot Pack', slug: 'fresh-carrots', price: 45, stock: 180, rating: 4.3, unit: '500 g', categoryId: catMap['vegetables'], images: ['https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&q=80'] },
    { name: 'Amul Toned Milk', slug: 'full-cream-milk', price: 62, stock: 250, rating: 4.7, unit: '1 litre', categoryId: catMap['dairy-eggs'], isFeatured: true, images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80'] },
    { name: 'Farm Fresh Eggs Tray', slug: 'farm-fresh-eggs', price: 95, stock: 180, rating: 4.8, unit: '12 eggs', categoryId: catMap['dairy-eggs'], isFeatured: true, images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80'] },
    { name: 'Amul Paneer Block', slug: 'soft-paneer', price: 90, comparePrice: 110, stock: 100, discount: 18, rating: 4.6, unit: '200 g', categoryId: catMap['dairy-eggs'], images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80'] },
    { name: 'Greek Yogurt Plain', slug: 'greek-yogurt', price: 55, stock: 120, rating: 4.5, unit: '400 g', categoryId: catMap['dairy-eggs'], images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80'] },
    { name: 'Dark Chocolate 70 Percent', slug: 'dark-chocolate-70', price: 165, comparePrice: 220, stock: 100, discount: 25, rating: 4.8, unit: '100 g', categoryId: catMap['snacks'], isFeatured: true, isTrending: true, images: ['https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80'] },
    { name: 'Mixed Nuts Premium', slug: 'mixed-nuts-premium', price: 220, comparePrice: 280, stock: 80, discount: 21, rating: 4.7, unit: '250 g', categoryId: catMap['snacks'], isFeatured: true, images: ['https://images.unsplash.com/photo-1563191911-e65a8e97e7e6?w=600&q=80'] },
    { name: 'Potato Chips Masala', slug: 'crispy-potato-chips', price: 30, stock: 300, rating: 4.2, unit: '73 g', categoryId: catMap['snacks'], images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80'] },
    { name: 'Fresh Orange Juice', slug: 'cold-pressed-oj', price: 110, comparePrice: 145, stock: 120, discount: 24, rating: 4.6, unit: '1 litre', categoryId: catMap['beverages'], isFeatured: true, isTrending: true, images: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=80'] },
    { name: 'Green Tea Bags', slug: 'premium-green-tea', price: 130, comparePrice: 160, stock: 100, discount: 19, rating: 4.5, unit: '25 bags', categoryId: catMap['beverages'], images: ['https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&q=80'] },
    { name: 'Sparkling Water', slug: 'sparkling-water', price: 45, stock: 200, rating: 4.1, unit: '1 litre', categoryId: catMap['beverages'], images: ['https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&q=80'] },
    { name: 'Aged Basmati Rice', slug: 'aged-basmati-rice', price: 190, comparePrice: 240, stock: 200, discount: 21, rating: 4.8, unit: '1 kg', categoryId: catMap['grains-pulses'], isFeatured: true, images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80'] },
    { name: 'Masoor Dal Premium', slug: 'masoor-dal', price: 115, stock: 180, rating: 4.3, unit: '500 g', categoryId: catMap['grains-pulses'], images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'] },
    { name: 'Aashirvaad Whole Wheat Atta', slug: 'whole-wheat-atta', price: 88, stock: 200, rating: 4.4, unit: '1 kg', categoryId: catMap['grains-pulses'], images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80'] },
  ];

  let productCount = 0;
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        discount: p.discount ?? 0,
        rating: p.rating,
        unit: p.unit,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured ?? false,
        isTrending: p.isTrending ?? false,
        images: p.images,
        description: `Premium quality ${p.name.toLowerCase()}. Sourced fresh daily for maximum nutrition and taste.`,
        tags: [p.name.toLowerCase().split(' ')[0], 'fresh', 'premium'],
      },
      create: {
        ...p,
        vendorId: vendor.id,
        comparePrice: p.comparePrice ?? null,
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

  // Banners
  await prisma.banner.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Fresh Fruits & Veggies', subtitle: 'Delivered in 30 minutes', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1200&q=80', link: '/products?category=fruits', sortOrder: 1 },
      { title: 'Dairy & Eggs', subtitle: 'Farm to your door', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1200&q=80', link: '/products?category=dairy-eggs', sortOrder: 2 },
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
  console.log('Vendor:   vendor@vegu.app   / Vendor@2024');
  console.log('Customer: customer@vegu.app / Customer@2024');
  console.log('─'.repeat(40));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
