import { ProductModel } from "../../data";
import { CreateCategoryDto, CustomError, PaginationDto } from "../../domain";

export class ProductService {
    constructor() {}

    async createProduct( createProductDto: CreateCategoryDto ) {
        const productExist = await ProductModel.findOne({name: createProductDto.name});

        if(productExist) throw CustomError.badRequest('Product already exist');

        try {
            const product = new ProductModel( createProductDto );

            await product.save();

            return product;
        } catch (error) {
            console.log(error);
            throw CustomError.internalServer(`Internal Server Error: ${error}`);
        }
    }

    async getProducts(paginationDto: PaginationDto) {
        const { page, limit } = paginationDto;
        try {
            const [total, products] = await Promise.all([
                ProductModel.countDocuments(),
                ProductModel.find()
                    .skip( (page - 1) * limit )
                    .limit(limit)
                    .populate('user')
                    .populate('category')
            ])

            return {
                page: page,
                limit: limit,
                total: total,
                next: `/api/products?page=${page + 1}&limit=${limit}`,
                previous: (page - 1 > 0) ? `/api/products?page=${page - 1}&limit=${limit}` : null,
                products: products,
            }
        } catch (error) {
            console.log(error);
            throw CustomError.internalServer('Internal Server Error');
        }
    }
}