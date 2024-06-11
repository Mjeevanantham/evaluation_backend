import mongoose, {
  FilterQuery,
  Model,
  PipelineStage,
  SortOrder,
  UpdateQuery,
} from 'mongoose';
import { ObjectIdDocument } from 'src/dto/common.schema';
import { CustomLogger } from 'src/logger/logger.service';

export abstract class BaseService<TDocument extends ObjectIdDocument> {
  private readonly baseServicelogger = new CustomLogger();

  constructor(protected readonly model: Model<TDocument>) {}

  private async handleDatabaseError(
    error: unknown,
    functionName: string,
  ): Promise<never> {
    if (error instanceof Error) {
      this.baseServicelogger.error(
        {
          message: error.message,
          filepath: __filename,
          functionname: functionName,
        },
        error.stack ?? '',
        BaseService.name,
      );
    }
    throw error;
  }

  async aggregate(aggregateQuery: PipelineStage[]): Promise<any[]> {
    try {
      return await this.model.aggregate(aggregateQuery).exec();
    } catch (error) {
      return this.handleDatabaseError(error, 'aggregate');
    }
  }
  async findOneById(
    id: string,
    attributes?: Record<string, number>,
  ): Promise<TDocument | null> {
    try {
      console.log(id , attributes);
      return await this.model
        .findById(id)
        .select<Record<string, number>>(attributes)
        .lean<TDocument>(true);
    } catch (error: unknown) {
      return this.handleDatabaseError(error, this.findOneById.name);
    }
  }

  async findManyByFilter(
    filterQuery: FilterQuery<TDocument>,
    attributes?: Record<string, number>,
    limit?: number,
    offset?: number,
    searchQuery?: string,
    searchField?: string[],
    sortBy?: string[], // Sorting field
    orderBy?: string, // Sorting order
  ): Promise<{ data: TDocument[] | null; total_count: number } | null> {
    try {
      const pageSize = limit ? limit : 0;
      const skip = offset ? offset : 0;

      // For counting documents, remove the limit and offset
      const countFilterQuery = { ...filterQuery };

      if (searchQuery) {
        const searchFields = searchField; // Add your desired field names here
        const searchConditions: FilterQuery<TDocument>[] = searchFields.map(
          (field) => ({ [field]: { $regex: new RegExp(searchQuery, 'i') } }),
        ) as FilterQuery<TDocument>[];
        countFilterQuery.$or = searchConditions;
      }
      // Count documents matching the filter
      const totalCount = await this.model.countDocuments(countFilterQuery);

      const findOptions: {
        skip: number;
        limit: number;
        sort?: [string, SortOrder][];
      } = {
        skip,
        limit: pageSize,
        sort:
          sortBy && orderBy
            ? sortBy.map((field) => [
                field,
                orderBy.toUpperCase() === 'ASC' ? 1 : -1,
              ])
            : undefined,
      };

      console.log('countFilterQuery', countFilterQuery);
      const data = await this.model
        .find(countFilterQuery)
        .select(attributes)
        .skip(findOptions.skip)
        .limit(findOptions.limit)
        .sort(findOptions.sort)
        .collation({ locale: 'en_US', strength: 1 })
        .lean<TDocument[]>(true);

      console.log('data', data);
      return { data, total_count: totalCount };
    } catch (error: unknown) {
      return this.handleDatabaseError(error, this.findManyByFilter.name);
    }
  }

  async findOneByFilter(
    filterQuery: FilterQuery<TDocument>,
    attributes?: FilterQuery<TDocument>,
  ): Promise<TDocument | null> {
    try {
      return await this.model
        .findOne(filterQuery)
        .select<Record<string, number>>(attributes)
        .lean<TDocument>(true);
    } catch (error: unknown) {
      return this.handleDatabaseError(error, this.findOneByFilter.name);
    }
  }

  async createOne(document: Omit<TDocument, '_id'>): Promise<TDocument> {
    try {
      const createdDocument = new this.model({
        ...document,
        _id: new mongoose.Types.ObjectId().toString('hex'),
      });
      const result = await createdDocument.save();
      return result;
    } catch (error: unknown) {
      return this.handleDatabaseError(error, this.createOne.name);
    }
  }

  async findOneAndUpdate(
    id: string,
    update: UpdateQuery<TDocument>,
    attributes?: Record<string, number>,
  ): Promise<TDocument | null> {
    try {
      return await this.model
        .findByIdAndUpdate(id, update, { new: true })
        .select<Record<string, number>>(attributes)
        .lean<TDocument>(true);
    } catch (error: unknown) {
      return this.handleDatabaseError(error, this.findOneAndUpdate.name);
    }
  }

  async findOneByFilterAndUpdate(condition: any, updaterecord: any) {
    try {
      const addressupdateresult = this.model

        .findOneAndUpdate(
          condition,
          updaterecord, // Return the updated document
        )

        .select<Record<string, number>>({
          tenant_id: 1,
        })
        .lean<TDocument>()

        .lean()

        .exec();
      return addressupdateresult;
    } catch (error) {
      throw new Error(`Failed to update address status: ${error}`);
    }
  }
}
