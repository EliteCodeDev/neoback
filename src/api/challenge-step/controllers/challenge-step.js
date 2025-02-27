'use strict';

/**
 * challenge-step controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::challenge-step.challenge-step', ({ strapi }) => ({
  async createWithRelations(ctx) {
    try {
      // Se extrae la data desde ctx.request.body.data
      console.log('Data recibida:', ctx.request.body);
      const { name, stages = [], subcategories = [] } = ctx.request.body;

      // Arrays para almacenar los IDs de los stages y subcategorías a relacionar
      const stageIds = [];
      const subcategoryIds = [];

      // Procesamos los stages
      for (const stage of stages) {
        let stageRecord;
        if (stage.documentid) {
          // Buscamos el stage existente filtrando por documentId
          const existingStages = await strapi
            .service('api::challenge-stage.challenge-stage')
            .find({
              filters: { documentId: stage.documentid }
            });

          if (existingStages?.results?.length) {
            stageRecord = existingStages.results[0];
          } else {
            console.log('Stage nuevo1:', stage);
            // Si no se encuentra, se crea el stage
            stageRecord = await strapi
              .service('api::challenge-stage.challenge-stage')
              .create({ data: stage });
            console.log('Stage nuevo2:', stageRecord);
          }
        } else {
          console.log('Stage nuevo:', stage);
          // Se asume que es un stage nuevo
          stageRecord = await strapi
            .service('api::challenge-stage.challenge-stage')
            .create({ data: stage });
          console.log('Stage nuevo2:', stageRecord);

        }
        stageIds.push(stageRecord.id);
      }

      // Procesamos las subcategorías
      for (const subcat of subcategories) {
        let subcatRecord;
        if (subcat.documentid) {
          const existingSubcats = await strapi
            .service('api::challenge-subcategory.challenge-subcategory')
            .find({
              filters: { documentId: subcat.documentid }
            });

          if (existingSubcats?.results?.length) {
            subcatRecord = existingSubcats.results[0];
          } else {
            subcatRecord = await strapi
              .service('api::challenge-subcategory.challenge-subcategory')
              .create({ data: subcat });
          }
        } else {
          subcatRecord = await strapi
            .service('api::challenge-subcategory.challenge-subcategory')
            .create({ data: subcat });
        }
        subcategoryIds.push(subcatRecord.id);
      }

      // Se arma el objeto para crear el challenge-step
      const stepData = {
        name,
        // Asegúrate de que los nombres de los campos de relación coincidan con los definidos en el modelo
        challenge_stages: stageIds,
        challenge_subcategories: subcategoryIds
      };

      // Se crea el challenge-step con las relaciones correspondientes
      const createdStep = await strapi
        .service('api::challenge-step.challenge-step')
        .create({ data: stepData });

      ctx.send(createdStep);
    } catch (error) {
      ctx.throw(500, error);
    }
  },
  async updateWithRelations(ctx) {
    try {
      // Obtenemos el documentId del step a actualizar desde los parámetros de la URL
      console.log('Params:', ctx.params);
      const { documentId } = ctx.params;
      // Extraemos la data enviada en el body (nombre, stages y subcategories)
      console.log('Data recibida:', ctx.request.body);
      const { name, stages = [], subcategories = [] } = ctx.request.body;


      // Buscamos el step existente usando el documentId (se asume que es un campo único)
      const stepFound = await strapi
        .service('api::challenge-step.challenge-step')
        .find({
          filters: { documentId }
        });

      if (!stepFound || !stepFound.results || stepFound.results.length === 0) {
        return ctx.notFound('Step no encontrado');
      }

      // Tomamos el primer registro encontrado
      const stepRecord = stepFound.results[0];
      console.log('Step encontrado:', stepRecord);

      // Arrays para almacenar los IDs de los stages y subcategorías que se relacionarán al step
      const stageIds = [];
      const subcategoryIds = [];

      // Procesamos los stages enviados
      for (const stage of stages) {
        let stageRecord;
        if (stage.documentid) {
          // Buscamos un stage existente filtrando por documentId
          const foundStages = await strapi
            .service('api::challenge-stage.challenge-stage')
            .find({
              filters: { documentId: stage.documentid }
            });

          if (foundStages && foundStages.results && foundStages.results.length > 0) {
            stageRecord = foundStages.results[0];
            // // Opcional: actualizar el stage con la data enviada (por ejemplo, el nombre)
            // stageRecord = await strapi
            //   .service('api::challenge-stage.challenge-stage')
            //   .update(stageRecord.id, { data: stage });
          } else {
            // Si no existe, se crea el stage
            console.log('Stage nuevo1:', stage);
            stageRecord = await strapi
              .service('api::challenge-stage.challenge-stage')
              .create({ data: stage });
          }
        } else {
          // Si no se envía documentid, se asume que es un stage nuevo y se crea
          console.log('Stage nuevo:',
            stage);
          stageRecord = await strapi
            .service('api::challenge-stage.challenge-stage')
            .create({ data: stage });
        }
        stageIds.push(stageRecord.id);
      }

      // Procesamos las subcategorías de forma similar
      for (const subcat of subcategories) {
        console.log('Subcat:', subcat);
        let subcatRecord;
        if (subcat.documentid) {
          const foundSubcats = await strapi
            .service('api::challenge-subcategory.challenge-subcategory')
            .find({
              filters: { documentId: subcat.documentid }
            });

          if (foundSubcats && foundSubcats.results && foundSubcats.results.length > 0) {
            subcatRecord = foundSubcats.results[0];
            // // Opcional: actualizar la subcategoría con la data enviada
            // subcatRecord = await strapi
            //   .service('api::challenge-subcategory.challenge-subcategory')
            //   .update(subcatRecord.id, { data: subcat });
          } else {
            console.log('Subcat nuevo1:', subcat);
            subcatRecord = await strapi
              .service('api::challenge-subcategory.challenge-subcategory')
              .create({ data: subcat });
          }
        } else {
          console.log('Subcat nuevo:', subcat);
          subcatRecord = await strapi
            .service('api::challenge-subcategory.challenge-subcategory')
            .create({ data: subcat });
          console.log('Subcat nuevo2:', subcatRecord
          );
        }
        subcategoryIds.push(subcatRecord.id);
      }

      // Se arma el objeto de actualización para el step
      // Al asignar los arrays nuevos, se reemplazan las relaciones previas, por lo que se eliminan las que el usuario quitó
      const updatedStep = await strapi
        .service('api::challenge-step.challenge-step')
        .update(stepRecord.documentId, {
          data: {
            name,
            challenge_stages: stageIds,
            challenge_subcategories: subcategoryIds,
          },
        });

      ctx.send(updatedStep);
    } catch (error) {
      ctx.throw(500, error);
    }
  }
}));
