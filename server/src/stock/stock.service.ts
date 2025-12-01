import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { SkuStock } from "./entities/skustock.entity";
import { Reservation } from "./entities/reservation.entity";
import { StockMovement } from "./entities/stockmovement.entity";
import { Transfer } from "./entities/transfer.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { TransferStockDto } from "./dto/transfer-stock.dto";
import { Product } from "../product/entities/product.entity";
import { InventoryItem } from "./entities/inventoryitems.entity";
import { Store } from "../store/entities/store.entity";
import { Sku } from "../sku/entities/sku.entity";


function toNumberId(id?: string | number): number | undefined {
  if (id === undefined || id === null) return undefined;
  if (typeof id === "number") return id;
  const n = Number(id);
  if (Number.isNaN(n)) return undefined;
  return Math.floor(n);
}

@Injectable()
export class StockService {
  private readonly defaultTtlSeconds = 15 * 60; // 15 minutes

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(InventoryItem) private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(SkuStock) private readonly skuStockRepo: Repository<SkuStock>,
    @InjectRepository(Reservation) private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(StockMovement) private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Sku) private readonly skuRepo: Repository<Sku>
  ) { }

  // Create or fetch InventoryItem for a store (or central) and optionally receive initial SKU stocks (only for central)
  async createInventory(dto: CreateInventoryDto) {
    const storeId = toNumberId(dto.storeId);
    const productId = toNumberId(dto.productId);
    if (!storeId || !productId) throw new BadRequestException("invalid storeId or productId");

    return await this.dataSource.transaction(async (manager) => {
      // ensure InventoryItem unique per store+product
      let inv: InventoryItem | null = await manager.getRepository(InventoryItem).findOne({
        where: { store: { id: storeId }, product: { id: productId } }
      });
      let store = await this.storeRepo.findOne({ where: { id: storeId } });
      let product = await this.productRepo.findOne({ where: { id: productId } });
      if (!inv) {
        inv = manager.getRepository(InventoryItem).create({
          store: store ?? { id: storeId } as any,
          product: product ?? { id: productId } as any,
          priceOverride: null,
          isActive: true
        });
        await manager.getRepository(InventoryItem).save(inv);
      }

      // Initialize/receive SKU stocks for ANY store when provided
      if (dto.skuStocks && dto.skuStocks.length > 0) {
        for (const s of dto.skuStocks) {
          const skuId = toNumberId(s.skuId);
          const addStock = Number(s.stock ?? 0);
          if (!skuId) throw new BadRequestException("invalid skuId in skuStocks");
          if (isNaN(addStock) || addStock < 0) throw new BadRequestException("invalid stock amount in skuStocks");

          let ss = await manager.getRepository(SkuStock).findOne({
            where: { inventoryItem: { id: inv.id }, sku: { id: skuId } }
          });

          if (!ss) {
            let sku = await this.skuRepo.findOne({ where: { id: skuId } });
            ss = manager.getRepository(SkuStock).create({
              inventoryItem: inv ?? { id: inv } as any,
              sku: sku ?? { id: skuId } as any,
              stock: addStock,
              reserved: 0
            });
          } else {
            ss.stock += addStock;
          }
          await manager.getRepository(SkuStock).save(ss);

          const mv = manager.getRepository(StockMovement).create({
            skuStock: ss,
            skuId: skuId,
            inventoryItemId: inv.id,
            delta: addStock,
            type: "receive", // record inbound to this store
            reference: null
          });
          await manager.getRepository(StockMovement).save(mv);
        }
      }

      const fullInv = await this.inventoryRepo.findOne({
        where: { id: inv.id },
        relations: ["product", "store", "skuStocks", "skuStocks.sku"]
      });

      return fullInv;
    });
  }

  // Find inventory (paginated) over InventoryItem
  async findInventory(opts: { storeId?: string; productId?: string; page?: number; pageSize?: number }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize = opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 200) : 20;

    const qb = this.inventoryRepo.createQueryBuilder("ii")
      .leftJoinAndSelect("ii.product", "product")
      .leftJoinAndSelect("ii.store", "store")
      .leftJoinAndSelect("ii.skuStocks", "skuStock")
      .leftJoinAndSelect("skuStock.sku", "sku");

    if (opts.storeId) {
      const sid = toNumberId(opts.storeId);
      if (!sid) throw new BadRequestException("invalid storeId");
      qb.andWhere("ii.storeId = :sid", { sid });
    }
    if (opts.productId) {
      const pid = toNumberId(opts.productId);
      if (!pid) throw new BadRequestException("invalid productId");
      qb.andWhere("ii.productId = :pid", { pid });
    }

    const total = await qb.getCount();

    const items = await qb
      .orderBy("product.name", "ASC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      data: items
    };
  }

  // Get a specific SkuStock row
  async getSkuStock(id: string | number) {
    const sid = toNumberId(id);
    if (!sid) throw new BadRequestException("invalid id");
    const ss = await this.skuStockRepo.findOne({
      where: { id: sid },
      relations: ["sku", "inventoryItem", "inventoryItem.store", "inventoryItem.product"]
    });
    if (!ss) throw new NotFoundException("skuStock not found");
    return ss;
  }

  // Create reservation (reserve from an inventory item, e.g., central)
  async reserve(dto: CreateReservationDto) {
    const inventoryItemId = toNumberId(dto.inventoryItemId);
    const skuId = toNumberId(dto.skuId);
    const qty = Number(dto.quantity);
    if (!inventoryItemId || !skuId || isNaN(qty) || qty <= 0) throw new BadRequestException("invalid reservation payload");

    const ttl = dto.ttlSeconds && Number(dto.ttlSeconds) > 0 ? Math.floor(Number(dto.ttlSeconds)) : this.defaultTtlSeconds;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return await this.dataSource.transaction(async (manager) => {
      const ssQb = manager.getRepository(SkuStock).createQueryBuilder("ss")
        .where("ss.inventoryItemId = :iid AND ss.skuId = :skuId", { iid: inventoryItemId, skuId })
        .setLock("pessimistic_write");
      const ss = await ssQb.getOne();
      if (!ss) throw new NotFoundException("sku stock not found for inventory item");

      const available = ss.stock - ss.reserved;
      if (available < qty) throw new BadRequestException(`insufficient available stock (available=${available})`);

      ss.reserved += qty;
      await manager.getRepository(SkuStock).save(ss);

      const reservation = manager.getRepository(Reservation).create({
        inventoryItem: { id: inventoryItemId } as any,
        sku: { id: skuId } as any,
        quantity: qty,
        status: "active" as any,
        reference: dto.reference ?? null,
        expiresAt
      });
      await manager.getRepository(Reservation).save(reservation);

      const mv = manager.getRepository(StockMovement).create({
        skuStock: ss,
        skuId,
        inventoryItemId,
        delta: 0,
        type: "reserve",
        reference: reservation.id?.toString?.() ?? null
      });
      await manager.getRepository(StockMovement).save(mv);

      const fullReservation = await this.reservationRepo.findOne({ where: { id: reservation.id }, relations: ["inventoryItem", "sku"] });
      const updatedSs = await this.skuStockRepo.findOne({ where: { id: ss.id }, relations: ["sku", "inventoryItem"] });
      return { reservation: fullReservation, skuStock: updatedSs };
    });
  }

  // Create transfer: consumes a reservation and moves qty from source (reservation.inventoryItem) to destination inventory item
  async createTransfer(dto: CreateTransferDto) {
    const reservationId = dto.reservationId ? toNumberId(dto.reservationId) : undefined;
    const toInventoryItemId = toNumberId(dto.toInventoryItemId);
    const qty = Number(dto.quantity);
    if (!toInventoryItemId || isNaN(qty) || qty <= 0) throw new BadRequestException("invalid transfer payload");

    return await this.dataSource.transaction(async (manager) => {
      if (!reservationId) throw new BadRequestException("reservationId is required for transfer");

      const reservation = await manager.getRepository(Reservation).findOne({
        where: { id: reservationId },
        relations: ["inventoryItem", "sku"]
      });
      if (!reservation) throw new NotFoundException("reservation not found");
      if (reservation.status !== "active") throw new BadRequestException("reservation not active");
      if (reservation.expiresAt && reservation.expiresAt <= new Date()) throw new BadRequestException("reservation expired");
      if (qty > reservation.quantity) throw new BadRequestException("quantity exceeds reservation quantity");

      const sourceInventoryItemId = reservation.inventoryItem.id;
      const skuId = reservation.sku.id;

      const srcQb = manager.getRepository(SkuStock).createQueryBuilder("ss")
        .where("ss.inventoryItemId = :iid AND ss.skuId = :skuId", { iid: sourceInventoryItemId, skuId })
        .setLock("pessimistic_write");
      const src = await srcQb.getOne();
      if (!src) throw new NotFoundException("source sku stock not found");

      if (src.reserved < qty) throw new BadRequestException("insufficient reserved quantity in source");
      if (src.stock < qty) throw new BadRequestException("insufficient physical stock in source");

      // decrement source
      src.stock -= qty;
      src.reserved -= qty;
      await manager.getRepository(SkuStock).save(src);

      // increment destination
      let dest = await manager.getRepository(SkuStock).findOne({
        where: { inventoryItem: { id: toInventoryItemId }, sku: { id: skuId } }
      });
      if (!dest) {
        dest = manager.getRepository(SkuStock).create({
          inventoryItem: { id: toInventoryItemId } as any,
          sku: { id: skuId } as any,
          stock: 0,
          reserved: 0
        });
      }
      dest.stock += qty;
      await manager.getRepository(SkuStock).save(dest);

      // record transfer + movements
      const transfer = manager.getRepository(Transfer).create({
        fromInventoryItemId: sourceInventoryItemId,
        toInventoryItemId,
        skuId,
        quantity: qty,
        reference: dto.reference ?? null
      });
      await manager.getRepository(Transfer).save(transfer);

      const outMv = manager.getRepository(StockMovement).create({
        skuStock: src,
        skuId,
        inventoryItemId: sourceInventoryItemId,
        delta: -qty,
        type: "transfer_out",
        reference: transfer.id?.toString?.() ?? null
      });
      const inMv = manager.getRepository(StockMovement).create({
        skuStock: dest,
        skuId,
        inventoryItemId: toInventoryItemId,
        delta: qty,
        type: "transfer_in",
        reference: transfer.id?.toString?.() ?? null
      });
      await manager.getRepository(StockMovement).save([outMv, inMv]);

      // update reservation
      if (qty === reservation.quantity) {
        reservation.status = "fulfilled";
      } else {
        reservation.quantity = reservation.quantity - qty;
      }
      await manager.getRepository(Reservation).save(reservation);

      const updatedSrc = await this.skuStockRepo.findOne({ where: { id: src.id }, relations: ["sku", "inventoryItem"] });
      const updatedDest = await this.skuStockRepo.findOne({ where: { id: dest.id }, relations: ["sku", "inventoryItem"] });

      return { transfer, from: updatedSrc, to: updatedDest, movements: [outMv, inMv], reservation };
    });
  }

  // Transfer stock from central inventory item to a store's inventory item
  async moveFromCentral(dto: TransferStockDto) {
    const centralInventoryItemId = toNumberId(dto.centralInventoryItemId);
    const toStoreId = toNumberId(dto.toStoreId);
    const productId = toNumberId(dto.productId);
    const skuId = toNumberId(dto.skuId);
    const qty = Number(dto.quantity);

    if (!centralInventoryItemId || !toStoreId || !productId || !skuId || !qty || qty <= 0) {
      throw new BadRequestException("invalid move payload");
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1) Ensure destination InventoryItem exists for store+product
      let destInv = await manager.getRepository(InventoryItem).findOne({
        where: { store: { id: toStoreId }, product: { id: productId } },
        relations: ["store", "product"]
      });

      if (!destInv) {
        // Create the inventory item directly using the transaction manager
        destInv = manager.getRepository(InventoryItem).create({
          store: { id: toStoreId } as any,
          product: { id: productId } as any,
          priceOverride: null,
          isActive: true
        });
        destInv = await manager.getRepository(InventoryItem).save(destInv);
        if (!destInv) throw new NotFoundException("failed to create destination inventory item");
      }

      // 2) Find an active reservation for the central InventoryItem, SKU, and quantity
      const reservation = await manager.getRepository(Reservation).findOne({
        where: {
          inventoryItem: { id: centralInventoryItemId },
          sku: { id: skuId },
          status: "active",
          quantity: qty
        }
      });

      if (!reservation) {
        throw new NotFoundException("active reservation not found for requested quantity");
      }

      // 3) Transfer to destination: update/create SKU stock in destination inventory
      const skuStockRepo = manager.getRepository(SkuStock);

      // Find central sku stock
      let centralSkuStock = await skuStockRepo.findOne({
        where: { inventoryItem: { id: centralInventoryItemId }, sku: { id: skuId } },
        relations: ["inventoryItem", "sku"]
      });
      if (!centralSkuStock) throw new NotFoundException("Central sku stock not found");

      // Reduce central stock and reserved
      centralSkuStock.stock -= qty;
      centralSkuStock.reserved -= qty;
      if (centralSkuStock.reserved < 0) centralSkuStock.reserved = 0;
      if (centralSkuStock.stock < 0) centralSkuStock.stock = 0;
      await skuStockRepo.save(centralSkuStock);

      // Update/create destination sku stock
      let destSkuStock = await skuStockRepo.findOne({
        where: { inventoryItem: { id: destInv.id }, sku: { id: skuId } },
        relations: ["inventoryItem", "sku"]
      });

      if (!destSkuStock) {
        destSkuStock = skuStockRepo.create({
          inventoryItem: destInv,
          sku: { id: skuId } as any,
          stock: qty,
          reserved: 0
        });
      } else {
        destSkuStock.stock += qty;
      }
      await skuStockRepo.save(destSkuStock);

      // Mark reservation as fulfilled/cancelled
      reservation.status = "fulfilled";
      await manager.getRepository(Reservation).save(reservation);

      // Record stock movements
      const movementRepo = manager.getRepository(StockMovement);

      // Outbound movement from central
      const centralMovement = movementRepo.create({
        skuStock: centralSkuStock,
        skuId: skuId,
        inventoryItemId: centralInventoryItemId,
        delta: -qty,
        type: "transfer_out",
        reference: dto.reference ?? null
      });
      await movementRepo.save(centralMovement);

      // Inbound movement to destination
      const destMovement = movementRepo.create({
        skuStock: destSkuStock,
        skuId: skuId,
        inventoryItemId: destInv.id,
        delta: qty,
        type: "transfer_in",
        reference: dto.reference ?? null
      });
      await movementRepo.save(destMovement);

      return {
        success: true,
        transferred: qty,
        toStoreId,
        productId,
        skuId,
        destinationInventoryItemId: destInv.id,
        destinationSkuStockId: destSkuStock.id,
        centralSkuStockId: centralSkuStock.id,
        reservationId: reservation.id
      };
    });
  }

  // List reservations
  async findReservations(filters: { inventoryItemId?: string; skuId?: string; status?: string; page?: number; pageSize?: number } = {}) {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(Math.floor(filters.pageSize), 200) : 20;

    const qb = this.reservationRepo.createQueryBuilder("r")
      .leftJoinAndSelect("r.inventoryItem", "ii")
      .leftJoinAndSelect("r.sku", "sku")
      .leftJoinAndSelect("sku.product", "product");

    if (filters.inventoryItemId) {
      const iid = toNumberId(filters.inventoryItemId);
      if (!iid) throw new BadRequestException("invalid inventoryItemId");
      qb.andWhere("r.inventoryItemId = :iid", { iid });
    }
    if (filters.skuId) {
      const sk = toNumberId(filters.skuId);
      if (!sk) throw new BadRequestException("invalid skuId");
      qb.andWhere("r.skuId = :sk", { sk });
    }
    if (filters.status) {
      qb.andWhere("r.status = :st", { st: filters.status });
    }

    const total = await qb.getCount();

    const data = await qb
      .orderBy("r.createdAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      data,
    };
  }

  /**
   * Delete an inventory item for a store+product.
   * Writes off all remaining SKU stock amounts, then removes SkuStock rows and the InventoryItem.
   */
  async deleteInventoryItemById(inventoryItemId: number | string, reference?: string) {
    const id = Number(inventoryItemId);
    if (!id) throw new BadRequestException("invalid inventoryItemId");

    return await this.dataSource.transaction(async (manager) => {
      const inv = await manager.getRepository(InventoryItem).findOne({
        where: { id },
        relations: ["store", "product"]
      });
      if (!inv) throw new NotFoundException("inventory item not found");

      // Remove all sku stocks for this inventory item
      const ssRepo = manager.getRepository(SkuStock);
      const mvRepo = manager.getRepository(StockMovement);
      const skuStocks = await ssRepo.find({
        where: { inventoryItem: { id: inv.id } },
        relations: ["sku"]
      });

      for (const ss of skuStocks) {
        const remaining = Number(ss.stock || 0);
        if (remaining > 0) {
          const mv = mvRepo.create({
            skuStock: ss,
            skuId: ss.sku.id,
            inventoryItemId: inv.id,
            delta: -remaining,
            type: "write_off",
            reference: reference ?? null
          });
          await mvRepo.save(mv);
        }
      }

      if (skuStocks.length > 0) {
        const ids = skuStocks.map(s => s.id);
        await ssRepo.delete(ids);
      }

      await manager.getRepository(InventoryItem).delete(inv.id);

      return { success: true, deletedInventoryItemId: inv.id, deletedSkuStockCount: skuStocks.length };
    });
  }
  async cancelReservation(reservationId: number | string, reference?: string) {
    const rid = toNumberId(reservationId);
    if (!rid) throw new BadRequestException("invalid reservation id");

    return this.dataSource.transaction(async (manager) => {
      // Lock the reservation row without outer joins
      const rQb = manager.getRepository(Reservation)
        .createQueryBuilder("r")
        .where("r.id = :rid", { rid })
        .setLock("pessimistic_write");

      const reservation = await rQb.getOne();
      if (!reservation) throw new NotFoundException("reservation not found");
      if (reservation.status !== "active") throw new BadRequestException("reservation not active");

      const qty = Number(reservation.quantity || 0);
      if (qty <= 0) {
        reservation.status = "cancelled";
        await manager.getRepository(Reservation).save(reservation);
        return { reservation };
      }

      // Read required foreign keys explicitly (no relations to avoid outer joins)
      const { inventoryItemId, skuId } = reservation;
      if (!inventoryItemId || !skuId) {
        throw new BadRequestException("reservation missing inventoryItemId or skuId");
      }

      // Lock the SkuStock row by composite keys, no relations
      const ssQb = manager.getRepository(SkuStock)
        .createQueryBuilder("ss")
        .where("ss.inventoryItemId = :iid AND ss.skuId = :sid", { iid: inventoryItemId, sid: skuId })
        .setLock("pessimistic_write");

      const ss = await ssQb.getOne();
      if (!ss) throw new NotFoundException("skuStock not found");
      if (Number(ss.reserved || 0) < qty) throw new BadRequestException("reserved amount less than reservation quantity");

      // release reserved
      ss.reserved = Number(ss.reserved || 0) - qty;
      await manager.getRepository(SkuStock).save(ss);

      // mark reservation cancelled
      reservation.status = "cancelled";
      await manager.getRepository(Reservation).save(reservation);

      // movement log (no relations)
      const mv = manager.getRepository(StockMovement).create({
        skuStock: { id: ss.id } as any,
        skuId,
        inventoryItemId,
        delta: 0,
        type: "reservation_cancel",
        reference: reference ?? String(reservation.id),
      });
      await manager.getRepository(StockMovement).save(mv);

      // Return with minimal additional fetches (safe selects)
      const updated = await this.skuStockRepo.findOne({
        where: { id: ss.id },
        relations: ["sku", "inventoryItem"],
      });
      return { reservation, skuStock: updated, movement: mv };
    });
  }
}