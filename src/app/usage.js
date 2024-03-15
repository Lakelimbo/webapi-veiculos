import { app } from "./server.js";
import { queryFilter } from "./utils.js";

/**
 * Lista todos os registros de uso de veículos.
 *
 * Método `GET`
 */
export const getUsageAll = async (req, reply) => {
   /**
    * Cria a tabela de uso de veículos, caso não exista.
    *
    * - `id`: Identificador, chave primária, autoincrementativa.
    * - `driver_id`: Identificador do motorista, não-nulo.
    * - `vehicle_id`: Identificador do veículo, não-nulo.
    * - `start_date`: Data de início, não-nulo, valor padrão é a data atual.
    * - `end_date`: Data de término. Pode ser NULL, significando que o veículo
    *               ainda está em uso.
    * - `reasoning`: Motivo do uso, não-nulo.
    */
   await app.db.run(`CREATE TABLE IF NOT EXISTS usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        reasoning TEXT NOT NULL,

        FOREIGN KEY (driver_id) REFERENCES driver (id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicle (id)
    )`);

   /**
    * Base da query.
    *
    * Esse `WHERE 1 = 1` é só um truque para poder concatenar mais condições
    * com `AND` sem maiores complicações.
    *
    * Com isso ele passa pelo `queryFilter`, que permite filtrar os dados por
    * meio de parâmetros passados na URL.
    *
    * Aqui selecionando os campos do uso, mas também do motorista e do veículo,
    * fazendo uma JOIN com ambos.
    */
   const root = `
        SELECT
            usage.id,
            driver.name AS driver,
            vehicle.name AS vehicle,
            usage.start_date,
            usage.end_date,
            usage.reasoning
        FROM usage
        JOIN driver ON usage.driver_id = driver.id
        JOIN vehicle ON usage.vehicle_id = vehicle.id
        WHERE 1 = 1
    `;
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
 * Retorna um registro de uso específico pelo seu ID.
 *
 * Método `GET`
 */
export const getUsage = async (req, reply) => {
   const { id } = req.params;
   const res = await app.db.all(`SELECT * FROM usage WHERE id = ${id}`);

   /**
    * Se estiver vazia, retorne um erro.
    */
   if (res.length === 0) {
      throw new Error("Não há nenhum registro com este ID.");
   }
   return res[0];
};

/**
 * Cria um registro de uso de veículo.
 *
 * Método `POST`
 */
export const createUsage = async (req, reply) => {
   const { driver_id, vehicle_id, reasoning } = req.body;

   /**
    * Verifica se o motorista existe e se o `end_date` é NULL.
    *
    * Caso o motorista já esteja usando um veículo, retorna um erro.
    */
   const checkDriver = await app.db.all(
      `SELECT * FROM usage WHERE driver_id = ${driver_id} AND end_date IS NULL`
   );
   if (checkDriver.length > 0) {
      throw new Error("Este motorista já está usando um veículo!");
   }

   /**
    * Verifica se o veículo existe e se o `end_date` é NULL.
    *
    * Caso o veículo já esteja em uso, retorna um erro.
    */
   const checkVehicle = await app.db.all(
      `SELECT * FROM usage WHERE vehicle_id = ${vehicle_id} AND end_date IS NULL`
   );
   if (checkVehicle.length > 0) {
      throw new Error("Este veículo já está em uso!");
   }

   await app.db.run(
      `INSERT INTO usage (driver_id, vehicle_id, reasoning) VALUES (${driver_id}, ${vehicle_id}, '${reasoning}')`
   );

   return "Registro criado com sucesso.";
};

/**
 * Finaliza um registro de uso de veículo.
 *
 * Diferente dos outros métodos de atualização, este não recebe um corpo
 * com dados, mas sim irá atualizar o campo `end_date` para a data atual,
 * ou seja, tornando o registro finalizado, e o veículo disponível para uso.
 *
 * Método `PUT`
 */
export const finalizeUsage = async (req, reply) => {
   const { id } = req.params;

   /**
    * Verifica se o ID existe.
    *
    * Caso não exista, retorne um erro.
    */
   const checkId = await app.db.all(`SELECT * FROM usage WHERE id = ${id}`);
   if (checkId.length === 0) {
      throw new Error("ID de uso não encontrado.");
   }

   await app.db.run(
      `UPDATE usage SET end_date = CURRENT_TIMESTAMP WHERE id = ${id}`
   );

   return "Registro finalizado!";
};

/**
 * Deleta um registro de uso de veículo.
 *
 * Método `DELETE`
 */
export const deleteUsage = async (req, reply) => {
   const { id } = req.params;

   /**
    * Verifica se o ID existe.
    *
    * Caso não exista, retorne um erro.
    */
   const checkId = await app.db.all(`SELECT * FROM usage WHERE id = ${id}`);
   if (checkId.length === 0) {
      throw new Error("ID de uso não encontrado.");
   }

   await app.db.run(`DELETE FROM usage WHERE id = ${id}`);

   return "Registro deletado!";
};

/**
 * Rotas (endpoints) e handlers para o `server.js`
 */
export const routes = [
   {
      method: "GET",
      url: "/api/usage",
      handler: getUsageAll,
   },
   {
      method: "GET",
      url: "/api/usage/:id",
      handler: getUsage,
   },
   {
      method: "POST",
      url: "/api/usage",
      handler: createUsage,
   },
   {
      method: "PUT",
      url: "/api/usage/:id",
      handler: finalizeUsage,
   },
   {
      method: "DELETE",
      url: "/api/usage/:id",
      handler: deleteUsage,
   },
];
