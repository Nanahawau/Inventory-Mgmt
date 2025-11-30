export type Variant = {
  id?: number;
  skuCode: string;
  attributes?: Record<string, string>;
};

export type Product = {
  id?: number;
  name: string;
  category?: string;
  price?: number;
  description?: string;
  skus: Variant[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProductInput = {
  name: string;
  category?: string;
  price?: number;
  description?: string;
  skus: { skuCode: string; attributes?: Record<string, string> }[];
};

export type UpdateProductInput = Partial<CreateProductInput> & { id: number };