/**
 * Função para filtrar os parâmetros de URL e fazer uma "chain"
 * para o `WHERE` no SQL.
 * 
 * @param {string} query A query base em si
 * @param {[string, string][]} req Array de arrays com os parâmetros da URL
 */
export const queryFilter = (query, req) => {
   let filters = [];
   let statement = "";

   /**
    * Como o `req` deve ser uma array de arrays, pode-se fazer um
    * loop aqui, e verificar se o valor possui uma vírgula, pois caso
    * sim, o chain de `AND` vai continuar, mapeando por cada um, permitindo
    * filtrar vários valores pelo mesmo parâmetro.
    * 
    * O `?` é um placeholder padrão para valores no SQLite.
    */
   for (const [key, value] of Object.entries(req)) {
      if (value.includes(",")) {
         const values = value.split(",");
         statement += ` AND ${key} IN (${values.map(() => "?").join(",")})`;
         filters.push(...values);
      } else {
         statement += ` AND ${key} = ?`;
         filters.push(value);
      }
   }

   return { query: `${query}${statement}`, filters };
};
