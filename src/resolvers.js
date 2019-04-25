import {allBooks,myAllBooks,imageUrl} from './book';
import {authorsByBookId} from './authors';

const resolvers = {
  Book: {
    imageUrl: (book,{size}) => {return imageUrl(size,book.googleId)},
   // authors: (book) => {return authorsByBookId(book.id)}
   authors:(book) => {return book.authorAccum},
   reviews:(book) => {return book.reviewAccum},
   
  },
   
//   Review: {
//     user:(review) => { return review.user}
//   },
 
  Query: {
    books: () => {
      return myAllBooks();
    }
  }
}

export  default resolvers;

