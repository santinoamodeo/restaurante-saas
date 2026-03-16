import MenuClient from './MenuClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://restaurante-saas-production-136b.up.railway.app'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_URL}/api/v1/public/${slug}/menu`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    const data = await res.json()
    const name = data.tenant_name || slug.replace(/-/g, ' ')
    return {
      title: `${name} — Menú digital`,
      description: `Pedí online en ${name}. Menú digital con delivery y take away.`,
      ...(data.logo_url ? { icons: { icon: data.logo_url, apple: data.logo_url } } : {}),
    }
  } catch {
    return {
      title: 'Menú digital',
      description: 'Pedí online desde tu mesa.',
    }
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  await params
  return <MenuClient />
}
