import { Request, Response, NextFunction, RequestHandler } from 'express'

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

export default function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
    return fn(req, res, next).catch(next)
  }
}
