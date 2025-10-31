import { OrderDetailsClient } from './OrderDetailsClient';

interface OrderPageParams {
  orderId: string;
}

interface OrderPageProps {
  params: OrderPageParams | Promise<OrderPageParams>;
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const resolvedParams = await params;

  return <OrderDetailsClient orderId={resolvedParams.orderId} />;
}
