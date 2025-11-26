import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateStoreDto } from "./dto/create-store.dto";
import { Store } from "./entities/store.entity";

/**
 * StoreService - create and fetch stores
 */

@Injectable()
export class StoreService {
  constructor(@InjectRepository(Store) private readonly storeRepo: Repository<Store>) {}

  async createStore(dto: CreateStoreDto) {
    if (!dto.name) throw new BadRequestException("name required");
    const s = this.storeRepo.create({
      name: dto.name,
      location: dto.location
    });
    await this.storeRepo.save(s);
    return s;
  }

  async findOne(id: number) {
    if (!id) throw new BadRequestException("id required");
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new BadRequestException("store not found");
    return store;
  }
}