import {Form, Outlet, useLoaderData} from '@remix-run/react';
import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import type {CustomerFragment} from 'storefrontapi.generated';

export function shouldRevalidate() {
  return true;
}

export async function loader({request, context}: LoaderFunctionArgs) {
  const {session, storefront} = context;
  const {pathname} = new URL(request.url);
  const customerAccessToken = await session.get('customerAccessToken');
  const isLoggedIn = !!customerAccessToken?.accessToken;
  const isAccountHome = pathname === '/account' || pathname === '/account/';
  const isPrivateRoute =
    /^\/account\/(orders|orders\/.*|profile|addresses|addresses\/.*)$/.test(
      pathname,
    );

  if (!isLoggedIn) {
    if (isPrivateRoute || isAccountHome) {
      session.unset('customerAccessToken');
      return redirect('/account/login', {
        headers: {
          'Set-Cookie': await session.commit(),
        },
      });
    } else {
      // public subroute such as /account/login...
      return json({
        isLoggedIn: false,
        isAccountHome,
        isPrivateRoute,
        customer: null,
      });
    }
  } else {
    // loggedIn, default redirect to the orders page
    if (isAccountHome) {
      return redirect('/account/orders');
    }
  }

  try {
    const {customer} = await storefront.query(CUSTOMER_QUERY, {
      variables: {
        customerAccessToken: customerAccessToken.accessToken,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: storefront.CacheNone(),
    });

    if (!customer) {
      throw new Error('Customer not found');
    }
    return json(
      {isLoggedIn, isPrivateRoute, isAccountHome, customer},
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was a problem loading account', error);
    session.unset('customerAccessToken');
    return redirect('/account/login', {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  }
}

export default function Acccount() {
  const {customer, isPrivateRoute, isAccountHome} =
    useLoaderData<typeof loader>();

  if (!isPrivateRoute && !isAccountHome) {
    return <Outlet context={{customer}} />;
  }

  return (
    <AccountLayout customer={customer as CustomerFragment}>
      <Outlet context={{customer}} />
    </AccountLayout>
  );
}

function AccountLayout({
  customer,
  children,
}: {
  customer: CustomerFragment;
  children: React.ReactNode;
}) {
  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details';

  return (
    <div className="container mx-auto px-4 py-6 md:px-8 md:py-10">
      <div className="flex items-center justify-between gap-2 mb-6">
        <h1 className="text-2xl">{heading}</h1>
        <AccountMenu />
      </div>
      {children}
    </div>
  );
}

function AccountMenu() {
  return (
    <nav role="navigation">
      <Form className="account-logout" method="POST" action="/account/logout">
        <button type="submit">Logout</button>
      </Form>
    </nav>
  );
}

export const CUSTOMER_FRAGMENT = `#graphql
  fragment Customer on Customer {
    acceptsMarketing
    addresses(first: 6) {
      nodes {
        ...Address
      }
    }
    defaultAddress {
      ...Address
    }
    email
    firstName
    lastName
    numberOfOrders
    phone
  }
  fragment Address on MailingAddress {
    id
    formatted
    firstName
    lastName
    company
    address1
    address2
    country
    province
    city
    zip
    phone
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/customer
const CUSTOMER_QUERY = `#graphql
  query Customer(
    $customerAccessToken: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      ...Customer
    }
  }
  ${CUSTOMER_FRAGMENT}
` as const;
