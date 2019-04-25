import {allBooks,myAllBooks,imageUrl} from './book';
import {authorsByBookId} from './authors';

const resolvers = {
  Book: {
    imageUrl: (book,{size}) => {return imageUrl(size,book.googleId)},
   // authors: (book) => {return authorsByBookId(book.id)}
   authors:(book) => {return book.authorAccum},
   reviews:(book) => {return book.reviewAccum}
  },
   
  Query: {
    books: () => {
      return myAllBooks();
    }
  }
}

export  default resolvers;

