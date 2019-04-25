import { map, groupBy } from 'ramda';
import DataLoader from 'dataloader';
import query from './db';

async function findBooksByIds(ids) {
  const sql = `
  select * 
  from  book
  where  book.id = ANY($1);
  `;
  const params = [ids];
  try {
    const result = await query(sql, params);
    const rowsById = groupBy((book) => book.id, result.rows);
    return map(id => {
      const book = rowsById[id] ? rowsById[id][0] : null;
      return book;
    }, ids);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export function findBooksByIdsLoader() {
  return new DataLoader(findBooksByIds);
}

export async function findBookById(id) {
  const sql = `
  select * 
  from  book
  where  book.id = $1;
  `;
  const params = [id];
  try {
    const result = await query(sql, params);
    return result.rows[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

const ORDER_BY = {
  ID_DESC: 'id desc',
  RATING_DESC: 'rating desc',
};

export async function allBooks(args) {
  // const orderBy = ORDER_BY[args.orderBy];
  const orderBy = '1'
  const sql = `
  select * from  book
  order by ${orderBy};
  `;
  try {
    const result = await query(sql);
    return result.rows;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export function imageUrl(size, id) {
  const zoom = (size === 'SMALL' ? 1 : 0);
  return `//books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=${zoom}&source=gbs_api`;
}
/**
 * https://stackoverflow.com/questions/36032179/remove-duplicates-in-an-object-array-javascript
 * @param {type} arr
 * @param {function} filterFunction in the form of p => return p.mainId
 * a function that identifies the 'id' of the row
 * @returns {unresolved}
 */
function dedupe(arr, filterFunction) {
  return arr.reduce(function (p, c) {

    // create an identifying id from the object values
    //var id = [c.x, c.y].join('|');
    let id = filterFunction(c);

    // if the id is not found in the temp array
    // add the object to the output array
    // and add the key to the temp array
    if (p.temp.indexOf(id) === -1) {
      p.out.push(c);
      p.temp.push(id);
    }
    return p;

    // return the deduped array
  }, {temp: [], out: []}).out;
}


/**
 * this function gets all books author and review information
 * then performs a tree assembly, and dedupes the accumulators
 * @returns {bookResult}
 */
export async function myAllBooks() {


  

  const sqlReview = `select  
book.id as book_id, author.id as author_id,review.id as review_id,
author.name as author_name,
review.rating as review_rating,
user_list.id as user_id,
user_list.name as user_name,
book.* 
from book
inner join book_author on book.id = book_author.book_id
inner join author on author.id = book_author.author_id
inner join review on review.book_id = book.id
inner join user_list on user_list.id = review.user_id
order by 1,2,3 asc`

  try {
    const result = await query(sqlReview);

    let bookResult = [];

    let currentRow = {bookId: -55};

    result.rows.forEach(r => {
      if (currentRow.bookId !== r.bookId) {
        r.authorAccum = [{id: r['authorId'], name: r['authorName']}];
        r.reviewAccum = [{reviewId: r['reviewId'], rating: r['reviewRating'], user:{id:r['userId'],name:r['userName']}  } ];
        bookResult.push(r);
        currentRow = r;
      }
      currentRow.authorAccum.push({id: r['authorId'], name: r['authorName']});
      currentRow.reviewAccum.push({reviewId: r['reviewId'], rating: r['reviewRating'], user:{id:r['userId'],name:r['userName'] } });

    })

    bookResult.forEach(res => {
      res.authorAccum = dedupe(res.authorAccum, c => c.id)
      res.reviewAccum = dedupe(res.reviewAccum, c => c.reviewId)
    })


    return bookResult;
  } catch (err) {
    console.log(err);
    throw err;
  }


}