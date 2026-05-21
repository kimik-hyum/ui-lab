import type { components } from "./generated/database.openapi";

type OpenApiSchemas = components["schemas"];

type SchemaByName<Name extends string> = Name extends keyof OpenApiSchemas
  ? OpenApiSchemas[Name]
  : never;

type ProductSchema = SchemaByName<"products"> extends never
  ? SchemaByName<"public.products">
  : SchemaByName<"products">;

export type ProductRow = ProductSchema;

export type ProductApiResponse = {
  product: ProductRow;
  fetchedAt: string;
  source: string;
};
