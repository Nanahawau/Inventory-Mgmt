import { Injectable, BadRequestException, Query, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateStoreDto } from "./dto/create-store.dto";
import { Store } from "./entities/store.entity";


@Injectable()
export class StoreService {
  constructor(@InjectRepository(Store) private readonly storeRepo: Repository<Store>) { }

  async createStore(dto: CreateStoreDto) {
    if (!dto.name) throw new BadRequestException("name required");
    const store = this.storeRepo.create({
      name: dto.name,
      location: dto.location,
      isCentral: dto.isCentral
    });
    await this.storeRepo.save(store);

    return store;
  }

  async findOne(id: number) {
    if (!id) throw new BadRequestException("id required");
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new BadRequestException("store not found");
    return store;
  }

  async find(isCentral: boolean) {
    return await this.storeRepo.find({ where: { isCentral } });
  }


  async getStoresByCentralField(central: boolean) {
    return this.storeRepo.find({ where: { isCentral: central } });
  }

  async findAll(page = 1, pageSize = 50) {
    const qb = this.storeRepo.createQueryBuilder('s');
    const total = await qb.getCount();
    const items = await qb.orderBy('s.name', 'ASC').skip((page - 1) * pageSize).take(pageSize).getMany();
    return { meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }, data: items };
  }

  async updateStore(id: number, body: Partial<CreateStoreDto>) {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new NotFoundException("Store not found");

    store.name = body.name ?? store.name;
    store.location = body.location ?? store.location;

    await this.storeRepo.save(store);
    return store;
  }
}