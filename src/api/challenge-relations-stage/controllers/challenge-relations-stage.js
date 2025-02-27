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

      // 2) Manejar la subcategoría (relación 1:1)
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
          subcategoryId = subcategories[0].id;
        } else {
          return ctx.badRequest(`No se encontró ChallengeSubcategory con documentId = ${challenge_subcategory.documentId}`);
        }
      }
      // Si no se proporciona challenge_subcategory o es null, subcategoryId será null, desvinculando la relación

      // 3) Manejar los productos (relación N:M)
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
              productIDs.push(products[0].id);
            } else {
              return ctx.badRequest(`No se encontró ChallengeProduct con documentId = ${product.documentId}`);
            }
          }
        }
      }
      // Si no se proporcionan productos, productIDs será un array vacío, desvinculando todos los productos previos

      // 4) Actualizar solo ChallengeRelationsStage con las relaciones
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