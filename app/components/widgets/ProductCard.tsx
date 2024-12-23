import {Image} from '@shopify/hydrogen';
import {parse} from 'node-html-parser';
import {useMemo} from 'react';
import {RecommendedProductFragment} from 'storefrontapi.generated';
import {twJoin} from 'tailwind-merge';
import {Link} from '@remix-run/react';

interface ProductCardProps {
  product: RecommendedProductFragment;
}

const ProductCard: React.FC<ProductCardProps> = ({product}) => {
  const img = useMemo(() => product.images.nodes[0], [product]);

  const description = useMemo(() => {
    const html = parse(product.descriptionHtml);
    return html.querySelector('#desc')?.textContent?.trim();
  }, [product]);

  return (
    <div
      className={twJoin(
        'group flex flex-col items-center justify-between p-6',
        'relative border-r-0 sm:border-r border-b border-black'
      )}
    >
      <div className="w-full">
        <h1 className="font-inter-light truncate text-[16px] tracking-[0.3px] mb-2">
          {product.title}
        </h1>
        <p className="font-inter-light mb-0 sm:mb-1 truncate text-[12px]">
          {description}
        </p>
        <p className="font-inter-light mb-0 sm:mb-1 truncate text-[12px]">
          {product.collections.nodes.map((collection) => collection.title).join(', ')}
        </p>
        <p className="font-inter-light truncate text-[12px]">
          {product.tags.join(', ')}
        </p>
      </div>
      <div className="flex w-full flex-grow items-center my-4">
        {img && (
          <Link to={`/products/${product.handle}`} className="w-full">
            <Image
              data={img}
              alt={'image'}
              className={'max-h-[40dvh] w-full'}
            />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
