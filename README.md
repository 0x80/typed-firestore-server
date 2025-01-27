# Typed Firestore - Server

Elegant, typed abstractions for Firestore in server environments.

- A non-intrusive, use-to-use API without lock-in
- Write clean, strongly-typed code, without boilerplate
- Get correctly typed data when using select statements
- Simplify transaction code
- Conveniently get data from cloud function events
- Easily process entire collections
- Minimize the risk of mistakes

For React applications check out
[@typed-firestore/react](https://github.com/0x80/typed-firestore-react) which
applies the same concepts.

## Installation

`pnpm add @typed-firestore/server`, or the equivalent for your package manager.

## Usage

### Typing Your Database

All functions are designed to take a re-usable typed collection reference as one
of their arguments. The functions can infer the other types from it, and apply
the necessary restrictions.

Start by creating a file in which you define refs for all of your database
collections, and map each to the appropriate type, as shown below.

```ts
// db-refs.ts
import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firestore";
import { User, WishlistItem, Book } from "./types";

export const refs = {
  /** For top-level collections it's easy */
  users: db.collection("users") as CollectionReference<User>,
  books: db.collection("books") as CollectionReference<Book>,
  /** For sub-collections you could use a function that returns the reference. */
  userWishlist: (userId: string) =>
    db
      .collection("users")
      .doc(userId)
      .collection("wishlist") as CollectionReference<WishlistItem>,

  /** This object never needs to change */
} as const;
```

The example above assumes that the documents in each collection are typed
uniformly, which is typically the case.

If you have collections with specific documents that have their own distinct
types, you can declare the type for each individual document using a
`DocumentReference`, and the API that is focused on specific documents, like
`getSpecificDocument`.

### Handling Single Documents

```ts
import { refs } from "./db-refs";
import { getDocument } from "@typed-firestore/server";

/** Get a document, the result will be typed to FsMutableDocument<User> */
const user = await getDocument(refs.users, "id123");

/** The returned document has a typed update function */
await user.update({
  /** Properties here will be restricted to what is available in the User type */
  is_active: true,
  /** Field values are allowed to be passed for any of the defined properties */
  modified_at: FieldValue.serverTimestamp(),
});

/** Helps with writing transactions */
await runTransaction(async (tx) => {
  /** Get a document as part of a transaction */
  const user = await getDocumentInTransaction(tx, refs.users, "id123");

  /**
   * In this case, the update function calls the transaction, and is therefore
   * not async. Instead, it will execute when the transaction is committed.
   */
  user.update({
    /** Properties here will be restricted to what is available in the User type */
    is_active: true,
    /** Field values are allowed to be passed for any of the defined properties */
    modified_at: FieldValue.serverTimestamp(),
  });
});
```

### Querying Collections

When fetching documents from a collection you can choose to pass a query, and
without it, you will get the entire collection. By default, documents are
fetched in batches of 500.

```ts
/**
 * Fetch an entire collection, where allBooks is typed to
 * FsMutableDocument<Book>[]
 */
const allBooks = await getDocuments(refs.books);

/** Fetch documents using a query */
const publishedBooks = await getDocuments(refs.books, (query) =>
  query.where("is_published", "==", true)
);

/**
 * With a select statement, the data and type can be narrowed simultaneously. In
 * this example, publishedBooks is typed as FsMutableDocument<Pick<Book,
 * "author"
 *
 * | "title">>[]
 */
const publishedBooks = await getDocuments(
  refs.books,
  (query) => query.where("is_published", "==", true),
  /**
   * Select should be defined separately from the query, because otherwise we
   * can not narrow the type.
   */
  { select: ["author", "title"] }
);
```

All functions also support collection groups. You simply pass it a typed
`CollectionGroup` instead of a typed `CollectionReference`.

```ts
const groupRef = db.collectionGroup(
  "wishlist"
) as CollectionGroup<WishlistItem>;

const allWishlistItems = await getDocuments(groupRef, (query) =>
  query.where("is_archived", "==", false)
);
```

### Processing Collections

It is common to want to process many or all documents in a collection. For
example when you want to make an analysis or migrate documents to an updated
schema type.

The processing functions are very similar to the query functions, but in
addition you pass a handler that gets called for each document, or each chunk of
documents.

The handlers are awaited for each batch of documents, so memory only has to hold
on to one chunk at a time, making it possible to iterate over unlimited amounts
of documents with constant low memory usage.

The query part is again optional, and without it you will process the entire
collection.

```ts
import { refs } from "./db-refs";
import { processDocuments } from "@typed-firestore/server";

/**
 * Process the results of a query, including an optional typed select
 * statement.
 */
await processDocuments(refs.books,
  (query) => query.where("is_published", "==", true),
  async (book) => {
    /** Only title and is_published are available here, because we selected them below */
    console.log(book.author, book.title);
  },
  /**
   * Select should be defined separately from the query, because otherwise we can not narrow the type.
   */
  { select: ["author", "title"] }
);

/**
 * Process an entire collection by setting the query to null. This is typically
 * useful if you need to migrate data after the document type changes.
 */
await processDocuments(refs.userWishlist(user.id), null, {
  handler: async (item) => {
    /** The returned document has a typed update function */
    await item.update({
      /** Properties here will be restricted to what is available in the type */
      is_archived: false,
      /** Field values are allowed to be passed for any of the defined properties */
      modified_at: FieldValue.serverTimestamp(),
    });
  },
  /** Pass an empty select for efficiency if you do not use any data */
  { select: [] }
});
```

### Cloud Function Utilities

For cloud functions, there are helpers to get the data from the event. Here we
pass the typed collection reference purely for type inference, and to stay
consistent with the other APIs.

```ts
import { type Book } from "./types";
import {
  getDataOnWritten,
  getBeforeAndAfterOnWritten,
} from "@typed-firestore/server/functions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

export const handleBookUpdates = onDocumentWritten(
  {
    document: "books/{documentId}",
  },
  async (event) => {
    /** Get only the most recent data */
    const data = getDataOnWritten(refs.books, event);

    /** Get the before and after the write event */
    const [before, after] = getBeforeAndAfterOnWritten(refs.books, event);
  }
);
```

## Keep Select Separate from Query

The functions that work with collections should look very familiar, with the
exception of the `select` option.

A `select` should always be defined separately from the query, otherwise the
returned type will not be narrowed correctly.

Because the query part is still the original Firestore API, nothing will prevent
you from using a `select` on the query directly, but it will be detected at
runtime and an error will be thrown.

## Limit Disables Batching

If you use a `limit` on the query, it will be detected and the default batching
mechanism will be disabled. As a result, all documents will be fetched in one
go. Firestore has a limit of `1000` documents per query.

## API

More documentation will follow. In the meantime, please look at the function
signatures. I think they are pretty self-explanatory.

## Document Types

All functions return a form of `FsDocument<T>`, which conveniently combines the
data and id.

The mutable version `FsMutableDocument<T>` also provides a typed `update`
function and the original `ref` in case you need to call any other native
Firestore APIs.

The `update` function is typed using Firestore's official `UpdateData<T>` type,
but this type is not perfect and it can reject nested data that is actually
valid.

For those situations we provide an alternative called `updateWithPartial`, which
is based on `Partial<T>` while also allowing `FieldValue` types to be used for
each of the root properties.

### Single Documents

| Function                                 | Description                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `getDocument`                            | Fetch a document                                                          |
| `getDocumentMaybe`                       | Fetch a document that might not exist                                     |
| `getDocumentInTransaction`               | Fetch a document as part of a transaction                                 |
| `getDocumentInTransactionMaybe`          | Fetch a document that might not exist as part of a transaction            |
| `getSpecificDocument`                    | Fetch a document from an inconsistent collection                          |
| `getSpecificDocumentInTransaction`       | Fetch a document from an inconsistent collection as part of a transaction |
| `setDocument`                            | Create or overwrite a document                                            |
| `setDocumentInTransaction`               | Create or overwrite a document as part of a transaction                   |
| `setSpecificDocument`                    | Create or overwrite a specific document                                   |
| `setSpecificDocumentInTransaction`       | Create or overwrite a specific document as part of a transaction          |
| `updateDocument`                         | Update a document                                                         |
| `updateDocumentInTransaction`            | Update a document as part of a transaction                                |
| `updateDocumentWithPartial`              | Update a document with a partial object                                   |
| `updateDocumentWithPartialInTransaction` | Update a document with a partial object as part of a transaction          |

### Collections and Queries

| Function                        | Description                                                             |
| ------------------------------- | ----------------------------------------------------------------------- |
| `getDocuments`                  | Fetch documents using a query                                           |
| `getDocumentsInTransaction`     | Fetch documents using a query as part of a transaction                  |
| `getFirstDocument`              | Fetch the first result of a query                                       |
| `getFirstDocumentInTransaction` | Fetch the first result of a query as part of a transaction              |
| `processDocuments`              | Query a collection and process the results using a handler per document |
| `processDocumentsByChunk`       | Query a collection and process the results using a handler per chunk    |

These functions will also work for collection groups.

### Cloud Functions

When writing cloud functions, you typically need to get the data from the event
and then process it. The following functions take this event and return typed
data.

| Function                     | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `getDataOnWritten`           | Get the data from a document write event                   |
| `getDataOnUpdated`           | Get the data from a document update event                  |
| `getBeforeAndAfterOnWritten` | Get the before and after data from a document write event  |
| `getBeforeAndAfterOnUpdated` | Get the before and after data from a document update event |

Note that the functions are exposed on `@typed-firestore/server/functions`, so
that the `firebase-admin` and `firebase-functions` peer-dependencies can both be
optional.

As long as you only import code from `@typed-firestore/server`, you shouldn't
need `firebase-functions` and as long as you only import code from
`@typed-firestore/server/functions`, you shouldn't need `firebase-admin`.

Importing types should not affect this.

The functions are only supporting 2nd gen cloud functions.

## Where Typing Was Ignored

You might have noticed that the query `where()` function is still using the
official Firestore API. No typing is enforced here at the moment. I think this
part would be difficult to type, and possibly the API shape would have to be
very different. Besides wanting strong typing, I also want this library to be
non-intrusive and easy to adopt.

I would argue that the `where()` clause is the least critical part anyway. If
you make a mistake with it, there is little chance to ruin things in the
database and you will likely discover the mistake already during development.

I suspect it might even be possible to create a fully-typed query builder
function that looks like the official API, via some advanced type gymnastics,
but that seems to be outside of my current capabilities, and it is not something
I am willing to spend a lot of time on.

For now, I think this trade-off, for the sake of simplicity and familiarity, is
warranted.
