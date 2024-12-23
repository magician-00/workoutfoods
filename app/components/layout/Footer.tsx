import {NavLink} from '@remix-run/react';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {useRootLoaderData} from '~/root';
import IconInstagram from '../icons/IconInstagram';
import clsx from 'clsx';

export function Footer({
  menu,
  shop,
}: FooterQuery & {shop: HeaderQuery['shop']}) {
  return (
    <footer className="fixed bottom-0 flex h-[47px] w-full items-center justify-between border-t-[1px] border-solid px-[22px] py-[6px]">
      <FooterMenu menu={menu} primaryDomainUrl={shop.primaryDomain.url} />
    </footer>
  );
}

function FooterMenu({
  menu,
  primaryDomainUrl,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
}) {
  const {publicStoreDomain} = useRootLoaderData();

  return (
    <nav className="ml-auto flex items-center" role="navigation">
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
          const isExternal = !url.startsWith('/');
          return isExternal ? (
            <a
              href={url}
              key={item.id}
              rel="noopener noreferrer"
              target="_blank"
            >
              {item.title}
            </a>
          ) : (
            <NavLink
              end
              key={item.id}
              prefetch="intent"
              className={activeLinkClass}
              to={url}
            >
              {item.title}
            </NavLink>
          );
        })}
      <NavLink
        to={'https://instagram.com/workout.foods'}
        target="_blank"
        className="mr-1"
      >
        <IconInstagram className="w-[24px] md:w-[32px]" />
      </NavLink>
    </nav>
  );
}

function activeLinkClass({isPending}: {isPending: boolean}) {
  return clsx('text-black md:mr-4 text-[14px] mr-2', {
    'text-gray': isPending,
  });
}
