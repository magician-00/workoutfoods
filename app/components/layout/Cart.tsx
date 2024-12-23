import {Link} from '@remix-run/react';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import {AiOutlineMinus, AiOutlinePlus} from 'react-icons/ai';
import {RiDeleteBin6Line} from 'react-icons/ri';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/utils';
import Button from '../elements/Button';
import {useCartContext} from '~/contexts/CartContext';

type CartLine = CartApiQueryFragment['lines']['nodes'][0];

type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: 'page' | 'aside';
};

export function CartMain({layout, cart}: CartMainProps) {
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  return (
    <>
      <CartEmpty hidden={linesCount} />
      <div className="flex-grow overflow-auto">
        <div className="grid grid-cols-1 gap-4">
          <CartLines lines={cart?.lines} layout={layout} />
        </div>
      </div>
      {cartHasItems && (
        <CartSummary
          cost={cart.cost}
          checkoutUrl={cart.checkoutUrl}
          layout={layout}
        />
      )}
    </>
  );
}

function CartLines({
  lines,
  layout,
}: {
  layout: CartMainProps['layout'];
  lines: CartApiQueryFragment['lines'] | undefined;
}) {
  if (!lines) return null;

  return (
    <div aria-labelledby="cart-lines">
      <ul>
        {lines.nodes.map((line) => (
          <CartLineItem key={line.id} line={line} layout={layout} />
        ))}
      </ul>
    </div>
  );
}

function CartLineItem({
  layout,
  line,
}: {
  layout: CartMainProps['layout'];
  line: CartLine;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);

  return (
    <div
      className="grid grid-cols-4 border-b border-x first:border-t border-black"
      key={id}
    >
      <div className="flex h-full items-center justify-center border-r border-black">
        {image && (
          <Image
            alt={title}
            data={image}
            height={100}
            width={100}
            loading="lazy"
          />
        )}
      </div>
      <div className="col-span-3 grid h-full grid-cols-1 gap-2 p-[20px]">
        <Link
          prefetch="intent"
          to={lineItemUrl}
          className="font-inter text-[18px] uppercase truncate"
          onClick={() => {
            if (layout === 'aside') {
              window.location.href = lineItemUrl;
            }
          }}
        >
          {product.title}
        </Link>
        <div className="flex justify-between items-center gap-4">
          <span className="truncate">{title}</span>
          <span className="text-[18px] uppercase">
            <CartLinePrice line={line} as="span" />
          </span>
        </div>
        <CartLineQuantity line={line} />
      </div>
    </div>
  );
}

export function CartSummary({
  cost,
  layout,
  checkoutUrl,
}: {
  checkoutUrl: string;
  cost: CartApiQueryFragment['cost'];
  layout: CartMainProps['layout'];
}) {
  return (
    <div className="flex flex-col gap-4 text-[18px]">
      <div className="flex justify-between">
        <span>SUBTOTAL</span>
        <span className="font-bold">
          {cost?.subtotalAmount?.amount ? (
            <Money data={cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </span>
      </div>
      <p>Taxes and shipping calculated at checkout</p>
      <a
        href={checkoutUrl}
        target="_self"
        className="block group text-center uppercase w-full rounded-[100px] bg-[#fef100] text-black py-6"
      >
        CHECK OUT
      </a>
    </div>
  );
}

function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center justify-between gap-[60px]">
      <div className="flex h-[50px] flex-grow items-center justify-between border border-[#979797] px-4">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <Button
            Icon={AiOutlineMinus}
            iconProps={{size: 16}}
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            name="decrease-quantity"
            value={prevQuantity}
          />
        </CartLineUpdateButton>
        <span className="font-inter-semibold text-[16px]">{quantity}</span>
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <Button
            Icon={AiOutlinePlus}
            iconProps={{size: 16}}
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
          />
        </CartLineUpdateButton>
      </div>
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesRemove}
        inputs={{lineIds: [lineId]}}
      >
        <Button type="submit" Icon={RiDeleteBin6Line} iconProps={{size: 24}} />
      </CartForm>
    </div>
  );
}

function CartLinePrice({
  line,
  priceType = 'regular',
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: 'regular' | 'compareAt';
  [key: string]: any;
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return (
    <div>
      <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />
    </div>
  );
}

export function CartEmpty({hidden = false}: {hidden: boolean}) {
  const {closeCart} = useCartContext();
  return (
    <div hidden={hidden}>
      <br />
      <p>
        Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
        started!
      </p>
      <br />
      <Link to="/" onClick={closeCart}>
        Continue shopping →
      </Link>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Discount(s)</dt>
          <UpdateDiscountForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button>Remove</button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <input type="text" name="discountCode" placeholder="Discount code" />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}
