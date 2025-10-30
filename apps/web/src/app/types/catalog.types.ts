export interface City {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  citySlug?: string;
}

export interface Provider {
  id: string;
  name: string;
  price: number;
  rating?: number;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceFrom?: number;
  citySlug: string;
  categorySlug: string;
  providers?: Provider[];
}
