/*
'use strict';

module.exports = {
    routes: [
      {
        method: 'PUT',
        path: '/challenge-relations/update-with-relations',
        handler: 'challenge-relation.updateWithRelations',
        config: {
          policies: [], // Agrega políticas si necesitas autenticación o permisos
        },
      },
    ],
  };
  */

  'use strict';

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/challenge-relations/:documentId/update-with-relations',
      handler: 'challenge-relation.updateWithRelations',
      config: {
        policies: [],
      },
    },
  ],
};