import fastify from "fastify";
import sqlitePlugin from "fastify-sqlite-typed";

import { routes as brandRoutes } from "./brand.js";
import { routes as driverRoutes } from "./driver.js";
import { routes as usageRoutes } from "./usage.js";
import { routes as vehicleRoutes } from "./vehicle.js";

/**
 * Controle para o servidor.
 */
export const app = fastify();

/**
 * Rota raiz, usada apenas pra teste.
 */
app.get("/api", async (req, reply) => {
   reply.send({ ping: "pong" });
});

/**
 * Registra o plugin do SQLite.
 *
 * Quando NODE_ENV for "test" (ao rodar `npm run test`, por exemplo),
 * o banco de dados será `data-test.db`.
 *
 * Se você fez git clone do repositório bem agora, estes arquivos não
 * existem, mas serão criados automaticamente assim que o servidor
 * for iniciado pela primeira vez.
 */
app.register(sqlitePlugin, {
   dbFilename: process.env.NODE_ENV === "test" ? "./data-test.db" : "./data.db",
});

/**
 * Concatenando as rotas (endpoints) e os handlers de cada parte
 * do programa.
 */
const routes = [
   ...brandRoutes,
   ...driverRoutes,
   ...usageRoutes,
   ...vehicleRoutes,
];
/**
 * Com isso podemos adicionar todas as rotas de uma vez, de um modo
 * mais prático.
 */
routes.forEach((route) => {
   app.route(route);
});

/**
 * Inicia o servidor na porta 8080.
 */
app.listen({ port: 8080 }, (err, addr) => {
   /**
    * Se por algum motivo não for possível iniciar o servidor,
    * exibe o erro e encerra o processo automaticamente.
    */
   if (err) {
      console.error(err);
      process.exit(1);
   }

   console.log(`Servidor iniciado na porta ${addr}`);
});
