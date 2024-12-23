import {Await, useLoaderData, type MetaFunction} from '@remix-run/react';
import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Suspense} from 'react';
import ProductCard from '~/components/widgets/ProductCard';

export const meta: MetaFunction = () => {
  return [{title: 'WorkoutFoods | Home'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const products = storefront.query(RECOMMENDED_PRODUCTS_QUERY);

  return defer({products});
}

export default function Homepage() {
  const {products} = useLoaderData<typeof loader>();
  return (
    <div className="h-full overflow-auto">
      <Suspense>
        <Await resolve={products}>
          {({products}) => (
            <div className="lg:max-w-[90%] mx-auto px-0 sm:px-8 lg:px-[100px] mb-8">
              <div className="flex justify-between items-center my-4 md:my-8 px-6 sm:px-0">
                <span className="text-[12px] block sm:hidden">
                  運 を 動 か せ
                </span>
                <span className="text-[12px] hidden sm:block">
                  <span className='font-bold'>The highest quality nutritional products on the market today.</span> Hand-crafted with<br/>
                  the finest ingredients from specialty farms from all over the world.
                </span>
                <span className="text-[12px]">
                  Shop all                
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 border-t border-l-0	sm:border-l border-black">
                {products.nodes.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

export const RECOMMENDED_PRODUCT_FRAGMENT= `#graphql
fragment RecommendedProduct on Product {
    id
    title
    handle
    descriptionHtml
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    tags
    collections (first: 10) {
      nodes {
        id
        title
        description
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    variants(first: 1) {
      nodes {
        quantityAvailable
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  ${RECOMMENDED_PRODUCT_FRAGMENT}
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 25, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
