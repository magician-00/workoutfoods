import {useLoaderData, Link} from '@remix-run/react';
import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';

export async function loader({context, request}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 100,
  });

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return json({collections});
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="w-full h-full overflow-auto flex flex-wrap items-center justify-center">
      <Pagination connection={collections}>
        {({nodes}) => <CollectionsGrid collections={nodes} />}
      </Pagination>
    </div>
  );
}

function CollectionsGrid({collections}: {collections: CollectionFragment[]}) {
  return (
    <div className="w-full md:w-fit grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2 md:py-10">
      {collections.map((collection, index) => (
        <CollectionItem
          key={collection.id}
          collection={collection}
          index={index}
        />
      ))}
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className="flex-shrink-0 group relative w-full h-fit"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection?.image ? (
        <Image
          alt={collection.image.altText || collection.title}
          data={collection.image}
          className="md:!w-[203px] md:!h-[203px]"
          loading={index < 3 ? 'eager' : undefined}
        />
      ) : (
        <div className="w-full h-[100vw] sm:h-[50vw] md:w-[203px] md:h-[203px]" />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-5 transition-opacity">
        <h5 className="absolute top-2 left-2 p-1 leading-[1] text-[14px] uppercase bg-black text-white group-hover:bg-white group-hover:text-black">
          {collection.title}
        </h5>
      </div>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
