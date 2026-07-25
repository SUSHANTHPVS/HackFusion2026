import { AppError } from "../utils/AppError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(parsed.error.issues[0].message, 400));
    }
    req.body = parsed.data;
    return next();
  };
}
