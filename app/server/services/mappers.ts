import type { Prisma } from '../generated/prisma/client'
import type { CardDetailDto, CardListItemDto, PricePointDto } from '../../shared/types/api'
import { sortByLanguagePreference } from '../../shared/utils/languages'
import { formatDateOnly } from '../lib/dates'

const toNumber = (value: { toString: () => string }): number => Number(value.toString())

export function listInclude(priceSource: string) {
  return {
    game: { select: { slug: true, displayName: true } },
    assignedPlayer: { select: { id: true, name: true } },
    sets: { select: { setCode: true }, orderBy: { id: 'asc' }, take: 1 },
    images: { where: { isPrimary: true }, select: { id: true }, take: 1 },
    priceHistory: {
      where: { source: priceSource },
      orderBy: [{ fetchedAt: 'desc' }, { id: 'desc' }],
      take: 1,
    },
  } satisfies Prisma.CardInclude
}

export function detailInclude() {
  return {
    game: { select: { slug: true, displayName: true } },
    translations: true,
    sets: { orderBy: { id: 'asc' } },
    images: { orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }] },
    priceHistory: { orderBy: [{ fetchedAt: 'desc' }, { id: 'desc' }], take: 200 },
    statusHistory: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
  } satisfies Prisma.CardInclude
}

type ListCard = Prisma.CardGetPayload<{ include: ReturnType<typeof listInclude> }>
type DetailCard = Prisma.CardGetPayload<{ include: ReturnType<typeof detailInclude> }>

export function toListItem(card: ListCard): CardListItemDto {
  const latest = card.priceHistory[0]
  return {
    id: card.id,
    name: card.name,
    gameSlug: card.game.slug,
    gameName: card.game.displayName,
    setCode: card.sets[0]?.setCode ?? null,
    status: card.status,
    player: card.assignedPlayer,
    imageId: card.images[0]?.id ?? null,
    price: latest ? { amount: toNumber(latest.price), currency: latest.currency, source: latest.source } : null,
  }
}

export function toDetail(card: DetailCard, priceSource: string): CardDetailDto {
  const latestStatus = card.statusHistory[0]
  const showStatusInfo = card.status !== 'ACTIVE' && latestStatus?.status === card.status

  return {
    id: card.id,
    game: card.game,
    externalId: card.externalId,
    name: card.name,
    translations: sortByLanguagePreference(card.translations).map(entry => ({
      language: entry.language,
      name: entry.name,
      description: entry.description,
      details: (entry.details as Record<string, unknown> | null) ?? null,
    })),
    attributes: card.gameSpecificAttributes as CardDetailDto['attributes'],
    status: card.status,
    statusDate: showStatusInfo ? formatDateOnly(latestStatus.date) : null,
    statusPerson: showStatusInfo ? latestStatus.personText : null,
    assignedPlayerId: card.assignedPlayerId,
    purchaseDate: card.purchaseDate ? formatDateOnly(card.purchaseDate) : null,
    sets: card.sets.map(set => ({
      id: set.id,
      setCode: set.setCode,
      setName: set.setName,
      rarity: set.rarity,
      edition: set.edition,
    })),
    images: card.images.map(image => ({ id: image.id, source: image.source, isPrimary: image.isPrimary })),
    priceHistory: card.priceHistory.map((point): PricePointDto => ({
      id: point.id,
      source: point.source,
      price: toNumber(point.price),
      currency: point.currency,
      fetchedAt: point.fetchedAt.toISOString(),
    })),
    primarySource: priceSource,
    lastFetchedAt: card.lastFetchedAt?.toISOString() ?? null,
    userModifiedAt: card.userModifiedAt?.toISOString() ?? null,
    lastModifiedAt: card.lastModifiedAt.toISOString(),
    lastModifiedBy: card.lastModifiedBy,
  }
}
