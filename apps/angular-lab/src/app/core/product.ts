export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  image_url: string;
  image_width: number;
  image_height: number;
  stock: number;
  rating: number;
  created_at: string;
};

export type ProductApiResponse = {
  product: Product;
  fetchedAt: string;
  source: string;
};
