import {Await, Form, NavLink} from '@remix-run/react';
import {Suspense} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {CartMain} from '~/components/layout/Cart';
import {Footer} from '~/components/layout/Footer';
import {Header} from '~/components/layout/Header';
import {CartContextProvider, useCartContext} from '~/contexts/CartContext';
import {MenuContextProvider, useMenuContext} from '~/contexts/MenuContext';
import {useRootLoaderData} from '~/root';
import {CartLoading} from '../elements/CartLoading';
import {Drawer} from '../elements/Drawer';
import IconInstagram from '../icons/IconInstagram';

export type LayoutProps = {
  cart: Promise<CartApiQueryFragment | null>;
  children?: React.ReactNode;
  footer: FooterQuery;
  header: HeaderQuery;
  isLoggedIn: boolean;
};

export function Layout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
}: LayoutProps) {
  return (
    <CartContextProvider>
      <MenuContextProvider>
        <CartDrawer cart={cart} />
        <Header header={header} cart={cart} isLoggedIn={isLoggedIn} />
        <main className="my-[47px] h-[calc(100dvh-94px)]">{children}</main>
        <Footer menu={footer.menu} shop={header.shop} />
        <HeaderMobileMenu
          isLoggedIn={isLoggedIn}
          headerMenu={header.menu}
          primaryDomainUrl={header.shop.primaryDomain.url}
        />
      </MenuContextProvider>
    </CartContextProvider>
  );
}

function CartDrawer({cart}: {cart: LayoutProps['cart']}) {
  const {isCartOpen, closeCart} = useCartContext();

  return (
    <Drawer
      open={isCartOpen}
      onClose={closeCart}
      openFrom="right"
      heading="YOUR CART"
    >
      <Suspense fallback={<CartLoading />}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Drawer>
  );
}

export function HeaderMobileMenu({
  headerMenu,
  primaryDomainUrl,
  isLoggedIn,
}: {
  isLoggedIn: boolean;
  headerMenu: LayoutProps['header']['menu'];
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
}) {
  const {publicStoreDomain} = useRootLoaderData();
  const {isMenuOpen, closeMenu} = useMenuContext();
  return (
    <Drawer open={isMenuOpen} onClose={closeMenu} openFrom="left">
      {[...(headerMenu ? headerMenu.items : [])].map((item) => {
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
            onClick={closeMenu}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
      {isLoggedIn ? (
        <>
          <NavLink prefetch="intent" to="/account" onClick={closeMenu}>
            ORDERS
          </NavLink>
          <Form
            className="account-logout"
            method="POST"
            action="/account/logout"
          >
            <button type="submit" onClick={closeMenu}>
              LOG OUT
            </button>
          </Form>
        </>
      ) : (
        <NavLink prefetch="intent" to="/account" onClick={closeMenu}>
          LOG IN
        </NavLink>
      )}
      <div className="flex">
        <NavLink
          to={'https://instagram.com/workout.foods'}
          target="_blank"
          className="mr-1"
        >
          <IconInstagram />
        </NavLink>
      </div>
    </Drawer>
  );
}
