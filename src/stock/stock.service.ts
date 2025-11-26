import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { InventoryItem } from "src/stock/entities/inventoryitems.entity";
import { SkuStock } from "./entities/skustock.entity";
import { Reservation } from "./entities/reservation.entity";
import { StockMovement } from "./entities/stockmovement.entity";
import { Transfer } from "./entities/transfer.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";

/**
 * Updated StockService
 * - Uses DataSource.transaction(...) for transactional work
 * - Uses the transaction-scoped manager for all DB operations inside the transaction
 * - Uses pessimistic locks when modifying rows that must be protected from concurrent updates
 * - Returns plain objects (entities) that the ResponseInterceptor can wrap
 *
 * Note: Primary keys are integers. Controller inputs are coerced to numbers by helper toNumberId.
 */

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
    @InjectRepository(Transfer) private readonly transferRepo: Repository<Transfer>
  ) {}

  // create InventoryItem for a store (or central) and optionally initial sku stocks
  async createInventory(dto: CreateInventoryDto) {
    const storeId = toNumberId(dto.storeId);
    const productId = toNumberId(dto.productId);
    if (!storeId || !productId) throw new BadRequestException("invalid storeId or productId");

    return await this.dataSource.transaction(async (manager) => {
      // ensure InventoryItem unique per store+product
      let inv = await manager.getRepository(InventoryItem).findOne({
        where: { store: { id: storeId }, product: { id: productId } }
      });
      if (!inv) {
        inv = manager.getRepository(InventoryItem).create({
          store: { id: storeId } as any,
          product: { id: productId } as any,
          priceOverride: null,
          isActive: true
        });
        await manager.getRepository(InventoryItem).save(inv);
      }

      // const createdStocks: SkuStock[] = [];
      if (dto.initialSkuStocks && dto.initialSkuStocks.length > 0) {
        for (const s of dto.initialSkuStocks) {
          const skuId = toNumberId(s.skuId);
          if (!skuId) throw new BadRequestException("invalid skuId in initialSkuStocks");
          let ss = await manager.getRepository(SkuStock).findOne({
            where: { inventoryItem: { id: inv.id }, sku: { id: skuId } }
          });
          if (!ss) {
            ss = manager.getRepository(SkuStock).create({
              inventoryItem: { id: inv.id } as any,
              sku: { id: skuId } as any,
              stock: s.initialStock,
              reserved: 0
            });
          } else {
            ss.stock += s.initialStock;
          }
          await manager.getRepository(SkuStock).save(ss);
          // createdStocks.push(ss);

          const mv = manager.getRepository(StockMovement).create({
            skuStock: ss,
            skuId: ss.sku?.id ?? skuId,
            inventoryItemId: inv.id,
            delta: s.initialStock,
            type: "receive",
            reference: null
          });
          await manager.getRepository(StockMovement).save(mv);
        }
      }

      // return the inventory with populated relations (fetch outside transaction manager to avoid cross-manager issues)
      // but it's safe to return inv and createdStocks as plain objects
      const fullInv = await this.inventoryRepo.findOne({
        where: { id: inv.id },
        relations: ["product", "store", "skuStocks", "skuStocks.sku"]
      });
      return fullInv;
    });
  }

  // find inventory (paginated) - pages over InventoryItem
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
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items
    };
  }

  // get a specific skuStock row
  async getSkuStock(id: string | number) {
    const sid = toNumberId(id);
    if (!sid) throw new BadRequestException("invalid id");
    const ss = await this.skuStockRepo.findOne({ where: { id: sid }, relations: ["sku", "inventoryItem", "inventoryItem.store", "inventoryItem.product"] });
    if (!ss) throw new NotFoundException("skuStock not found");
    return ss;
  }

  // create reservation (reserve from inventory item, e.g., central)
  async reserve(dto: CreateReservationDto) {
    const inventoryItemId = toNumberId(dto.inventoryItemId);
    const skuId = toNumberId(dto.skuId);
    const qty = Number(dto.quantity);
    if (!inventoryItemId || !skuId || isNaN(qty) || qty <= 0) throw new BadRequestException("invalid reservation payload");

    const ttl = dto.ttlSeconds && Number(dto.ttlSeconds) > 0 ? Math.floor(Number(dto.ttlSeconds)) : this.defaultTtlSeconds;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return await this.dataSource.transaction(async (manager) => {
      // find sku stock for inventoryItem + sku with pessimistic lock
      const ssQb = manager.getRepository(SkuStock).createQueryBuilder("ss")
        .where("ss.inventoryItemId = :iid AND ss.skuId = :skuId", { iid: inventoryItemId, skuId })
        .setLock("pessimistic_write");
      const ss = await ssQb.getOne();
      if (!ss) throw new NotFoundException("sku stock not found for inventory item");

      // compute available
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

      // fetch/read updated rows after commit via repositories (outside transaction)
      const fullReservation = await this.reservationRepo.findOne({ where: { id: reservation.id }, relations: ["inventoryItem", "sku"] });
      const updatedSs = await this.skuStockRepo.findOne({ where: { id: ss.id }, relations: ["sku", "inventoryItem"] });
      return { reservation: fullReservation, skuStock: updatedSs };
    });
  }

  // fulfill reservation (consume reserved quantity and reduce stock)
  async fulfillReservation(reservationId: string | number) {
    const rid = toNumberId(reservationId);
    if (!rid) throw new BadRequestException("invalid reservation id");

    return await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.getRepository(Reservation).findOne({ where: { id: rid }, relations: ["inventoryItem", "sku"] });
      if (!reservation) throw new NotFoundException("reservation not found");
      if (reservation.status !== "active") throw new BadRequestException("reservation not active");
      if (reservation.expiresAt && reservation.expiresAt <= new Date()) throw new BadRequestException("reservation expired");

      const ssQb = manager.getRepository(SkuStock).createQueryBuilder("ss")
        .where("ss.inventoryItemId = :iid AND ss.skuId = :skuId", { iid: reservation.inventoryItem.id, skuId: reservation.sku.id })
        .setLock("pessimistic_write");
      const ss = await ssQb.getOne();
      if (!ss) throw new NotFoundException("sku stock not found");

      if (ss.reserved < reservation.quantity) throw new BadRequestException("reserved quantity inconsistent");
      if (ss.stock < reservation.quantity) throw new BadRequestException("insufficient physical stock to fulfill");

      ss.reserved -= reservation.quantity;
      ss.stock -= reservation.quantity;
      await manager.getRepository(SkuStock).save(ss);

      reservation.status = "fulfilled";
      await manager.getRepository(Reservation).save(reservation);

      const mv = manager.getRepository(StockMovement).create({
        skuStock: ss,
        skuId: reservation.sku.id,
        inventoryItemId: reservation.inventoryItem.id,
        delta: -reservation.quantity,
        type: "sale",
        reference: reservation.id?.toString?.() ?? null
      });
      await manager.getRepository(StockMovement).save(mv);

      const updatedSs = await this.skuStockRepo.findOne({ where: { id: ss.id }, relations: ["sku", "inventoryItem"] });
      return { reservation, skuStock: updatedSs, movement: mv };
    });
  }

  // release reservation (make reserved quantity available again)
  async releaseReservation(reservationId: string | number) {
    const rid = toNumberId(reservationId);
    if (!rid) throw new BadRequestException("invalid reservation id");

    return await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.getRepository(Reservation).findOne({ where: { id: rid }, relations: ["inventoryItem", "sku"] });
      if (!reservation) throw new NotFoundException("reservation not found");
      if (reservation.status !== "active") throw new BadRequestException("reservation not active");

      const ssQb = manager.getRepository(SkuStock).createQueryBuilder("ss")
        .where("ss.inventoryItemId = :iid AND ss.skuId = :skuId", { iid: reservation.inventoryItem.id, skuId: reservation.sku.id })
        .setLock("pessimistic_write");
      const ss = await ssQb.getOne();
      if (!ss) throw new NotFoundException("sku stock not found");

      if (ss.reserved < reservation.quantity) throw new BadRequestException("reserved amount inconsistent");

      ss.reserved -= reservation.quantity;
      await manager.getRepository(SkuStock).save(ss);

      reservation.status = "released";
      await manager.getRepository(Reservation).save(reservation);

      const mv = manager.getRepository(StockMovement).create({
        skuStock: ss,
        skuId: reservation.sku.id,
        inventoryItemId: reservation.inventoryItem.id,
        delta: 0,
        type: "release",
        reference: reservation.id?.toString?.() ?? null
      });
      await manager.getRepository(StockMovement).save(mv);

      const updatedSs = await this.skuStockRepo.findOne({ where: { id: ss.id }, relations: ["sku", "inventoryItem"] });
      return { reservation, skuStock: updatedSs, movement: mv };
    });
  }

  // create transfer: typically consumes a reservation and moves qty from source (reservation.inventoryItem) to destination inventory item
  async createTransfer(dto: CreateTransferDto) {
    const reservationId = dto.reservationId ? toNumberId(dto.reservationId) : undefined;
    const toInventoryItemId = toNumberId(dto.toInventoryItemId);
    const qty = Number(dto.quantity);
    if (!toInventoryItemId || isNaN(qty) || qty <= 0) throw new BadRequestException("invalid transfer payload");

    return await this.dataSource.transaction(async (manager) => {
      let sourceInventoryItemId: number;
      let skuId: number;
      let reservation: Reservation | null = null;

      if (reservationId) {
        reservation = await manager.getRepository(Reservation).findOne({ where: { id: reservationId }, relations: ["inventoryItem", "sku"] });
        if (!reservation) throw new NotFoundException("reservation not found");
        if (reservation.status !== "active") throw new BadRequestException("reservation not active");
        if (reservation.expiresAt && reservation.expiresAt <= new Date()) throw new BadRequestException("reservation expired");
        if (qty > reservation.quantity) throw new BadRequestException("quantity exceeds reservation quantity");

        sourceInventoryItemId = reservation.inventoryItem.id;
        skuId = reservation.sku.id;
      } else {
        throw new BadRequestException("reservationId is required for transfer in this flow");
      }

      const srcQb = manager.getRepository(SkuStock).createQueryBuilder("ss")
        .where("ss.inventoryItemId = :iid AND ss.skuId = :skuId", { iid: sourceInventoryItemId, skuId })
        .setLock("pessimistic_write");
      const src = await srcQb.getOne();
      if (!src) throw new NotFoundException("source sku stock not found");

      if (src.reserved < qty) throw new BadRequestException("insufficient reserved quantity in source");
      if (src.stock < qty) throw new BadRequestException("insufficient physical stock in source");

      src.stock -= qty;
      src.reserved -= qty;
      await manager.getRepository(SkuStock).save(src);

      let dest = await manager.getRepository(SkuStock).findOne({ where: { inventoryItem: { id: toInventoryItemId }, sku: { id: skuId } } });
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

      if (!reservation) throw new BadRequestException("reservation missing unexpectedly");
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

  // direct atomic adjust of sku stock by skuStockId
  async adjustSkuStock(skuStockId: string | number, delta: number, type = "adjust", reference?: string) {
    const ssid = toNumberId(skuStockId);
    if (!ssid || typeof delta !== "number") throw new BadRequestException("invalid parameters");

    return await this.dataSource.transaction(async (manager) => {
      const ss = await manager.getRepository(SkuStock).findOne({ where: { id: ssid }, relations: ["sku", "inventoryItem"] });
      if (!ss) throw new NotFoundException("skuStock not found");

      if (ss.stock + delta < 0) throw new BadRequestException("insufficient stock for adjustment");

      ss.stock += delta;
      await manager.getRepository(SkuStock).save(ss);

      const mv = manager.getRepository(StockMovement).create({
        skuStock: ss,
        skuId: ss.sku.id,
        inventoryItemId: ss.inventoryItem.id,
        delta,
        type,
        reference: reference ?? null
      });
      await manager.getRepository(StockMovement).save(mv);

      const updated = await this.skuStockRepo.findOne({ where: { id: ss.id }, relations: ["sku", "inventoryItem"] });
      return { skuStock: updated, movement: mv };
    });
  }

  // list reservations (simple filter)
  async findReservations(filters: { inventoryItemId?: string; skuId?: string; status?: string } = {}) {
    const qb = this.reservationRepo.createQueryBuilder("r").leftJoinAndSelect("r.inventoryItem", "ii").leftJoinAndSelect("r.sku", "sku");
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
    qb.orderBy("r.createdAt", "DESC");
    return qb.getMany();
  }

  // list transfers (simple filter)
  async findTransfers(filters: { inventoryItemId?: string } = {}) {
    const qb = this.transferRepo.createQueryBuilder("t");
    if (filters.inventoryItemId) {
      const iid = toNumberId(filters.inventoryItemId);
      if (!iid) throw new BadRequestException("invalid inventoryItemId");
      qb.andWhere("t.fromInventoryItemId = :iid OR t.toInventoryItemId = :iid", { iid });
    }
    qb.orderBy("t.createdAt", "DESC");
    return qb.getMany();
  }
}