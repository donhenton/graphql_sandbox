begin;
-- create schema hb;

create table  author (
  id                serial primary key,
  name              text,
  tokens            tsvector,
  created_at        timestamp default now()
);

create index author_tokens_idx on  author using gin(tokens);

comment on table  author is 'A book author.';
comment on column  author.id is 'The primary unique identifier for the author.';
comment on column  author.name is 'The author''s name.';
comment on column  author.tokens is 'tokens for full text search';
comment on column  author.created_at is 'The time this author was created.';

create table  book (
  id                serial primary key,
  google_id         text unique,
  title             text not null,
  subtitle          text,
  description       text,
  page_count        int default 0,
  rating_total      int default 0,
  rating_count      int default 0,
  rating            decimal default 0,
  tokens            tsvector,
  created_at        timestamptz default now()
);

create index book_google_id_idx on  book(google_id);
create index book_tokens_idx on  book using gin(tokens);

comment on table  book is 'A book.';
comment on column  book.id is 'The primary unique identifier for the book.';
comment on column  book.title is 'The books title.';
comment on column  book.subtitle is 'The books subtitle.';
comment on column  book.description is 'The books description.';
comment on column  book.page_count is 'The number of pages in the book.';
comment on column  book.rating_total is 'The total number of all the user reviews for the book. ie user1: 4 star, user2: 5 star, user3: 3 star => review_total = 12 (4 + 5 + 3)';
comment on column  book.rating_count is 'The count of all the user reviews for the book. ie user1: 4 star, user2: 5 star, user3: 3 star => review_count = 3';
comment on column  book.rating is 'The average rating for the book';
comment on column  book.tokens is 'tokens for full text search';
comment on column  book.created_at is 'The time this book was created.';

create table  book_author(
  id                serial primary key,
  book_id           int not null references  book(id),
  author_id         int not null references  author(id),
  created_at        timestamptz default now()
);

create index book_author_book_id_idx on  book_author(book_id);
create index book_author_author_id_idx on  book_author(author_id);

comment on table  book_author is 'A book author.';
comment on column  book_author.id is 'The primary unique identifier for the book.';
comment on column  book_author.book_id is 'The id for the book.';
comment on column  book_author.author_id is 'The id for the author.';
comment on column  book_author.created_at is 'The time this book author was created.';

create table  user_list (
  id                serial primary key,
  email             text unique not null check (email ~* '^.+@.+\..+$'),
  name              text not null,
  tokens            tsvector,
  created_at        timestamptz default now()
);

create index user_tokens_idx on  user_list using gin(tokens);

comment on table  user_list is 'A book reviewer.';
comment on column  user_list.id is 'The primary unique identifier for the user.';
comment on column  user_list.email is 'The user''s email.';
comment on column  user_list.name is 'The user''s name.';
comment on column  user_list.tokens is 'tokens for full text search';
comment on column  user_list.created_at is 'The time this user was created.';

create table  review(
  id                serial primary key,
  user_id           int not null references  user_list(id),
  book_id           int not null references  book(id),
  rating            int not null check(rating >= 1 and rating <= 5),
  title             text,
  comment           text,
  tokens            tsvector,
  created_at        timestamptz default now()
);

create index review_user_id_idx on  review(user_id);
create index review_book_id_idx on  review(book_id);
create index review_tokens_idx on  review using gin(tokens);

comment on table  review is 'A book review.';
comment on column  review.user_id is 'The id of the user doing the review';
comment on column  review.book_id is 'The id of the book being reviewed.';
comment on column  review.rating is 'The number of stars given 1-5';
comment on column  review.title is 'The review title left by the user';
comment on column  review.comment is 'The review comment left by the user';
comment on column  review.tokens is 'tokens for full text search';
comment on column  review.created_at is 'The time this review was created.';

create function  create_book(
  google_book_id        text,
  title                 text, 
  subtitle              text,
  description           text,
  authors               text[],
  page_count            integer
) returns  book as $$
declare
  book             book;
  authors_rows     author[];
  author_ids      int[];
  tokens          tsvector;
begin

  select * from  book where  book.google_id = google_book_id into book;

  if book.id > 0 then
    return book;
  else
    tokens := to_tsvector(coalesce(title, '') || coalesce(subtitle, '') || coalesce(description, ''));
    insert into  book(google_id, title, subtitle, description, page_count, tokens)
      values (google_book_id, title, subtitle, description, page_count, tokens) 
      returning * into book;

    with ai as (
      insert into  author(name, tokens) 
      select name, to_tsvector(name) 
      from
      (select unnest(authors) as name ) as a
        returning id 
    ) 

    insert into  book_author(book_id, author_id) 
    select book.id, id from ai;

    return book;
  end if;
end;
$$ language plpgsql strict security definer;

comment on function  create_book(text, text, text, text, text[], integer) is 'creates a book.';

create function  create_review(
  book_id         integer,
  reviewer_email  text,
  name            text,
  new_rating      integer,
  title           text,
  comment         text
) returns  review as $$
declare
  user_id     integer;
  review       review;
  tokens      tsvector;
begin
  insert into  user_list(email, name, tokens) 
    values (reviewer_email, name, to_tsvector(name)) 
    on conflict (email) do nothing;

  select id into user_id from  user_list where email = reviewer_email;  
  tokens := to_tsvector(coalesce(title, '') || coalesce(comment, ''));
  insert into  review(user_id, book_id, rating, title, comment, tokens) 
    values(user_id, book_id, new_rating, title, comment, tokens) 
    returning * into review;


  update  book set 
    rating_total = rating_total + new_rating, 
    rating_count = rating_count + 1, 
    rating = (rating_total + new_rating) / (rating_count  + 1)
    where id = book_id;

  return review;
end;
$$ language plpgsql strict security definer;

comment on function  create_review(integer, text, text, integer, text, text) is 'creates a book review.';

commit;