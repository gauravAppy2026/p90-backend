import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let model: any;

  beforeEach(async () => {
    model = {
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: model },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should find active products', async () => {
    model.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ name: 'Mat' }]) });
    const result = await service.findActive();
    expect(model.find).toHaveBeenCalledWith({ isActive: true });
  });

  it('should find product by id', async () => {
    model.findById.mockResolvedValue({ name: 'Mat' });
    const result = await service.findById('p-id');
    expect(result.name).toBe('Mat');
  });

  it('should throw NotFoundException for missing product', async () => {
    model.findById.mockResolvedValue(null);
    await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
  });

  it('should create a product', async () => {
    model.create.mockResolvedValue({ name: 'New Product' });
    const result = await service.create({ name: 'New Product' });
    expect(result.name).toBe('New Product');
  });

  it('should update a product', async () => {
    model.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });
    const result = await service.update('p-id', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('should throw NotFoundException on update non-existent product', async () => {
    model.findByIdAndUpdate.mockResolvedValue(null);
    await expect(service.update('bad-id', { name: 'x' })).rejects.toThrow(NotFoundException);
  });
});
