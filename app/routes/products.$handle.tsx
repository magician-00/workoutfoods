'use client';

import {
  useLoaderData,
  useNavigate,
  type FetcherWithComponents,
  type MetaFunction,
  useLocation,
} from '@remix-run/react';
import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useMemo, useRef, useState} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';

import {
  CartForm,
  Image,
  VariantOption,
  VariantSelector,
  getSelectedProductOptions,
} from '@shopify/hydrogen';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {parse} from 'node-html-parser';
import ButtonFlattened from '~/components/elements/ButtonFlattened';
import {useCartContext} from '~/contexts/CartContext';
import {getVariantUrl} from '~/utils';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `WorkoutFoods | ${data?.product.title ?? ''}`}];
};

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // await the query for the critical product data
  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions},
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option: SelectedOption) =>
        option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = await storefront.query(VARIANTS_QUERY, {
    variables: {handle},
  });

  return defer({product, variants});
}

function redirectToFirstVariant({
  product,
  request,
}: {
  product: ProductFragment;
  request: Request;
}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  const {product, variants} = useLoaderData<typeof loader>();
  const {selectedVariant} = product;
  const quantityAvailable =
    selectedVariant?.quantityAvailable && selectedVariant.quantityAvailable > 0
      ? selectedVariant.quantityAvailable
      : 0;

  const {openCart} = useCartContext();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  const images = useMemo(() => {
    return product.images.nodes.filter((img) => img.altText !== 'featured');
  }, [product]);

  const colorVariants = useMemo(() => {
    if (!variants.product) {
      return [];
    }
    const selectedColor = selectedVariant?.selectedOptions.find(
      (opt) => opt.name === 'Color',
    )?.value;

    const colors = variants.product.variants.nodes
      .filter((variant) => {
        if (
          !variant.selectedOptions.some((option) => option.name === 'Color')
        ) {
          return false;
        }
        if (!variant.availableForSale) {
          return false;
        }
        const requiredOptions = selectedVariant?.selectedOptions.filter(
          (opt) => opt.name !== 'Color',
        );
        if (!requiredOptions) {
          return true;
        }
        return requiredOptions.every((opt) =>
          variant.selectedOptions.some(
            (vopt) => vopt.name === opt.name && vopt.value === opt.value,
          ),
        );
      })
      .map(
        (variant) =>
          variant.image && (
            <div
              key={variant.id}
              className={clsx(
                'p-0.5 border cursor-pointer',
                variant.selectedOptions.find((opt) => opt.name === 'Color')
                  ?.value === selectedColor
                  ? 'border-gray-400'
                  : 'border-transparent',
              )}
              onClick={() => handleSelectColor(variant.selectedOptions)}
            >
              <Image
                data={variant.image}
                className={'max-w-[52px] max-h-[52px]'}
              />
            </div>
          ),
      );

    return colors;
  }, [variants, selectedVariant, images, featuredIndex]);

  const thumbnails = useMemo(() => {
    if (colorVariants.length) {
      return colorVariants;
    }
    return images.map((image, idx) => (
      <div
        key={image.id}
        className={clsx(
          'p-0.5 border cursor-pointer',
          idx === featuredIndex ? 'border-gray-400' : 'border-transparent',
        )}
        onClick={() => setFeaturedIndex(idx)}
      >
        <Image data={image} className={'max-w-[52px] max-h-[52px]'} />
      </div>
    ));
  }, [images, colorVariants]);

  const featuredImage = useMemo(
    () =>
      colorVariants.length > 0 ? selectedVariant?.image : images[featuredIndex],
    [images, selectedVariant, featuredIndex, colorVariants],
  );

  const handleSelectColor = (options: {name: string; value: string}[]) => {
    const variantUrl = getVariantUrl({
      pathname: location.pathname,
      handle: product.handle,
      selectedOptions: options,
      searchParams: new URLSearchParams(location.search),
    });
    navigate(variantUrl);
  };

  const [content, desc] = useMemo(() => {
    if (product.descriptionHtml) {
      const html = parse(product.descriptionHtml);
      const desc = html.querySelector('#desc')?.textContent?.trim();
      html.querySelector('#desc')?.remove();
      const content = html.toString();
      return [content, desc];
    }
    return ['', ''];
  }, [product.descriptionHtml]);

  const QuantitySelector = () =>
    quantityAvailable ? (
      <div className="flex text-[14px] items-center gap-2">
        <span className="hidden md:inline">QUANTITY:</span>
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="bg-gray-50 border ray-300 text-sm rounded-lg outline-none w-fit focus:ring-blue-500 focus:lue-500 block p-1 pr-3"
        >
          {Array.from({length: quantityAvailable}).map((_, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <option key={idx} value={idx + 1}>
              {idx + 1}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  return (
    <div className="h-full overflow-auto">
      <div className="grid h-full grid-cols-1 md:grid-cols-2 md:items-center">
        <div className="p-6 pb-0 hidden md:block">
          {featuredImage && (
            <Image
              alt={featuredImage.altText || 'Product Image'}
              data={featuredImage}
              className="max-w-[512px] max-h-[512px] ml-auto mb-4"
            />
          )}
        </div>
        <div className="flex-col hidden md:flex max-h-[calc(100vh-94px)] p-6 max-w-[500px]">
          <h2 className="mb-2 text-[16px] uppercase">{product.title}</h2>
          <h3 className="mb-2 text-[14px] font-inter-bold">
            {selectedVariant?.title}
          </h3>
          <div className="flex-grow overflow-auto mb-4">
            <div
              dangerouslySetInnerHTML={{__html: content}}
              className="mb-2 text-[12px] [&_ul]:my-2 [&_ul]:list-outside [&_ul]:ml-4 [&_ul]:list-disc"
            />
          </div>
          <div className="mb-8 md:mb-4 flex flex-wrap gap-1 justify-start">
            {thumbnails}
          </div>
          <p className="mb-2 text-[16px]">${selectedVariant?.price.amount}</p>
          <div className="flex gap-2 mb-2">
            {variants.product && variants.product.variants.nodes.length > 1 && (
              <VariantSelector
                handle={product.handle}
                options={product.options}
                variants={variants.product?.variants.nodes}
              >
                {({option}) => (
                  <ProductOptions key={option.name} option={option} />
                )}
              </VariantSelector>
            )}
            <QuantitySelector />
          </div>
          <div className="flex">
            <CartForm
              route="/cart"
              inputs={{
                lines: selectedVariant
                  ? [
                      {
                        merchandiseId: selectedVariant.id,
                        quantity,
                      },
                    ]
                  : [],
              }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher: FetcherWithComponents<any>) => (
                <ButtonFlattened
                  color={quantityAvailable ? 'primary' : 'soldout'}
                  size="small"
                  className="hidden mr-2 md:flex"
                  disabled={fetcher.state !== 'idle'}
                >
                  {quantityAvailable ? 'ADD TO CART' : 'SOLD OUT'}
                </ButtonFlattened>
              )}
            </CartForm>
            <ButtonFlattened color="secondary" size="small" onClick={openCart}>
              CHECKOUT
            </ButtonFlattened>
          </div>
        </div>
        <div className="px-6 py-4 flex flex-col md:hidden">
          <h2 className="text-[20px] uppercase">{product.title}</h2>
          <h3 className="mb-2 text-[14px] font-inter-bold">
            {selectedVariant?.title}
          </h3>
          {featuredImage && (
            <Image
              alt={featuredImage.altText || 'Product Image'}
              data={featuredImage}
              className="max-w-[512px] max-h-[512px] mx-auto mb-4"
            />
          )}
          <div className="-mx-6 px-4 py-2 bg-gray-100 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px]">${selectedVariant?.price.amount}</p>
              <div className="flex items-center gap-2">
                {variants.product &&
                  variants.product.variants.nodes.length > 1 && (
                    <VariantSelector
                      handle={product.handle}
                      options={product.options}
                      variants={variants.product?.variants.nodes}
                    >
                      {({option}) => (
                        <ProductOptions key={option.name} option={option} />
                      )}
                    </VariantSelector>
                  )}
                <QuantitySelector />
                <CartForm
                  route="/cart"
                  inputs={{
                    lines: selectedVariant
                      ? [
                          {
                            merchandiseId: selectedVariant.id,
                            quantity,
                          },
                        ]
                      : [],
                  }}
                  action={CartForm.ACTIONS.LinesAdd}
                >
                  {(fetcher: FetcherWithComponents<any>) => (
                    <ButtonFlattened
                      color={quantityAvailable ? 'primary' : 'soldout'}
                      size="small"
                      disabled={fetcher.state !== 'idle' || !quantityAvailable}
                    >
                      {quantityAvailable ? 'ADD TO CART' : 'SOLD OUT'}
                    </ButtonFlattened>
                  )}
                </CartForm>
              </div>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-1 justify-center">
            {thumbnails}
          </div>
          <h3 className="mb-2 text-[14px] font-inter-bold">{desc}</h3>
          <div
            dangerouslySetInnerHTML={{__html: content}}
            className="mb-2 text-[14px] [&_ul]:my-2 [&_ul]:list-outside [&_ul]:ml-4 [&_ul]:list-disc"
          />
          <ButtonFlattened
            color="secondary"
            size="small"
            className="w-full"
            onClick={openCart}
          >
            CHECKOUT
          </ButtonFlattened>
        </div>
      </div>
    </div>
  );
}

function ProductOptions({option}: {option: VariantOption}) {
  const navigate = useNavigate();

  const hanldeChangeOption = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(e.target.value);
  };

  return (
    option.name !== 'Color' && (
      <select
        onChange={hanldeChangeOption}
        className="bg-gray-50 border ray-300 text-sm rounded-lg outline-none w-fit focus:ring-blue-500 focus:lue-500 block p-1"
      >
        {option.values.map(({value, isAvailable, to}) => {
          return (
            <option
              key={option.name + value}
              value={to}
              disabled={!isAvailable}
            >
              {value}
            </option>
          );
        })}
      </select>
    )
  );
}

export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    quantityAvailable
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    totalInventory
    images(first: 25) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

export const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
` as const;
