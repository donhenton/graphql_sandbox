# Queries

## Parameterized
```
query {
  findBookById(id: 2){
    id
    title
    description
  }
}

```

## General

```
{
  books {
    id
    title
    rating
    description
    authorId
    imageUrl(size: SMALL)
    authors {
      id
      name
    }
    reviews {
      reviewId
      rating
    }
  }
}

```