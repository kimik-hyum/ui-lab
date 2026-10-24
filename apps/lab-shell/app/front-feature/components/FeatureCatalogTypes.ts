export type FeatureCatalogItem = {
  id: string;
  title: string;
  description: string;
  badge: string;
  since: string;
  status: "available" | "planned";
  href?: string;
  image?: { src: string; alt: string; width: number; height: number };
  actionLabel?: string;
};

export type FeatureCatalogSection = {
  id: string;
  title: string;
  subtitle: string;
  features: FeatureCatalogItem[];
};
