'use strict';

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/challenge-relations-stages/:documentId/update-with-relations',
      handler: 'challenge-relations-stage.updateWithRelations',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
