# Typed Firestore - Server

Elegant, typed abstractions for Firestore in server environments.

- A non-intrusive, easy-to-adopt API without lock-in
- Write clean, readable, strongly-typed code, without the need to cast or even
  import types
- Greatly reduce the risk of mistakes
- Simplify transaction code
- Conveniently get data from cloud function events

For React applications check out
[@typed-firestore/react](https://github.com/0x80/typed-firestore-react) which
uses similar abstractions.

Using these abstractions, you can write very safe code. The only thing to keep
in mind is to **always write your select statement separate** from the query.
For more info see
[Handling Collections and Queries](#handling-collections-and-queries) for more
information.

## Installation

`pnpm add @typed-firestore/server`, or the equivalent for your package manager.

## Usage

### Typing Your Database

All functions are designed to take a re-usable typed collection reference as one
of their arguments. The various functions can infer their return type from it,
and apply the necessary restrictions.

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

If you have collections that mix files with different types, you can declare the
type for each individual document using a `DocumentReference` and use the
functions that are focused on specific documents, like `getSpecificDocument`.

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

### Handling Collections and Queries

The functions that work with collections should look familiar, but there is one
thing to always keep in mind:

The optional `select` statement should **ALWAYS** be defined separately from the
query, otherwise we can not narrow the returned type correctly.

Because the query part is using the official Firestore API, you can still place
a select on the query, but then your data will **not be typed correctly** and it
can lead to **painful mistakes**, so try to keep that in mind!

This is not a risk introduced by this library. If you use the official
`.select()` API you are always at risk because you would have to type the result
manually.

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
    /** Only title and is_published are available here, because we selected them! */
    console.log(book.author, book.title);
  },
  /**
   * Select is defined separately from the query, because otherwise we can't
   * enforce typing on the result.
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

Fetching documents from a collection is very similar to processing documents.
The query part is optional and without it you will fetch the full collection.

Only in this case, instead of passing null for the query, you can also not pass
anything.

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
 * Similar to processDocuments, the data can be narrowed by passing a select
 * option separately. Here, allBooks is typed as FsMutableDocument<Pick<Book,
 * "author" | "title">>[]
 */
const narrowPublishedBooks = await getDocuments(
  refs.books,
  (query) => query.where("is_published", "==", true),
  { select: ["author", "title"] }
);
```

All functions also support collection groups. You simply pass in a typed
CollectionGroup instead of a typed CollectionReference.

```ts
/**
 * If you use this regularly, place the ref in the db-refs.ts file together with
 * the others.
 */
const groupRef = db.collectionGroup(
  "wishlist"
) as CollectionGroup<WishlistItem>;

const allWishlistItems = await getDocuments(groupRef, (query) =>
  query.where("is_archived", "==", false)
);
```

For cloud functions, there are helpers to get the data from the event.
Unfortunately here we do not have access to a typed collection reference, so we
need to pass the type manually.

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
    const data = getDataOnWritten<Book>(event);

    /** Get the before and after the write event */
    const [before, after] = getBeforeAndAfterOnWritten<Book>(event);
  }
);
```

## API

More documentation will follow. In the meantime, please look at the function
signatures. I think they are pretty self-explanatory.

## Document Types

All functions return a form of `FsDocument<T>`, which conveniently combines the
data and id.

The mutable version `FsMutableDocument<T>` also provides a typed `update`
function and the original `ref` in case you need to call any other native
Firestore functions.

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
| `updateDocumentWithPartial`              | Update a document with a partial object                                   |
| `updateDocumentInTransaction`            | Update a document as part of a transaction                                |
| `updateDocumentWithPartialInTransaction` | Update a document with a partial object as part of a transaction          |

### Collections and Queries

| Function                        | Description                                                             |
| ------------------------------- | ----------------------------------------------------------------------- |
| `getDocuments`                  | Fetch documents using a query                                           |
| `getDocumentsInTransaction`     | Fetch documents using a query as part of a transaction                  |
| `getFirstDocument`              | Fetch the first document from a query                                   |
| `getFirstDocumentInTransaction` | Fetch the first document from a query as part of a transaction          |
| `processDocuments`              | Query a collection and process the results using a handler per document |
| `processDocumentsByChunk`       | Query a collection and process the results using a handler per chunk    |

The same functions for with collection groups also.

### Cloud Functions

When writing cloud functions, you typically need to get the data from the event
and then process it. These functions take the event and return typed data.

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

## Where Typing Was Ignored

You might have noticed that the query `where()` function is still using the
regular untyped Firestore API, and that is deliberate. I think this part would
be difficult to type, and the API shape would be very different from the
official API. Besides wanting strong typing, I also want this library to be
non-intrusive and easy to adopt.

I would argue that the `where()` clause is the least critical part anyway. If
you make a mistake with it, there is little chance to ruin in the database
things and you will likely discover the problem during development.

In my experience, if you use a `select()` without matching typing, or send the
wrong data to `update()` you can easily mess things up in a way that is risky or
time consuming to restore, especially when writing database migration scripts.

It might be possible to create a clean fully-typed API for queries with some
fancy type gymnastics, but that is not something I am willing to spend lots of
time on.

I think the trade-off for simplicity and familiarity is warranted.
