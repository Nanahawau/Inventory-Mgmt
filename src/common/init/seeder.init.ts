import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Store } from '../../store/entities/store.entity';
import { Product } from '../../product/entities/product.entity';
import { Sku } from '../../sku/entities/sku.entity';
import { InventoryItem } from '../../stock/entities/inventoryitems.entity';
import { SkuStock } from '../../stock/entities/skustock.entity';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const ds = app.get(DataSource);

    const userRepo = ds.getRepository(User);
    const storeRepo = ds.getRepository(Store);
    const productRepo = ds.getRepository(Product);
    const skuRepo = ds.getRepository(Sku);
    const inventoryRepo = ds.getRepository(InventoryItem);
    const skuStockRepo = ds.getRepository(SkuStock);

    // 1) Admin user
    const adminEmail = 'admin@gmail.com';
    let admin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const newAdmin = userRepo.create({
        email: adminEmail,
        password: 'admin', // hash here if your entity doesn't auto-hash
      });
      admin = await userRepo.save(newAdmin);
      console.log(`Seed: created admin user ${adminEmail}`);
    } else {
      console.log(`Seed: admin user ${adminEmail} already exists`);
    }

    // 2) Store
    const storeName = 'Central';
    let store = await storeRepo.findOne({ where: { name: storeName } });
    if (!store) {
      const newStore = storeRepo.create({ name: storeName, location: 'HQ' });
      store = await storeRepo.save(newStore);
      console.log(`Seed: created store "${storeName}" (#${store.id})`);
    } else {
      console.log(`Seed: store "${storeName}" already exists (#${store.id})`);
    }
    if (!store) throw new Error('Seed: store not initialized');

    // 3) Product
    const productName = 'Sample Product';
    let product = await productRepo.findOne({ where: { name: productName } });
    if (!product) {
      const newProduct = productRepo.create({
        name: productName,
        category: 'General',
        price: 9.99,
        description: 'Seeded product',
      });
      product = await productRepo.save(newProduct);
      console.log(`Seed: created product "${product.name}" (#${product.id})`);
    } else {
      console.log(`Seed: product "${product.name}" already exists (#${product.id})`);
    }
    if (!product) throw new Error('Seed: product not initialized');

    // 4) SKUs (idempotent by skuCode + product)
    const desiredSkus: Array<{ skuCode: string; attributes?: Record<string, string> }> = [
      { skuCode: 'SP-RED-M', attributes: { color: 'red', size: 'M' } },
      { skuCode: 'SP-BLU-L', attributes: { color: 'blue', size: 'L' } },
    ];

    for (const s of desiredSkus) {
      let sku = await skuRepo.findOne({
        where: { skuCode: s.skuCode, product: { id: product.id } },
        relations: { product: true },
      });
      if (!sku) {
        const newSku = skuRepo.create({
          skuCode: s.skuCode,
          attributes: s.attributes, // undefined if absent
          product: { id: product.id },
        });
        sku = await skuRepo.save(newSku);
        console.log(`Seed: created SKU ${sku.skuCode} (#${sku.id})`);
      } else {
        const changed =
          JSON.stringify(sku.attributes ?? {}) !== JSON.stringify(s.attributes ?? {});
        if (changed) {
          sku.attributes = s.attributes;
          await skuRepo.save(sku);
          console.log(`Seed: updated SKU ${sku.skuCode} attributes`);
        } else {
          console.log(`Seed: SKU ${sku.skuCode} already exists (#${sku.id})`);
        }
      }
    }

    // 5) InventoryItem for store+product
    let inv = await inventoryRepo.findOne({
      where: { store: { id: store.id }, product: { id: product.id } },
    });
    if (!inv) {
      const newInv = inventoryRepo.create({
        store: { id: store.id },
        product: { id: product.id },
      });
      inv = await inventoryRepo.save(newInv);
      console.log(
        `Seed: created InventoryItem (#${inv.id}) for store "${store.name}" & product "${product.name}"`
      );
    } else {
      console.log(`Seed: InventoryItem already exists (#${inv.id})`);
    }
    if (!inv) throw new Error('Seed: inventory item not initialized');

    // 6) SkuStock for each SKU in this inventory
    const skus = await skuRepo.find({ where: { product: { id: product.id } } });
    for (const s of skus) {
      let ss = await skuStockRepo.findOne({
        where: { inventoryItem: { id: inv.id }, sku: { id: s.id } },
      });
      if (!ss) {
        const newStock = skuStockRepo.create({
          inventoryItem: { id: inv.id },
          sku: { id: s.id },
          reserved: 0,
        });
        ss = await skuStockRepo.save(newStock);
        console.log(`Seed: created SkuStock for ${s.skuCode} (onHand=100)`);
      } else {
        console.log(`Seed: SkuStock for ${s.skuCode} already exists`);
      }
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run();