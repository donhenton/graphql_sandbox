const typeDefs = `

schema {
   query: Query
}
type Query {
    books: [Book]
}

type Author {
    id: ID!
    name: String!
}

type Review {
  reviewId: ID!
  rating: Int
  user: User!

}

type User {
  id: ID!
  name: String!

}
type Book {
  id: ID!
  title: String!
  description: String!
  imageUrl(size: ImageSize = LARGE): String!
  rating: Float
  subtitle: String!
  authorId: ID
  ratingCount: Int
  authors: [Author]
  reviews: [Review]


}

enum ImageSize {
   SMALL LARGE
}
`;

export default typeDefs;