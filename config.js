// App Configuration File
const env = process.env.NODE_ENV; // Get the ENV state ( DEV / PROD )

const dev = {
    app: {
        port: parseInt( process.env.PORT ) || 4000
    },
    jwt: {
        secret: process.env.DEV_JWT_SECRET || 'secret'
    },
    mysql: {
        host: process.env.DEV_MYSQL_HOST || 'remotemysql.com',
        user: process.env.DEV_MYSQL_USER || '',
        port: parseInt( process.env.DEV_MYSQL_PORT ) || '3306',
        password: process.env.DEV_MYSQL_PASS || '',
        database: process.env.DEV_MYSQL_DB || ''
    },
    mail: {
        name: process.env.DEV_SERVER_NAME || 'JobJoinServer',
        host: process.env.DEV_MAIL_HOST || 'smtp.gmail.com',
        port: parseInt( process.env.DEV_MAIL_PORT ) || 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: process.env.DEV_MAIL_USER || '',
            clientId: process.env.DEV_MAIL_CLIENT_ID || '',
            clientSecret: process.env.DEV_MAIL_CLIENT_SECRET || '',
            refreshToken: process.env.DEV_MAIL_REFRESH_TOKEN || '',
            accessToken: process.env.DEV_MAIL_ACCESS_TOKEN || ''
        }
    },
    facebook: {
        client_id: '',
        client_secret: ''
    }
};

const prod = {
    app: {
        port: parseInt( process.env.PORT ) || 80
    },
    jwt: {
        secret: process.env.DEV_JWT_SECRET || ''
    },
    mysql: {
        host: process.env.DEV_MYSQL_HOST || 'remotemysql.com',
        user: process.env.DEV_MYSQL_USER || '',
        port: parseInt( process.env.DEV_MYSQL_PORT ) || '3306',
        password: process.env.DEV_MYSQL_PASS || '',
        database: process.env.DEV_MYSQL_DB || ''
    },
    mail: {
        name: process.env.PROD_SERVER_NAME || 'JobJoinServer',
        host: process.env.PROD_MAIL_HOST || 'smtp.gmail.com',
        port: parseInt( process.env.PROD_MAIL_PORT ) || 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: process.env.PROD_MAIL_USER || '',
            clientId: process.env.PROD_MAIL_CLIENT_ID || '',
            clientSecret: process.env.PROD_MAIL_CLIENT_SECRET || '',
            refreshToken: process.env.PROD_MAIL_REFRESH_TOKEN || '',
            accessToken: process.env.PROD_MAIL_ACCESS_TOKEN || ''
        }
    },
    facebook: {
        client_id: '',
        client_secret: ''
    }
};

const config = {
    dev,
    prod
};

module.exports = config[ "dev" ]; // Export the required config