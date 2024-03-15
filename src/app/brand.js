import { app } from "./server.js";
import { queryFilter } from "./utils.js";

/**
 * Lista todas as marcas de veículos.
 *
 * Método `GET`
 */
export const getBrandsAll = async (req, reply) => {
   /**
    * Cria a tabela se já não existir.
    *
    * - `id`: Identificador, chave primária, autoincrementativa.
    * - `name`: Nome da marca, não-nulo, único.
    * - `country`: Nome do país, não-nulo.
    */
   await app.db.run(`CREATE TABLE IF NOT EXISTS brand (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            country TEXT NOT NULL
        )`);

   /**
    * Base da query.
    *
    * Esse `WHERE 1 = 1` é só um truque para poder concatenar mais condições
    * com `AND` sem maiores complicações.
    *
    * Com isso ele passa pelo `queryFilter`, que permite filtrar os dados por
    * meio de parâmetros passados na URL.
    */
   const root = `SELECT * FROM brand WHERE 1 = 1`;
   const { query, filters } = queryFilter(root, req.query);

   /**
    * Se a tabela estiver vazia, insira algumas marcas.
    *
    * Se você preferir que inicie vazio, é só comentar/remover este `if`.
    */
   if ((await app.db.all(root)).length === 0) {
      await app.db.run(
         "INSERT OR IGNORE INTO brand (name, country) VALUES ('Audi', 'Germany'),('BMW', 'Germany'),('Citroën', 'France'),('Chevrolet', 'United States'),('Fiat', 'Italy'),('Ford', 'United States'),('Honda', 'Japan'),('Hyundai', 'South Korea'),('Jeep', 'United States'),('Kia', 'South Korea'),('Mercedes-Benz', 'Germany'),('Nissan', 'Japan'),('Peugeot', 'France'),('Renault', 'France'),('Toyota', 'Japan'),('Volkswagen', 'Germany')"
      );
   }

   let res;
   try {
      res = await app.db.all(query, filters);
   } catch (_) {
      throw new Error("Verifique se os parâmetros estão corretos.");
   }

   return res;
};

/**
 * Retorna uma marca específica pelo seu ID.
 *
 * Método `GET`
 */
export const getBrand = async (req, reply) => {
   const { id } = req.params;
   const res = await app.db.all(`SELECT * FROM brand WHERE id = ${id}`);

   /**
    * Se estiver vazia, retorne um erro.
    */
   if (res.length === 0) {
      throw new Error("Não há nenhuma marca com este ID.");
   }
   /**
    * Como `SELECT` sempre retorna uma lista, e como estamos
    * buscando apenas por uma única marca, é seguro retornar
    * o primeiro item da lista.
    */
   return res[0];
};

/**
 * Cria uma marca de veículo.
 *
 * Se o nome do veículo possuir menos de 2 caracteres, ou o país/território menos de 3,
 * retorna uma mensagem de erro.
 *
 * Método `POST`
 */
export const createBrand = async (req, reply) => {
   const { name, country } = req.body;
   /**
    * Nome da marca deve possuir ao menos 2 caracteres.
    */
   if (name.length < 2) {
      throw new Error("Nome da marca deve ter ao menos 2 caracteres!");
   } else if (country.length < 3) {
      /**
       * Nome do país/território deve possuir ao menos 3 caracteres.
       */
      throw new Error(
         "Nome do país/território deve ter ao menos 3 caracteres!"
      );
   }
   await app.db.run(
      `INSERT INTO brand (name, country) VALUES ('${name}', '${country}')`
   );

   return `Marca criada com o nome de "${name}", no país/território "${country}".`;
};

/**
 * Atualiza uma marca.
 *
 * Se o nome do veículo possuir menos de 2 caracteres, ou o país/território menos de 3,
 * retorna uma mensagem de erro.
 *
 * Método `PUT`
 */
export const updateBrand = async (req, reply) => {
   const { id } = req.params;
   const { name, country } = req.body;
   /**
    * Nome da marca deve possuir ao menos 2 caracteres.
    */
   if (name.length < 2) {
      throw new Error("Nome da marca deve ter ao menos 2 caracteres!");
   } else if (country.length < 3) {
      /**
       * Nome do país/território deve possuir ao menos 3 caracteres.
       */
      throw new Error(
         "Nome do país/território deve ter ao menos 3 caracteres!"
      );
   }
   await app.db.run(
      `UPDATE brand SET name = '${name}', country = '${country}' WHERE id = ${id}`
   );

   return `Marca atualizada para "${name}", no país/território "${country}".`;
};

/**
 * Deleta a marca deste ID em específico.
 *
 * Método `DELETE`
 */
export const deleteBrand = async (req, reply) => {
   const { id } = req.params;
   await app.db.run(`DELETE FROM brand WHERE id = ${id}`);

   return `Marca "${id}" removida!`;
};

/**
 * Rotas (endpoints) e handlers para o `server.js`
 */
export const routes = [
   {
      method: "GET",
      url: "/api/brand",
      handler: getBrandsAll,
   },
   {
      method: "GET",
      url: "/api/brand/:id",
      handler: getBrand,
   },
   {
      method: "POST",
      url: "/api/brand",
      handler: createBrand,
   },
   {
      method: "PUT",
      url: "/api/brand/:id",
      handler: updateBrand,
   },
   {
      method: "DELETE",
      url: "/api/brand/:id",
      handler: deleteBrand,
   },
];
