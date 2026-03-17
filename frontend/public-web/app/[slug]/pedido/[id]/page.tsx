import { Metadata } from 'next'
import PedidoClient from './PedidoClient'

interface Props {
  params: Promise<{ slug: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Tu pedido · ${slug}`,
    description: 'Seguí el estado de tu pedido en tiempo real',
    robots: 'noindex',
  }
}

export default async function PedidoPage({ params }: Props) {
  const { slug, id } = await params
  return <PedidoClient slug={slug} orderId={id} />
}
