# WebAPI de exemplo solicitada por SEIDOR

Este projeto é uma API bem básica para manutenção de uso de carros em algo como uma locadora de veículos, permitindo adicionar veículos, usuários, marcas, e o registro de uso em si.

## Instalação

O programa é feito com a lib [Fastify](https://fastify.dev/), que é basicamente uma versão mais modernizada (e mantida) do Express.js.

Para instalar, é necessário possuir o Node.js na versão 18 ou superior:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

-  O projeto utiliza ES Modules, então statements de `import` são utilizados ao invés do `require()`.

## Uso

Para iniciar o servidor, basta rodar:

```bash
npm run start
```

Isto iniciará o servidor na porta 8080, então com um cliente HTTP (como o Thunder Client para VSCode, por exemplo), você pode accessar as rotas `/api` para achar os endpoints disponíveis.

-  O PDF enviado à mim dizia que não era necessário ter memória persistente (banco de dados), mas achei que este seria um jeito um pouco mais prático de demonstrar (já que gosto de SQL), então ao iniciar o servidor ele criará um banco de dados SQLite (`data.db`) na raiz do projeto.

## Endpoints

Apenas para fins de teste, a raiz do endpoint `/api` retorna um JSON com

```json
{
   "ping": "pong"
}
```

### Marca de veículo

| Campo     | Tipo   | Descrição                             |
| --------- | ------ | ------------------------------------- |
| `id`      | int    | ID, chave primária, autoincrementável |
| `name`    | string | Nome da marca                         |
| `country` | string | País/território da marca              |

-  `GET /api/brand`: Retorna todas as marcas de veículos cadastradas.
   -  Por padrão, apenas para fins simplificativos, o programa cria uma lista de marcas placeholder.
-  `GET /api/brand/[ID]`: Retorna uma marca específica no `[ID]`.
-  `POST /api/brand`: Adiciona uma nova marca de veículo.
   -  Exemplo de corpo (supondo que isto crie o `[ID]` como 17):
   ```json
   {
      "name": "Ferrari",
      "country": "Italy"
   }
   ```
-  `PUT /api/brand/[ID]`: Atualiza uma marca específica no `[ID]`.
   -  Exemplo de corpo (supondo que `[ID]` seja 17):
   ```json
   {
      "name": "Suzuki",
      "country": "Japan"
   }
   ```
-  `DELETE /api/brand/[ID]`: Deleta uma marca específica no `[ID]`.

### Motorista

| Campo           | Tipo      | Descrição                             |
| --------------- | --------- | ------------------------------------- |
| `id`            | int       | ID, chave primária, autoincrementável |
| `name`          | string    | Nome do motorista                     |
| `registered at` | timestamp | Data de registro do motorista         |

-  `GET /api/driver`: Retorna todos os motoristas cadastrados.
   -  Inicialmente, retornará vazia, pois não há motoristas cadastrados.
-  `GET /api/driver/[ID]`: Retorna um motorista específico no `[ID]`.
-  `POST /api/driver`: Adiciona um novo motorista.
   -  Exemplo de corpo (supondo que isto crie o `[ID]` como 1):
   ```json
   {
      "name": "Yuri"
   }
   ```
-  `PUT /api/driver/[ID]`: Atualiza um motorista específico no `[ID]`.
   -  Exemplo de corpo (supondo que `[ID]` seja 1):
   ```json
   {
      "name": "Guilherme"
   }
   ```
-  `DELETE /api/driver/[ID]`: Deleta um motorista específico no `[ID]`.

### Veículo

| Campo           | Tipo      | Descrição                              |
| --------------- | --------- | -------------------------------------- |
| `id`            | int       | ID, chave primária, autoincrementável  |
| `name`          | string    | Nome do veículo                        |
| `license_plate` | string    | Placa do veículo. **Única**            |
| `type`          | string    | Tipo do veículo (carro, caminhão, etc) |
| `brand_id`      | int       | ID da marca do veículo                 |
| `mileage_km`    | int       | Quilometragem do veículo. NULLABLE     |
| `color`         | string    | Cor do veículo.                        |
| `created_at`    | timestamp | Data de registro do veículo            |

-  `GET /api/vehicle`: Retorna todos os veículos cadastrados.
   -  Inicialmente, retornará vazia, pois não há veículos cadastrados.
-  `GET /api/vehicle/[ID]`: Retorna um veículo específico no `[ID]`.
-  `POST /api/vehicle`: Adiciona um novo veículo.
   -  Exemplo de corpo (supondo que isto crie o `[ID]` como 1):
   ```json
   {
      "name": "EcoSport 2008",
      "license_plate": "ABC-1234",
      "type": "car",
      "brand_id": 6,
      "mileage_km": 22000,
      "color": "red"
   }
   ```
-  `PUT /api/vehicle/[ID]`: Atualiza um veículo específico no `[ID]`.
   -  Exemplo de corpo (supondo que `[ID]` seja 1):
   ```json
   {
      "name": "Virtus 2013",
      "license_plate": "DEF-5678",
      "type": "car",
      "brand_id": 16,
      "mileage_km": 11500,
      "color": "blue"
   }
   ```
-  `DELETE /api/vehicle/[ID]`: Deleta um veículo específico no `[ID]`.

### Registro de uso

| Campo        | Tipo      | Descrição                               |
| ------------ | --------- | --------------------------------------- |
| `id`         | int       | ID, chave primária, autoincrementável   |
| `driver_id`  | int       | ID do motorista                         |
| `vehicle_id` | int       | ID do veículo                           |
| `start_date` | timestamp | Data de início do uso do veículo        |
| `end_date`   | timestamp | Data de término do uso do veículo. NULL |
| `reasoning`  | string    | Motivo do uso do veículo.               |

-  Note que, ao criar um registro, não é necessário especificar `start_date`, o aplicativo já vai fazer isto.
-  Ao criar também, o `end_date` é NULL; isto significa que o carro ainda está em uso por algum motorista.
   -  O mesmo carro não pode ser usado por dois motoristas ao mesmo tempo.
   -  E um motorista não pode usar dois carros ao mesmo tempo.
-  Não há um endpoint específico para atualizar o uso, como nos outros endpoints. Ao acessar o endpoint `PUT /api/usage/[ID]`, caso o ID do registro exista, o programa irá automaticamente "finalizar" o uso do veículo, preenchendo o `end_date` com a data atual, logo então permitindo que o carro seja usado por outro motorista, e que o motorista use outro carro.

-  `GET /api/usage`: Retorna todos os registros de uso cadastrados.
   -  Inicialmente, retornará vazia, pois não há registros de uso cadastrados.
-  `GET /api/usage/[ID]`: Retorna um registro de uso específico no `[ID]`.
-  `POST /api/usage`: Adiciona um novo registro de uso.
   -  Exemplo de corpo (supondo que isto crie o `[ID]` como 1):
   ```json
   {
      "driver_id": 1,
      "vehicle_id": 1,
      "reasoning": "Passeio"
   }
   ```
-  `PUT /api/usage/[ID]`: Finaliza um registro de uso específico no `[ID]`.
-  `DELETE /api/usage/[ID]`: Deleta um registro de uso específico no `[ID]`.

## Teste

Os testes usam o [Vitest](https://vitest.dev/) (apesar de não precisar do Vite), que é basicamente uma versão mais moderna do Jest.

O teste está localizado em `/test/app.test.js`, para rodar:

```bash
npm run test
```

**ATENÇÃO:** como estou no Windows (fora do WSL), e por padrão o Windows, por algum motivo, não consegue executar comandos simultâneos, foi necessário usar a dependência `cross-env`, assim permitindo que eu mude o `NODE_ENV` ao rodar um teste (o banco de dados utilizado no Vitest é um arquivo separado que será criado automaticamente). Caso você não precise do `cross-env`, ou dê algum problema no seu sistema, remova-o no `package.json`.
