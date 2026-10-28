import "server-only";
import { ZodError } from "zod";
import { Prisma } from "@store/db";

/**
 * Error with an HTTP status. Throw this from services; `handleRoute`
 * converts it into a JSON response.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new AppError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(403, message);
  }
  static notFound(message = "Not found") {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
}

function toResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "Validation failed",
        details: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof SyntaxError) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json(
        { error: "Resource already exists" },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }
  }

  // Never leak internal error messages to the client.
  console.error("Unhandled route error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

/**
 * Wraps a Route Handler so thrown errors become consistent JSON responses.
 * The context argument (route params) is passed through untouched.
 *
 * export const GET = handleRoute(async (req, ctx) => { ... });
 */
export function handleRoute<C = unknown>(
  handler: (req: Request, ctx: C) => Promise<Response> | Response,
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return toResponse(error);
    }
  };
}
