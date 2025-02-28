'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::challenge-relation.challenge-relation', ({ strapi }) => ({
  async updateWithRelations(ctx) {
    try {
      // Obtener documentId desde los parámetros de la URL
      const { documentId } = ctx.params;

      // Extraer datos del cuerpo de la solicitud (dentro de "data")
      const {
        minimumTradingDays,
        maximumDailyLoss,
        maximumLoss,
        profitTarget,
        leverage,
        challenge_subcategory,
        challenge_step,
        challenge_stages,
        challenge_products,
      } = ctx.request.body.data || {};

      // Validar que se proporcione un documentId
      if (!documentId) {
        return ctx.badRequest('El parámetro "documentId" es obligatorio.');
      }

      // 1) Buscar el ChallengeRelations por documentId
      const relations = await strapi.entityService.findMany(
        'api::challenge-relation.challenge-relation',
        {
          filters: { documentId: { $eq: documentId } },
          limit: 1,
        }
      );
      if (!relations.length) {
        return ctx.notFound(`No se encontró ChallengeRelations con documentId = ${documentId}`);
      }
      const existingRelation = relations[0];

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

      // 3) Manejar el step (relación 1:1)
      let stepId = null;
      if (challenge_step && challenge_step.documentId) {
        const steps = await strapi.entityService.findMany(
          'api::challenge-step.challenge-step',
          {
            filters: { documentId: { $eq: challenge_step.documentId } },
            limit: 1,
          }
        );
        if (steps.length) {
          stepId = steps[0].id;
        } else {
          return ctx.badRequest(`No se encontró ChallengeStep con documentId = ${challenge_step.documentId}`);
        }
      }

      // 4) Manejar las stages (relación N:M)
      let stageIDs = [];
      if (Array.isArray(challenge_stages)) {
        for (const stage of challenge_stages) {
          if (stage.documentId) {
            const stages = await strapi.entityService.findMany(
              'api::challenge-stage.challenge-stage',
              {
                filters: { documentId: { $eq: stage.documentId } },
                limit: 1,
              }
            );
            if (stages.length) {
              stageIDs.push(stages[0].id);
            } else {
              return ctx.badRequest(`No se encontró ChallengeStage con documentId = ${stage.documentId}`);
            }
          }
        }
      }

      // 5) Manejar los products (relación N:M)
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

      // 6) Actualizar ChallengeRelations
      const updatedRelation = await strapi.entityService.update(
        'api::challenge-relation.challenge-relation',
        existingRelation.id,
        {
          data: {
            minimumTradingDays,
            maximumDailyLoss,
            maximumLoss,
            profitTarget,
            leverage,
            challenge_subcategory: subcategoryId,
            challenge_step: stepId,
            challenge_stages: stageIDs,
            challenge_products: productIDs,
            publishedAt: new Date().toISOString(),
          },
          populate: ['challenge_subcategory', 'challenge_step', 'challenge_stages', 'challenge_products'],
        }
      );

      // Devolver la respuesta transformada
      return this.transformResponse(updatedRelation);
    } catch (error) {
      console.error('Error en updateWithRelations:', error);
      return ctx.badRequest('Error al actualizar ChallengeRelations con relaciones.');
    }
  },
}));