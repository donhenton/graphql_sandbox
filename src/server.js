import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import {graphqlExpress, graphiqlExpress} from 'apollo-server-express';
import typeDefs from './typedefs';
import resolvers from './resolvers' ;

//const resolvers = {
//  Query: {
//    hello: () => 'World',
//    name: () => 'James',
//  },
//};

const schema = makeExecutableSchema({ typeDefs, resolvers });
const app = express();
app.use(cors());

app.use('/graphql',bodyParser.json(),graphqlExpress({schema}));
app.use('/graphiql',graphiqlExpress({endpointURL: 'graphql'}));
app.listen(4000,() => {console.log("listening on port 4000")});


//const query = process.argv[2];
//
//graphql(schema, query).then(result => {
//  console.log(JSON.stringify(result, null, 2));
//});
