export default {
    dialect:'postgresql',
    schema:"./utils/database/schema.ts",
    out:'./drizzle',


    dbCredentials:{
        url:process.env.DATABASE_URL,
        connectionStrings:process.env.DATABASE_URL,
    }

}