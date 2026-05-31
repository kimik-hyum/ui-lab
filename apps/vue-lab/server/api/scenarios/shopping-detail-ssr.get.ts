import {
  SHOPPING_DETAIL_SSR_DEFAULT_SLUG,
  SHOPPING_DETAIL_SSR_SOURCE,
  type ShoppingDetailSsrResponse,
} from "#shared/scenarios/shopping-detail-ssr/types";
import { getShoppingDetailSsrProduct } from "../../utils/scenarios/shopping-detail-ssr";

function readScenarioSlug(value: unknown) {
  if (Array.isArray(value)) {
    return readScenarioSlug(value[0]);
  }

  if (typeof value !== "string") {
    return SHOPPING_DETAIL_SSR_DEFAULT_SLUG;
  }

  const trimmedSlug = value.trim();
  return trimmedSlug.length > 0 ? trimmedSlug : SHOPPING_DETAIL_SSR_DEFAULT_SLUG;
}

export default defineEventHandler(async (event): Promise<ShoppingDetailSsrResponse> => {
  const query = getQuery(event);
  const slug = readScenarioSlug(query.slug);

  try {
    const product = await getShoppingDetailSsrProduct(slug);

    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "상품을 찾을 수 없습니다.",
      });
    }

    return {
      product,
      requestedSlug: slug,
      source: SHOPPING_DETAIL_SSR_SOURCE,
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "SSR Product Lookup Failed",
      message:
        error instanceof Error
          ? `SSR 상품 조회 중 오류가 발생했습니다: ${error.message}`
          : "SSR 상품 조회 중 알 수 없는 오류가 발생했습니다.",
    });
  }
});
