import bcrypt from "bcrypt";

export {
  APIError,
  AppError,
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  STATUS_CODES,
  UnauthorizedError,
  ValidationError,
} from "./app-errors.js";

export const generateSalt = async () => bcrypt.genSalt();

export const generatePassword = async (password, salt) => bcrypt.hash(password, salt);

export const validatePassword = async (enteredPassword, savedPassword, salt) =>
  (await generatePassword(enteredPassword, salt)) === savedPassword;

export const paginateAndFilter = async (model, queryOptions = {}) => {
  const {
    filters = {},
    page = 1,
    limit = 10,
    sort = {},
    excludeFields = [],
    selectFields = null,
  } = queryOptions;

  const skip = (page - 1) * limit;
  const query = model.find(filters).skip(skip).limit(limit).sort(sort);

  if (selectFields?.length) {
    query.select(selectFields.join(" "));
  } else if (excludeFields.length) {
    query.select(excludeFields.map((f) => `-${f}`).join(" "));
  }

  const [data, totalDocuments] = await Promise.all([query.exec(), model.countDocuments(filters)]);

  return {
    data,
    totalDocuments,
    totalPages: Math.ceil(totalDocuments / limit),
    currentPage: page,
    hasNextPage: page * limit < totalDocuments,
    hasPrevPage: page > 1,
  };
};
