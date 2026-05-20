import { mockBusinesses } from '../data/businesses.mock';
import { mockProducts } from '../data/products.mock';
import { mockServices } from '../data/services.mock';
import { mockOffers } from '../data/offers.mock';
import { mockVouchers } from '../data/vouchers.mock';
import type { Business, Product, Service } from '../../types/search.types';
import type { Offer } from '../../types/offer.types';
import type { Voucher } from '../../types/voucher.types';



export interface SearchResults {
  vouchers: Voucher[];
  businesses: Business[];
  products: Product[];
  services: Service[];
  offers: Offer[];
}

export async function mockSearch(query: string): Promise<SearchResults> {


  const q = query.toLowerCase().trim();

  if (!q) {
    return { vouchers: [], businesses: [], products: [], services: [], offers: [] };
  }

  const vouchers = mockVouchers.filter(v =>
    v.title.toLowerCase().includes(q) ||
    v.titleHe.includes(q) ||
    v.merchantName.toLowerCase().includes(q) ||
    v.category.toLowerCase().includes(q)
  );

  const businesses = mockBusinesses.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.nameHe.includes(q) ||
    b.category.toLowerCase().includes(q) ||
    b.categoryHe.includes(q)
  );

  const products = mockProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.nameHe.includes(q) ||
    p.merchantName.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );

  const services = mockServices.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.nameHe.includes(q) ||
    s.providerName.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q)
  );

  const offers = mockOffers.filter(o =>
    o.title.toLowerCase().includes(q) ||
    o.titleHe.includes(q) ||
    o.merchantName.toLowerCase().includes(q)
  );

  return { vouchers, businesses, products, services, offers };
}

export async function mockGetBusinesses(): Promise<Business[]> {

  return [...mockBusinesses];
}

export async function mockGetProducts(): Promise<Product[]> {

  return [...mockProducts];
}

export async function mockGetServices(): Promise<Service[]> {

  return [...mockServices];
}
