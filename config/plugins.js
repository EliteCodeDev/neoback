module.exports = ({ env }) => ({
  // ...
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.example.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        // ... any custom nodemailer options
      },
      settings: {
        defaultFrom: 'Wazend <soporte@wazend.net>',
        defaultReplyTo: 'soporte@wazend.net',
      },
    },
  },
  // ...
  // Otras configuraciones de plugins
  "users-permissions": {
    config: {
      register: {
        allowedFields: [
          "name",   // Permitir el campo 'name'
          "phone"   // Permitir el campo 'phone'
        ],
      },
    },
  },

});