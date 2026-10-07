import type { PrismaClient } from '../generated/prisma/client'
import { assertOwner, type Actor } from '../lib/actor'
import type { AppConfig } from '../lib/config'
import { badRequest, HttpError, notFound } from '../lib/errors'
import { detectImageType, mimeFromExtension, removeImageFile, resolveImagePath, saveImage } from '../lib/image-files'

export interface ImageServiceDeps {
  db: PrismaClient
  config: AppConfig
  now?: () => Date
}

export function createImageService({ db, config, now = () => new Date() }: ImageServiceDeps) {
  /** Image changes count as a change made by the user. */
  const touchCard = (cardId: number, actor: Actor) =>
    db.card.update({ where: { id: cardId }, data: { userModifiedAt: now(), lastModifiedBy: actor.name } })

  return {
    /** Stores a manually uploaded image. It becomes the primary image if the card has none yet. */
    async addManual(cardId: number, bytes: Uint8Array, actor: Actor) {
      const card = await db.card.findUnique({
        where: { id: cardId },
        select: { id: true, ownerUserId: true, _count: { select: { images: { where: { isPrimary: true } } } } },
      })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }
      assertOwner(card, actor)
      if (bytes.length === 0) {
        throw badRequest('empty_file', 'The uploaded file is empty')
      }
      if (bytes.length > config.maxUploadBytes) {
        throw new HttpError(413, 'file_too_large', 'The uploaded file is too large')
      }
      const type = detectImageType(bytes)
      if (!type) {
        throw badRequest('unsupported_image', 'Only PNG, JPEG and WebP images are supported')
      }

      const filePath = await saveImage(config.imageDir, cardId, bytes, type)
      try {
        const image = await db.cardImage.create({
          data: {
            cardId,
            filePath,
            source: 'MANUAL',
            isPrimary: card._count.images === 0,
            uploadedBy: actor.name,
          },
        })
        await db.auditLog.create({
          data: { entity: 'card', entityId: cardId, field: 'image', newValue: `uploaded #${image.id}`, changedBy: actor.name },
        })
        await touchCard(cardId, actor)
        return { id: image.id, source: image.source, isPrimary: image.isPrimary }
      }
      catch (error) {
        await removeImageFile(config.imageDir, filePath)
        throw error
      }
    },

    async setPrimary(imageId: number, actor: Actor) {
      const image = await db.cardImage.findUnique({
        where: { id: imageId },
        select: { id: true, cardId: true, card: { select: { ownerUserId: true } } },
      })
      if (!image) {
        throw notFound('image_not_found', 'Image not found')
      }
      assertOwner(image.card, actor)
      await db.$transaction([
        db.cardImage.updateMany({ where: { cardId: image.cardId }, data: { isPrimary: false } }),
        db.cardImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
        db.auditLog.create({
          data: { entity: 'card', entityId: image.cardId, field: 'primaryImage', newValue: String(imageId), changedBy: actor.name },
        }),
      ])
      await touchCard(image.cardId, actor)
    },

    async remove(imageId: number, actor: Actor) {
      const image = await db.cardImage.findUnique({ where: { id: imageId }, include: { card: { select: { ownerUserId: true } } } })
      if (!image) {
        throw notFound('image_not_found', 'Image not found')
      }
      assertOwner(image.card, actor)
      await db.cardImage.delete({ where: { id: imageId } })
      await removeImageFile(config.imageDir, image.filePath)

      // Keep a primary image around: promote the oldest remaining one.
      if (image.isPrimary) {
        const next = await db.cardImage.findFirst({ where: { cardId: image.cardId }, orderBy: { id: 'asc' } })
        if (next) {
          await db.cardImage.update({ where: { id: next.id }, data: { isPrimary: true } })
        }
      }
      await db.auditLog.create({
        data: { entity: 'card', entityId: image.cardId, field: 'image', oldValue: `deleted #${imageId}`, changedBy: actor.name },
      })
      await touchCard(image.cardId, actor)
    },

    /** Absolute path and content type of a stored image, for serving it. */
    async getFile(imageId: number) {
      const image = await db.cardImage.findUnique({ where: { id: imageId }, select: { filePath: true } })
      if (!image) {
        throw notFound('image_not_found', 'Image not found')
      }
      return { path: resolveImagePath(config.imageDir, image.filePath), mime: mimeFromExtension(image.filePath) }
    },
  }
}

export type ImageService = ReturnType<typeof createImageService>
