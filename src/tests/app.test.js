import supertest from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../app/server";

import {
   createBrand,
   deleteBrand,
   getBrand,
   getBrandsAll,
   updateBrand,
} from "../app/brand";
import {
   createDriver,
   deleteDriver,
   getDriver,
   getDriversAll,
   updateDriver,
} from "../app/driver";
import {
   createUsage,
   deleteUsage,
   finalizeUsage,
   getUsageAll,
} from "../app/usage";
import {
   createVehicle,
   deleteVehicle,
   getVehicle,
   getVehicleAll,
   updateVehicle,
} from "../app/vehicle";

const emptyQuery = { query: {} };

describe("Testes do servidor", async () => {
   /**
    * Teste básico para verificar o Vitest
    */
   it("Teste do teste", async () => {
      expect(1 + 2).toBe(3);
   });
   /**
    * Verificando se o NODE_ENV == "test"
    *
    * Com o NODE_ENV == "test", o banco de dados utilizado é
    * em um arquivo diferente.
    */
   it("Verificar o environment", async () => {
      expect(process.env.NODE_ENV).toBe("test");
   });
   /**
    * Verifica se o servidor está funcionando corretamente.
    *
    * Diferente dos outros testes, que são "diretos", este
    * usa HTTP requests, ao invés de SQL queries indiretas.
    */
   it("Verificar o funcionamento do servidor", async () => {
      await app.ready();
      /**
       * Status 200 = tudo OK
       */
      const res = await supertest(app.server).get("/api").expect(200);

      expect(res.body).toEqual({ ping: "pong" });
   });
});

describe("API", () => {
   describe.sequential("Marcas", async () => {
      it("Listar todas as marcas", async () => {
         expect((await getBrandsAll(emptyQuery)).length).toBeGreaterThan(0);
      });

      it("Filtrar marcas", async () => {
         /**
          * Procurar marca por nome
          */
         expect(
            (await getBrandsAll({ query: { name: "Fiat" } })).length
         ).toBeGreaterThan(0);
         /**
          * Procurar marca por país/território
          */
         expect(
            (await getBrandsAll({ query: { country: "Italy" } })).length
         ).toBeGreaterThan(0);
         /**
          * Esperar resultado nulo (Audi não é do Japão)
          */
         expect(
            (await getBrandsAll({ query: { name: "Audi", country: "Japan" } }))
               .length
         ).toBe(0);
      });

      it("Buscar marca por ID", async () => {
         /**
          * Verifica se "Audi" existe
          */
         expect(await getBrand({ params: { id: 1 } })).toEqual({
            id: 1,
            name: "Audi",
            country: "Germany",
         });
         /**
          * Verifica se "Audi" é ID == 1 e que não é da França
          */
         expect(await getBrand({ params: { id: 1 } })).not.toEqual({
            id: 1,
            name: "Audi",
            country: "France",
         });
         /**
          * Verifica se um ID inexistente retorna a mensagem de erro
          */
         await expect(getBrand({ params: { id: 100 } })).rejects.toThrowError(
            "Não há nenhuma marca com este ID."
         );
      });

      it("Criar marca", async () => {
         /**
          * Criar uma marca com nome e país/território válidos
          */
         expect(
            await createBrand({
               body: {
                  id: 17,
                  name: "Suzuki",
                  country: "Japan",
               },
            })
         ).toBe(
            'Marca criada com o nome de "Suzuki", no país/território "Japan".'
         );
         /**
          * Verifica se a marca foi criada corretamente
          *
          * Por ser um objeto async (Promise), precisa de utilizar
          * o `then()` para acessar o campo específico, pois o Node
          * não consegue reconhecer ele diretamente (retornando undefined).
          */
         expect(
            await getBrand({ params: { id: 17 } }).then((res) => res["name"])
         ).toBe("Suzuki");
         /**
          * Esperar erro após nome inválido (< 2 caracteres)
          */
         await expect(
            createBrand({ body: { name: "X", country: "ABC" } })
         ).rejects.toThrowError(/caracteres/);
         /**
          * Esperar erro após país/território inválido (< 3 caracteres)
          */
         await expect(
            createBrand({ body: { name: "XYZ", country: "A" } })
         ).rejects.toThrowError(/caracteres/);
         /**
          * Atualiza a marca para Ferrari
          */
         expect(
            await updateBrand({
               params: { id: 17 },
               body: {
                  name: "Ferrari",
                  country: "Italy",
               },
            })
         ).toBe('Marca atualizada para "Ferrari", no país/território "Italy".');
         /**
          * Verifica se a marca foi atualizada corretamente
          */
         expect(
            await getBrand({ params: { id: 17 } }).then((res) => res["name"])
         ).toBe("Ferrari");
         /**
          * Esperar erro de atualização após nome inválido (< 2 caracteres)
          */
         await expect(
            updateBrand({
               params: { id: 17 },
               body: {
                  name: "X",
                  country: "ABC",
               },
            })
         ).rejects.toThrowError(/caracteres/);
         /**
          * Esperar erro de atualização após país/território inválido (< 3 caracteres)
          */
         await expect(
            updateBrand({
               params: { id: 17 },
               body: {
                  name: "XYZ",
                  country: "A",
               },
            })
         ).rejects.toThrowError(/caracteres/);
      });
      /**
       * Exclui a marca que adicionamos e checa se foi removida
       */
      it("Deletar marca", async () => {
         expect(await deleteBrand({ params: { id: 17 } })).toBe(
            'Marca "17" removida!'
         );
         await expect(getBrand({ params: { id: 17 } })).rejects.toThrowError(
            "Não há nenhuma marca com este ID."
         );
      });
   });

   describe.sequential("Motoristas", () => {
      /**
       * Listar todos os motoristas, inicialmente vazio
       */
      it("Listar motoristas (início)", async () => {
         /**
          * Como o teste pode ser rodado várias vezes, é preciso
          * que delete todos os motoristas que podem ter sido criados
          * em runs anteriores.
          */
         await app.db.run(`DROP TABLE IF EXISTS driver`);
         await expect(getDriversAll(emptyQuery)).rejects.toThrowError(
            "Nenhum resultado."
         );
      });

      /**
       * Criando dois motoristas
       */
      it("Criar motorista", async () => {
         expect(await createDriver({ body: { id: 1, name: "João" } })).toBe(
            'Motorista criado com o nome de "João".'
         );
         expect(await createDriver({ body: { id: 2, name: "Maria" } })).toBe(
            'Motorista criado com o nome de "Maria".'
         );
      });

      /**
       * Listando e filtrando motoristas adicionados
       */
      it("Listar motoristas (não-vazio)", async () => {
         /**
          * A lista não é mais vazia
          */
         expect((await getDriversAll(emptyQuery)).length).not.toBe(0);
         /**
          * Filtrando pelo nome "João".
          *
          * Para evitar complicações, esse `registered_at` possui um
          * util que retorna qualquer string para fingir que é uma data.
          */
         expect(await getDriversAll({ query: { name: "João" } })).toEqual([
            {
               id: 1,
               name: "João",
               registered_at: expect.any(String),
            },
         ]);
         /**
          * Filtrando por motorista não existente
          */
         await expect(
            getDriversAll({ query: { name: "Helena" } })
         ).rejects.toThrowError("Nenhum resultado.");
      });
      /**
       * Motorista específico
       */
      it("Motorista específico", async () => {
         expect(await getDriver({ params: { id: 2 } })).toEqual({
            id: 2,
            name: "Maria",
            registered_at: expect.any(String),
         });
      });

      it("Atualizar motorista", async () => {
         /**
          * Atualiza motorista "Maria" para "Rodrigo"
          */
         expect(
            await updateDriver({ params: { id: 2 }, body: { name: "Rodrigo" } })
         ).toBe('Nome de motorista atualizado para "Rodrigo".');
         /**
          * Verifica se o motorista foi atualizado corretamente
          */
         expect(await getDriver({ params: { id: 2 } })).toEqual({
            id: 2,
            name: "Rodrigo",
            registered_at: expect.any(String),
         });
      });

      it("Deletar motorista", async () => {
         /**
          * Exclui o motorista "Rodrigo"
          */
         expect(await deleteDriver({ params: { id: 2 } })).toBe(
            'Motorista "2" removido!'
         );
         /**
          * Verifica se o motorista foi excluído corretamente
          */
         await expect(getDriver({ params: { id: 2 } })).rejects.toThrowError(
            "Não há nenhum motorista neste ID."
         );
         /**
          * Como deletou apenas o motorista ID == 2, a tabela
          * ainda deve possuir um motorista, então o length será
          * exatamente 1.
          */
         expect((await getDriversAll(emptyQuery)).length).toBe(1);
      });
   });

   describe.sequential("Veículo", () => {
      /**
       * Listar todos os veículos, inicialmente vazio
       */
      it("Listar veículos (início)", async () => {
         await app.db.run(`DROP TABLE IF EXISTS vehicle`);
         await expect(getVehicleAll(emptyQuery)).rejects.toThrowError(
            "Nenhum resultado."
         );
      });
      /**
       * Criando alguns veículos
       */
      it("Criar veículo", async () => {
         /**
          * Criando um Uno vermelho
          *
          * 5 -> Fiat
          */
         expect(
            await createVehicle({
               body: {
                  id: 1,
                  name: "Uno",
                  type: "car",
                  license_plate: "ABC1234",
                  brand_id: 5,
                  mileage_km: 12000,
                  color: "red",
               },
            })
         ).toBe('Veículo criado com o nome de "Uno", placa "ABC1234".');
         /**
          * Criando um Gol preto
          *
          * 16 -> Volkswagen
          */
         expect(
            await createVehicle({
               body: {
                  id: 2,
                  name: "Gol",
                  type: "car",
                  license_plate: "DEF5678",
                  brand_id: 16,
                  mileage_km: 24000,
                  color: "black",
               },
            })
         ).toBe('Veículo criado com o nome de "Gol", placa "DEF5678".');
      });
      /**
       * Listando e filtrando veículos adicionados
       */
      it("Listar veículos (não-vazio)", async () => {
         /**
          * Agora a lista de veículos não é mais vazia
          */
         expect((await getVehicleAll(emptyQuery)).length).not.toBe(0);
         /**
          * Filtrando pelo nome "Uno".
          */
         expect(
            await getVehicleAll({ query: { "vehicle.name": "Uno" } })
         ).toEqual([
            {
               id: 1,
               name: "Uno",
               type: "car",
               license_plate: "ABC1234",
               mileage_km: 12000,
               brand: "Fiat",
               color: "red",
               created_at: expect.any(String),
            },
         ]);
         /**
          * Filtrando e esperando erros, já que não há
          * veículos com essas características.
          *
          * Note que apenas para simplificar para o projeto, o
          * query (diretamente pela função) é feito com a sintaxe
          * com ponto (porque tecnicamente está passando tudo diretamente
          * para o SQLite).
          */
         await expect(
            getVehicleAll({ query: { "vehicle.name": "Fusca" } })
         ).rejects.toThrowError("Nenhum resultado.");
         await expect(
            getVehicleAll({ query: { "vehicle.type": "truck" } })
         ).rejects.toThrowError("Nenhum resultado.");
         await expect(
            getVehicleAll({ query: { "brand.name": "Ford" } })
         ).rejects.toThrowError("Nenhum resultado.");
         /**
          * Filtrando pela cor preta
          */
         expect(
            (await getVehicleAll({ query: { color: "black" } })).length
         ).toBe(1);
      });
      /**
       * Veículo específico
       */
      it("Veículo específico", async () => {
         expect(await getVehicle({ params: { id: 2 } })).toEqual({
            id: 2,
            name: "Gol",
            type: "car",
            license_plate: "DEF5678",
            mileage_km: 24000,
            brand_id: 16,
            color: "black",
            created_at: expect.any(String),
         });
      });
      /**
       * Atualizando um veículo
       */
      it("Atualizar veículo", async () => {
         /**
          * Agora o veículo de ID == 2 é um caminhão azul da Ford
          */
         expect(
            await updateVehicle({
               params: { id: 2 },
               body: {
                  name: "Cargo 2428",
                  type: "truck",
                  license_plate: "GHI9012",
                  brand_id: 6,
                  mileage_km: 50500,
                  color: "blue",
               },
            })
         ).toBe('Veículo atualizado para "Cargo 2428", placa "GHI9012".');
         /**
          * Listando e filtrando pelo caminhão então modificado
          */
         expect(
            await getVehicleAll({ query: { "vehicle.name": "Cargo 2428" } })
         ).toEqual([
            {
               id: 2,
               name: "Cargo 2428",
               type: "truck",
               license_plate: "GHI9012",
               mileage_km: 50500,
               brand: "Ford",
               color: "blue",
               created_at: expect.any(String),
            },
         ]);
      });
      /**
       * Removendo veículo
       */
      it("Deletar veículo", async () => {
         /**
          * Removendo o caminhão
          */
         expect(await deleteVehicle({ params: { id: 2 } })).toBe(
            'Veículo "2" removido!'
         );
         /**
          * Não há mais veículo com ID == 2
          */
         await expect(getVehicle({ params: { id: 2 } })).rejects.toThrowError(
            "Não há nenhum veículo com este ID."
         );
         /**
          * Agora a lista possui apenas um único veículo
          */
         expect((await getVehicleAll(emptyQuery)).length).toBe(1);
      });
   });

   describe.sequential("Registro de uso", () => {
      /**
       * Listar todos os usos, inicialmente vazio
       */
      it("Listar usos (início)", async () => {
         await app.db.run(`DROP TABLE IF EXISTS usage`);
         await expect(getUsageAll(emptyQuery)).rejects.toThrowError(
            "Nenhum resultado."
         );
      });
      /**
       * Criando registros
       */
      it("Criar registro de uso", async () => {
         /**
          * Registro do motorista "João" usando o Uno para passeio
          */
         expect(
            await createUsage({
               body: {
                  driver_id: 1,
                  vehicle_id: 1,
                  reasoning: "Passeio",
               },
            })
         ).toBe("Registro criado com sucesso.");
         /**
          * Criando um motorista e um veículo para testar
          */
         await createDriver({ body: { id: 2, name: "José" } });
         await createVehicle({
            body: {
               id: 2,
               name: "EcoSport",
               type: "car",
               license_plate: "XYZ9876",
               brand_id: 6,
               mileage_km: 67000,
               color: "green",
            },
         });
         /**
          * Esperando um erro. O veículo ID == 1 já está em uso por
          * João, logo José não pode utilizar.
          */
         await expect(
            createUsage({
               body: {
                  driver_id: 2,
                  vehicle_id: 1,
                  reasoning: "Trabalho",
               },
            })
         ).rejects.toThrowError("Este veículo já está em uso!");
         /**
          * Também para o caso reverso. João já está utilizando um
          * veículo, logo não pode utilizar outro ao mesmo tempo.
          */
         await expect(
            createUsage({
               body: {
                  driver_id: 1,
                  vehicle_id: 2,
                  reasoning: "Viagem",
               },
            })
         ).rejects.toThrowError("Este motorista já está usando um veículo!");
         /**
          * José utilizando o EcoSport para trabalho
          */
         expect(
            await createUsage({
               body: {
                  driver_id: 2,
                  vehicle_id: 2,
                  reasoning: "Trabalho",
               },
            })
         ).toBe("Registro criado com sucesso.");
      });
      /**
       * Listando os registros, não mais vazios
       */
      it("Listar usos (não-vazio)", async () => {
         expect((await getUsageAll(emptyQuery)).length).not.toBe(0);
      });
      /**
       * Finalizando os registros.
       */
      it("Finalizar um uso", async () => {
         /**
          * Finalizando o uso de João do Uno.
          */
         expect(await finalizeUsage({ params: { id: 1 } })).toBe(
            "Registro finalizado!"
         );
         /**
          * Criando um motorista novo para utilização do mesmo veículo
          */
         await createDriver({ body: { id: 3, name: "Janaína" } });
         /**
          * Uno já está disponível, logo Janaína pode utilizá-lo
          */
         expect(
            await createUsage({
               body: {
                  driver_id: 3,
                  vehicle_id: 1,
                  reasoning: "Passeio",
               },
            })
         ).toBe("Registro criado com sucesso.");
         /**
          * Esperando erro. O registro ID == 99 não existe.
          */
         await expect(
            finalizeUsage({ params: { id: 99 } })
         ).rejects.toThrowError("ID de uso não encontrado.");
      });

      /**
       * Deletando registros
       */
      it("Deletar um registro", async () => {
         /**
          * Deletando o registro de uso ID == 2
          */
         expect(await deleteUsage({ params: { id: 2 } })).toBe(
            "Registro deletado!"
         );
         /**
          * Esperando erro. O registro ID == 99 não existe.
          */
         await expect(deleteUsage({ params: { id: 99 } })).rejects.toThrowError(
            "ID de uso não encontrado."
         );
      });
   });

   beforeAll(async () => {
      /**
       * Antes de rodar os testes, as tabelas precisam
       * ser deletadas para evitar conflitos.
       */
      await app.db.run(`
         DROP TABLE IF EXISTS brand;
         DROP TABLE IF EXISTS driver;
         DROP TABLE IF EXISTS usage;
         DROP TABLE IF EXISTS vehicle;
      `);
      /**
       * Confirmando o servidor em atividade.
       */
      await app.ready();
   });

   afterAll(async () => {
      /**
       * Após todos os testes finalizados, o
       * servidor pode ser fechado.
       */
      await app.close();
   });
});
