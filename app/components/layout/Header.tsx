import {Await, NavLink} from '@remix-run/react';
import {Suspense} from 'react';
import type {HeaderQuery} from 'storefrontapi.generated';
import {useCartContext} from '~/contexts/CartContext';
import {useMenuContext} from '~/contexts/MenuContext';
import {useRootLoaderData} from '~/root';
import Button from '../elements/Button';
import IconCart from '../icons/IconCart';
import IconLogo from '../icons/IconLogo';
import {IconMenu} from '../icons/IconMenu';
import type {LayoutProps} from './Layout';

type HeaderProps = Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>;

export function Header({header, cart, isLoggedIn}: HeaderProps) {
  const {menu} = header;
  return (
    <header className="fixed top-0 flex w-full items-center justify-between h-[47px] border-b border-solid border-black px-[22px] py-[6px] gap-4">
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        <IconLogo className="h-6" />
      </NavLink>
      <HeaderMenu
        menu={menu}
        isLoggedIn={isLoggedIn}
        primaryDomainUrl={header.shop.primaryDomain.url}
      />
      <HeaderCtas cart={cart} />
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  isLoggedIn,
}: {
  menu: HeaderProps['header']['menu'];
  isLoggedIn: boolean;
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
}) {
  const {publicStoreDomain} = useRootLoaderData();

  return (
    <nav
      className="hidden flex-grow justify-end text-[14px] md:flex gap-4"
      role="navigation"
    >
      {menu &&
        menu.items.map((item) => {
          if (!item.url) return null;

          // if the url is internal, we strip the domain
          const url =
            item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
              ? new URL(item.url).pathname
              : item.url;
          return (
            <NavLink
              className="header-menu-item"
              end
              key={item.id}
              prefetch="intent"
              style={activeLinkStyle}
              to={url}
            >
              {item.title}
            </NavLink>
          );
        })}
      {isLoggedIn ? (
        <NavLink
          className="header-menu-item"
          end
          prefetch="intent"
          style={activeLinkStyle}
          to={'/account/orders'}
        >
          Orders
        </NavLink>
      ) : (
        <NavLink
          className="header-menu-item"
          end
          prefetch="intent"
          style={activeLinkStyle}
          to={'/account/login'}
        >
          Login
        </NavLink>
      )}
    </nav>
  );
}

function HeaderCtas({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <nav className="flex gap-2" role="navigation">
      <HeaderMenuMobileToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {openMenu} = useMenuContext();

  return (
    <button
      onClick={openMenu}
      className="relative flex items-center justify-center w-8 h-8 md:hidden"
    >
      <IconMenu />
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {openCart} = useCartContext();

  return (
    <Button
      className="relative"
      onClick={openCart}
      badge={count > 0 ? count.toString() : ''}
    >
      <IconCart className="w-[24px] h-[24px]" />
    </Button>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

function activeLinkStyle({isPending}: {isPending: boolean}) {
  return {
    color: isPending ? 'grey' : 'black',
  };
}
