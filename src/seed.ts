import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { UserService } from './users/user.service.js';
import { ProductsService } from './products/products.service.js';

/**
 * Seed script: populates the databases with a demo admin user, a demo
 * customer, and a handful of sample products.
 *
 * Run with:  pnpm run seed   (requires PostgreSQL + MongoDB to be running)
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const productsService = app.get(ProductsService);

  console.log('🌱 Seeding database...');

  // --- Demo users -----------------------------------------------------------
  const admin = await userService.CreateUser('admin@demo.com', 'admin123');
  await userService.setRoles(admin.id, ['admin', 'user']);
  console.log(`✅ Admin user created: admin@demo.com / admin123`);

  await userService.CreateUser('user@demo.com', 'user123');
  console.log(`✅ Customer user created: user@demo.com / user123`);

  // --- Sample products ------------------------------------------------------
  const products = [
    {
      Productname: 'Wireless Headphones',
      Productprice: 2499,
      Productdescription: 'Over-ear Bluetooth headphones with active noise cancellation.',
      Productimage: 'https://images.unsplash.com/photo-1505740420928-5e565606d3c0?w=400',
    },
    {
      Productname: 'Mechanical Keyboard',
      Productprice: 3999,
      Productdescription: 'RGB backlit mechanical keyboard with hot-swappable switches.',
      Productimage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    },
    {
      Productname: 'Smart Watch',
      Productprice: 5999,
      Productdescription: 'Fitness tracker with heart-rate monitor and GPS.',
      Productimage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    },
    {
      Productname: 'USB-C Hub',
      Productprice: 1299,
      Productdescription: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader.',
      Productimage: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
    },
    {
      Productname: 'Portable Speaker',
      Productprice: 1799,
      Productdescription: 'Waterproof Bluetooth speaker with 12h battery life.',
      Productimage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    },
  ];

  for (const product of products) {
    await productsService.CreateProduct(product as any);
    console.log(`✅ Product created: ${product.Productname}`);
  }

  console.log('🎉 Seeding complete!');
  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
