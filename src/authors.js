import { groupBy, map } from 'ramda';
import DataLoader from 'dataloader';
import query from './db';

export async function findAuthorsByBookIds(ids) {
  const sql = `
  select 
   author.*,
   book_author.book_id
  from  author inner join  book_author
    on  author.id =  book_author.author_id
  where  book_author.book_id = ANY($1);
  `;
  const params = [ids];
  try {
    const result = await query(sql, params);
    const rowsById = groupBy(author => author.bookId, result.rows);
    return map(id => rowsById[id] , ids);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export function findAuthorsByBookIdsLoader() {
  return new DataLoader(findAuthorsByBookIds);
}

export async function authorsByBookId(id) {
  const sql = `
  select 
   author.*
  from  author inner join  book_author
    on  author.id =  book_author.author_id
  where  book_author.book_id = $1;
  `;
  const params = [id];
  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
