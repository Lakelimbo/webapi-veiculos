import { app } from "./server.js";
import { queryFilter } from "./utils.js";

/**
 * Lista todos os motoristas.
 *
 * Método `GET`
 */
export const getDriversAll = async (req, reply) => {
   /**
    * Cria a tabela de motoristas, caso não exista.
    *
    * - `id`: Identificador, chave primária, autoincrementativa.
    * - `name`: Nome do motorista, não-nulo.
    * - `registered_at`: Data de registro, valor padrão é a data atual.
    */
   await app.db.run(
      `CREATE TABLE IF NOT EXISTS driver (
         id INTEGER PRIMARY KEY AUTOINCREMENT, 
         name TEXT NOT NULL,
         registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )`
   );

   /**
    * Base da query.
    *
    * Esse `WHERE 1 = 1` é só um truque para poder concatenar mais condições
    * com `AND` sem maiores complicações.
    *
    * Com isso ele passa pelo `queryFilter`, que permite filtrar os dados por
    * meio de parâmetros passados na URL.
    */
   const root = `SELECT * FROM DRIVER WHERE 1 = 1`;
   const { query, filters } = queryFilter(root, req.query);

   /**
    * Faça o query e insira os filtros, se existirem.
    */
   const res = await app.db.all(query, filters);
   /**
    * Se estiver vazia, retorne um erro.
    */
   if (res.length === 0) {
      throw new Error("Nenhum resultado.");
   }

   return res;
};

/**
 * Retorna um motorista específico pelo seu ID.
 *
 * Método `GET`
 */
export const getDriver = async (req, reply) => {
   const { id } = req.params;
   const res = await app.db.all(`SELECT * FROM driver WHERE id = ${id}`);

   /**
    * Se estiver vazia, retorne um erro.
    */
   if (res.length === 0) {
      throw new Error("Não há nenhum motorista neste ID.");
   }
   /**
    * Como `SELECT` sempre retorna uma lista, e como estamos
    * buscando apenas por um único motorista, é seguro retornar
    * o primeiro item da lista.
    */
   return res[0];
};

/**
 * Criar um motorista.
 *
 * Método `POST`
 */
export const createDriver = async (req, reply) => {
   const { name } = req.body;
   /**
    * Nome do motorista deve possuir ao menos 3 caracteres.
    */
   if (name.length < 3) {
      throw new Error("Nome do motorista deve ter ao menos 3 caracteres!");
   }
   await app.db.run(`INSERT INTO driver (name) VALUES ('${name}')`);

   return `Motorista criado com o nome de "${name}".`;
};

/**
 * Atualiza um motorista.
 *
 * Método `PUT`
 */
export const updateDriver = async (req, reply) => {
   const { id } = req.params;
   const { name } = req.body;
   /**
    * Nome do motorista deve possuir ao menos 3 caracteres.
    */
   if (name.length < 3) {
      return "Nome do motorista deve ter ao menos 3 caracteres!";
   }
   await app.db.run(`UPDATE driver SET name = '${name}' WHERE id = ${id}`);

   return `Nome de motorista atualizado para "${name}".`;
};

/**
 * Deleta um motorista.
 *
 * Método `DELETE`
 */
export const deleteDriver = async (req, reply) => {
   const { id } = req.params;
   await app.db.run(`DELETE FROM driver WHERE id = ${id}`);

   return `Motorista "${id}" removido!`;
};

/**
 * Rotas (endpoints) e handlers para o `server.js`
 */
export const routes = [
   {
      method: "GET",
      url: "/api/driver",
      handler: getDriversAll,
   },
   {
      method: "GET",
      url: "/api/driver/:id",
      handler: getDriver,
   },
   {
      method: "POST",
      url: "/api/driver",
      handler: createDriver,
   },
   {
      method: "PUT",
      url: "/api/driver/:id",
      handler: updateDriver,
   },
   {
      method: "DELETE",
      url: "/api/driver/:id",
      handler: deleteDriver,
   },
];
