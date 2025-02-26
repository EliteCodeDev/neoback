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

      // 2) Manejar la subcategoría (1:1) usando documentId
      let subcategoryId = null;
      if (challenge_subcategory && challenge_subcategory.documentId) {
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
                // otros campos...
                publishedAt: new Date().toISOString(), // Forzar "Published"
              },
            }
          );
          subcategoryId = updatedSubcat.id;
        } else {
          // Crear una nueva subcategoría
          const newSubcat = await strapi.entityService.create(
            'api::challenge-subcategory.challenge-subcategory',
            {
              data: {
                documentId: challenge_subcategory.documentId,
                name: challenge_subcategory.name,
                // otros campos...
                publishedAt: new Date().toISOString(), // Forzar "Published"
              },
            }
          );
          subcategoryId = newSubcat.id;
        }
      }

      // 3) Manejar los productos (N:M) usando documentId
      let productIDs = [];
      if (Array.isArray(challenge_products)) {
        for (const product of challenge_products) {
          if (!product.documentId) continue;

          const products = await strapi.entityService.findMany(
            'api::challenge-product.challenge-product',
            {
              filters: { documentId: { $eq: product.documentId } },
              limit: 1,
            }
          );

          if (products.length) {
            // Actualizar el producto existente
            const updatedProd = await strapi.entityService.update(
              'api::challenge-product.challenge-product',
              products[0].id,
              {
                data: {
                  name: product.name,
                  // otros campos...
                  publishedAt: new Date().toISOString(), // Forzar "Published"
                },
              }
            );
            productIDs.push(updatedProd.id);
          } else {
            // Crear un nuevo producto
            const newProd = await strapi.entityService.create(
              'api::challenge-product.challenge-product',
              {
                data: {
                  documentId: product.documentId,
                  name: product.name,
                  // otros campos...
                  publishedAt: new Date().toISOString(), // Forzar "Published"
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
            // Forzar "Published"
            publishedAt: new Date().toISOString(),
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
