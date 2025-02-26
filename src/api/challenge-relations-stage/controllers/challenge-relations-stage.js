'use strict';

/**
 * challenge-relations-stage controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::challenge-relations-stage.challenge-relations-stage', ({ strapi }) => ({
  /**
   * PUT /challenge-relations-stages/:documentId/update-with-relations
   */
  async updateWithRelations(ctx) {
    try {
      const { documentId } = ctx.params;
      const {
        minimumTradingDays,
        maximumDailyLoss,
        maximumLoss,
        profitTarget,
        leverage,
        challenge_subcategory,
        challenge_products,
      } = ctx.request.body.data || {};

      // 1) Buscar el ChallengeRelationsStage por documentId
      const stages = await strapi.entityService.findMany(
        'api::challenge-relations-stage.challenge-relations-stage',
        {
          filters: { documentId: { $eq: documentId } },
          limit: 1,
        }
      );
      if (!stages.length) {
        return ctx.notFound(`No se encontró ChallengeRelationsStage con documentId = ${documentId}`);
      }
      const existingStage = stages[0];

      // 2) Manejar la subcategoría (1:1)
      let subcategoryId = null;
      if (challenge_subcategory) {
        if (challenge_subcategory.documentId) {
          // Caso 1: Tiene documentId, buscar y actualizar o crear
          const subcategories = await strapi.entityService.findMany(
            'api::challenge-subcategory.challenge-subcategory',
            {
              filters: { documentId: { $eq: challenge_subcategory.documentId } },
              limit: 1,
            }
          );

          if (subcategories.length) {
            // Actualizar la subcategoría existente
            const updatedSubcat = await strapi.entityService.update(
              'api::challenge-subcategory.challenge-subcategory',
              subcategories[0].id,
              {
                data: {
                  name: challenge_subcategory.name,
                  publishedAt: new Date().toISOString(), // Forzar "Published"
                },
              }
            );
            subcategoryId = updatedSubcat.id;
          } else {
            // Crear una nueva subcategoría con el documentId proporcionado
            const newSubcat = await strapi.entityService.create(
              'api::challenge-subcategory.challenge-subcategory',
              {
                data: {
                  documentId: challenge_subcategory.documentId,
                  name: challenge_subcategory.name,
                  publishedAt: new Date().toISOString(), // Forzar "Published"
                },
              }
            );
            subcategoryId = newSubcat.id;
          }
        } else if (challenge_subcategory.name) {
          // Caso 2: Solo tiene name, crear nueva subcategoría sin documentId
          const newSubcat = await strapi.entityService.create(
            'api::challenge-subcategory.challenge-subcategory',
            {
              data: {
                name: challenge_subcategory.name,
                publishedAt: new Date().toISOString(), // Forzar "Published"
                // documentId será generado automáticamente por Strapi
              },
            }
          );
          subcategoryId = newSubcat.id;
        } else {
          return ctx.badRequest('La subcategoría debe tener al menos un documentId o un name.');
        }
      }

      // 3) Manejar los productos (N:M)
      let productIDs = [];
      if (Array.isArray(challenge_products)) {
        for (const product of challenge_products) {
          if (product.documentId) {
            const products = await strapi.entityService.findMany(
              'api::challenge-product.challenge-product',
              {
                filters: { documentId: { $eq: product.documentId } },
                limit: 1,
              }
            );

            if (products.length) {
              const updatedProd = await strapi.entityService.update(
                'api::challenge-product.challenge-product',
                products[0].id,
                {
                  data: {
                    name: product.name,
                    publishedAt: new Date().toISOString(),
                  },
                }
              );
              productIDs.push(updatedProd.id);
            } else {
              const newProd = await strapi.entityService.create(
                'api::challenge-product.challenge-product',
                {
                  data: {
                    documentId: product.documentId,
                    name: product.name,
                    publishedAt: new Date().toISOString(),
                  },
                }
              );
              productIDs.push(newProd.id);
            }
          } else if (product.name) {
            const newProd = await strapi.entityService.create(
              'api::challenge-product.challenge-product',
              {
                data: {
                  name: product.name,
                  publishedAt: new Date().toISOString(),
                },
              }
            );
            productIDs.push(newProd.id);
          }
        }
      }

      // 4) Actualizar ChallengeRelationsStage y forzar su publicación
      const updatedStage = await strapi.entityService.update(
        'api::challenge-relations-stage.challenge-relations-stage',
        existingStage.id,
        {
          data: {
            minimumTradingDays,
            maximumDailyLoss,
            maximumLoss,
            profitTarget,
            leverage,
            challenge_subcategory: subcategoryId,
            challenge_products: productIDs,
            publishedAt: new Date().toISOString(), // Forzar "Published"
          },
          populate: ['challenge_subcategory', 'challenge_products'],
        }
      );

      return this.transformResponse(updatedStage);
    } catch (error) {
      console.error('Error in updateWithRelations:', error);
      return ctx.badRequest('Error actualizando ChallengeRelationsStage con relaciones.');
    }
  },
}));