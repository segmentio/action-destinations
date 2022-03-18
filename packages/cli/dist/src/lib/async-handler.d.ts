import { Request, Response, NextFunction, RequestHandler } from 'express'
declare type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>
export default function asyncHandler(fn: AsyncRequestHandler): RequestHandler
export {}
