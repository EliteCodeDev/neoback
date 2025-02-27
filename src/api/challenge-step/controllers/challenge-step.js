'use strict';

/**
 * challenge-step controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::challenge-step.challenge-step', ({ strapi }) => ({
  async createWithRelations(ctx) {
    try {
      // Se extrae la data desde ctx.request.body
      console.log('Data recibida:', ctx.request.body);
      const { name, stages = [], subcategories = [] } = ctx.request.body;

      // Array para almacenar los IDs de los stages creados o existentes
      const stageIds = [];

      // Procesamos los stages
      for (const stage of stages) {
        let stageRecord;
        if (stage.documentId) {
          // Buscamos el stage existente filtrando por documentId
          const existingStages = await strapi
            .service('api::challenge-stage.challenge-stage')
            .find({
              filters: { documentId: stage.documentId }
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
        console.log('Stage:', stageRecord);
        stageIds.push(stageRecord.documentId);
      }

      // Se arma el objeto para crear el challenge-step (sin stages, ya que no es una relación directa)
      const stepData = {
        name
      };

      // Se crea el challenge-step
      const createdStep = await strapi
        .service('api::challenge-step.challenge-step')
        .create({ data: stepData });
      console.log('Challenge Step creado:', createdStep);

      // Procesamos las subcategorías y creamos una relación para cada una, asignándole todos los stages
      for (const subcat of subcategories) {
        let subcatRecord;
        if (subcat.documentId) {
          const existingSubcats = await strapi
            .service('api::challenge-subcategory.challenge-subcategory')
            .find({
              filters: { documentId: subcat.documentId }
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
        console.log('Subcat:', subcatRecord);

        // Se crea un registro en Challenge Relations que contenga:
        // - El id de la subcategoría
        // - El id del challenge-step
        // - Todos los stages enviados
        let challengeRelation = await strapi
          .service('api::challenge-relation.challenge-relation')
          .create({
            data: {
              challenge_subcategory: subcatRecord.documentId,
              challenge_step: createdStep.documentId,
              challenge_stages: stageIds
            }
          });
        console.log('Challenge Relation:', challengeRelation);
      }

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
        if (stage.documentId) {
          console.log('tiene document:', stage.documentId);
          // Buscamos un stage existente filtrando por documentId
          const foundStages = await strapi
            .service('api::challenge-stage.challenge-stage')
            .find({
              filters: { documentId: stage.documentId }
            });

          if (foundStages && foundStages.results && foundStages.results.length > 0) {
            stageRecord = foundStages.results[0];
            console.log('Stage encontrado:', stageRecord);
            // // Opcional: actualizar el stage con la data enviada (por ejemplo, el nombre)
            // stageRecord = await strapi
            //   .service('api::challenge-stage.challenge-stage')
            //   .update(stageRecord.id, { data: stage });
          } else {
            // Si no existe, se crea el stage
            console.log('Stage nuevo:', stage);
            stageRecord = await strapi
              .service('api::challenge-stage.challenge-stage')
              .create({ data: stage });
          }
        } else {
          // Si no se envía documentid, se asume que es un stage nuevo y se crea
          console.log('Stage nuevo1:',
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
        if (subcat.documentId) {
          console.log('tiene document:', subcat.documentId);
          const foundSubcats = await strapi
            .service('api::challenge-subcategory.challenge-subcategory')
            .find({
              filters: { documentId: subcat.documentId }
            });

          if (foundSubcats && foundSubcats.results && foundSubcats.results.length > 0) {
            subcatRecord = foundSubcats.results[0];
            console.log('Subcat encontrado:', subcatRecord);
            // // Opcional: actualizar la subcategoría con la data enviada
            // subcatRecord = await strapi
            //   .service('api::challenge-subcategory.challenge-subcategory')
            //   .update(subcatRecord.id, { data: subcat });
          } else {
            console.log('Subcat nuevo:', subcat);
            subcatRecord = await strapi
              .service('api::challenge-subcategory.challenge-subcategory')
              .create({ data: subcat });
          }
        } else {
          console.log('Subcat nuev1:', subcat);
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
  },
  async getAllData(ctx) {
    console.log('getAllData');
    try {
      // Obtenemos todos los steps, incluyendo las relaciones con sus subcategorías y stages
      const steps = await strapi
        .service('api::challenge-step.challenge-step')
        .find({
          populate: {
            challenge_relations: {
              populate: ['challenge_subcategory', 'challenge_stages']
            }
          }
        });
      console.log('Steps encontrados:', JSON.stringify(steps, null, 2));

      // Procesamos cada step para extraer las subcategorías y stages de cada relación,
      // evitando duplicados (filtrando por documentId)
      steps.data = steps.results.map(step => {
        console.log('Procesando step con documentId:', step.documentId);
        const subcategories = [];
        const stages = [];
        if (step.challenge_relations && Array.isArray(step.challenge_relations)) {
          step.challenge_relations.forEach(relation => {
            console.log('Procesando relación:', JSON.stringify(relation, null, 2));

            // Procesamos la subcategoría
            if (relation.challenge_subcategory) {
              console.log('Subcategoría encontrada:', JSON.stringify(relation.challenge_subcategory, null, 2));
              if (!subcategories.find(sc => sc.documentId === relation.challenge_subcategory.documentId)) {
                subcategories.push(relation.challenge_subcategory);
              }
            }

            // Procesamos los stages: pueden venir como objeto único o como arreglo
            if (relation.challenge_stages) {
              const relationStages = Array.isArray(relation.challenge_stages)
                ? relation.challenge_stages
                : [relation.challenge_stages];
              relationStages.forEach(stage => {
                console.log('Stage encontrado:', JSON.stringify(stage, null, 2));
                if (!stages.find(s => s.documentId === stage.documentId)) {
                  stages.push(stage);
                }
              });
            }
          });
        }

        // Retornamos el objeto step enriquecido con los arrays filtrados
        return {
          ...step,
          challenge_subcategories: subcategories,
          challenge_stages: stages
        };
      });

      console.log('Steps procesados:', JSON.stringify(steps, null, 2));
      ctx.send(steps);
    } catch (error) {
      console.error('Error en getAllData:', error);
      ctx.throw(500, error);
    }
  }


}));
