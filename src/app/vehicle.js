import { app } from "./server.js";
import { queryFilter } from "./utils.js";

/**
 * Lista todos os veículos.
 *
 * Método `GET`
 */
export const getVehicleAll = async (req, reply) => {
   /**
    * Cria a tabela de veículos, caso não exista.
    *
    * - `id`: Identificador, chave primária, autoincrementativa.
    * - `name`: Nome do veículo, não-nulo.
    * - `license_plate`: Placa do veículo, não-nulo, única.
    * - `type`: Tipo do veículo, não-nulo.
    * - `brand_id`: Identificador da marca, não-nulo.
    * - `mileage_km`: Quilometragem, padrão é 0.
    * - `color`: Cor do veículo, não-nulo.
    * - `created_at`: Data de registro, valor padrão é a data atual.
    *
    * A tabela então tem uma chave foreign para a tabela de marcas (brand).
    *
    * Tem também 3 constraints:
    * - `type`: Só pode ser 'car', 'motorcycle', 'truck' ou 'bus'.
    * - `color`: Só pode ser 'red', 'blue', 'green', 'yellow', 'gray', 'black' ou 'white'.
    * - `mileage_km`: Só pode ser maior ou igual a 0.
    */
   await app.db.run(`CREATE TABLE IF NOT EXISTS vehicle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        license_plate TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        brand_id INTEGER NOT NULL,
        mileage_km INTEGER DEFAULT 0,
        color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (brand_id) REFERENCES brand (id),

        CONSTRAINT type CHECK (type IN ('car', 'motorcycle', 'truck', 'bus')),
        CONSTRAINT color CHECK (color IN ('red', 'blue', 'green', 'yellow', 'gray', 'black', 'white'))
        CONSTRAINT mileage_km CHECK (mileage_km >= 0)
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
    * Aqui selecionando os campos do veículo e fazendo uma JOIN com a marca.
    */
   const root = `
      SELECT
         vehicle.id,
         vehicle.name,
         vehicle.type,
         vehicle.license_plate,
         vehicle.mileage_km,
         brand.name AS brand,
         vehicle.color,
         vehicle.created_at
      FROM vehicle
      JOIN brand ON vehicle.brand_id = brand.id
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
 * Retorna um veículo específico pelo seu ID.
 * 
 * Método `GET`
 */
export const getVehicle = async (req, reply) => {
   const { id } = req.params;
   const res = await app.db.all(`SELECT * FROM vehicle WHERE id = ${id}`);

   /**
    * Se estiver vazia, retorne um erro.
    */
   if (res.length === 0) {
      throw new Error("Não há nenhum veículo com este ID.");
   }
   /**
    * Como `SELECT` sempre retorna uma lista, e como estamos
    * buscando apenas por um único veículo, é seguro retornar
    * o primeiro item da lista.
    */
   return res[0];
};

/**
 * Cria um veículo.
 * 
 * Método `POST`
 */
export const createVehicle = async (req, reply) => {
   const { name, type, license_plate, brand_id, mileage_km, color } = req.body;
   /**
    * Nome do veículo deve possuir ao menos 3 caracteres.
    */
   if (name.length < 3) {
      throw new Error("Nome do veículo deve ter ao menos 3 caracteres!");
   }
   /**
    * Placa do veículo deve possuir ao menos 7 caracteres.
    */
   if (license_plate.length < 7) {
      throw new Error("Placa do veículo deve ter ao menos 7 caracteres!");
   }
   await app.db.run(
      `INSERT INTO vehicle (name, type, license_plate, brand_id, mileage_km, color) VALUES ('${name}', '${type}', '${license_plate}', ${brand_id}, ${mileage_km}, '${color}')`
   );

   return `Veículo criado com o nome de "${name}", placa "${license_plate}".`;
};

/**
 * Atualiza um veículo.
 * 
 * Método `PUT`
 */
export const updateVehicle = async (req, reply) => {
   const { id } = req.params;
   const { name, license_plate, brand_id, type, mileage_km, color } = req.body;
   /**
    * 
    */
   if (name.length < 3) {
      throw new Error("Nome do veículo deve ter ao menos 3 caracteres!");
   }
   /**
    * Placa do veículo deve possuir ao menos 7 caracteres.
    */
   if (license_plate.length < 7) {
      throw new Error("Placa do veículo deve ter ao menos 7 caracteres!");
   }
   await app.db.run(
      `UPDATE vehicle SET name = '${name}', license_plate = '${license_plate}', brand_id = ${brand_id}, type = '${type}', mileage_km = ${mileage_km}, color = '${color}' WHERE id = ${id}`
   );

   return `Veículo atualizado para "${name}", placa "${license_plate}".`;
};

/**
 * Deleta um veículo.
 * 
 * Método `DELETE`
 */
export const deleteVehicle = async (req, reply) => {
   const { id } = req.params;
   await app.db.run(`DELETE FROM vehicle WHERE id = ${id}`);

   return `Veículo "${id}" removido!`;
};

/**
 * Rotas (endpoints) e handlers para o `server.js`
 */
export const routes = [
   {
      method: "GET",
      url: "/api/vehicle",
      handler: getVehicleAll,
   },
   {
      method: "GET",
      url: "/api/vehicle/:id",
      handler: getVehicle,
   },
   {
      method: "POST",
      url: "/api/vehicle",
      handler: createVehicle,
   },
   {
      method: "PUT",
      url: "/api/vehicle/:id",
      handler: updateVehicle,
   },
   {
      method: "DELETE",
      url: "/api/vehicle/:id",
      handler: deleteVehicle,
   },
];
