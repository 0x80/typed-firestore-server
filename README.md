# Typed Firestore - Server

Elegant, strongly-typed, abstractions for Firestore in server environments.

All functions are designed to take a re-usable typed collection reference as
their first argument. The various functions can infer their return type from it,
which greatly reduces boilerplate code as well as the risk of making mistakes.

For React applications check out
[@typed-firestore/react](https://github.com/0x80/typed-firestore-react) which
uses similar abstractions.

## Installation

`pnpm add @typed-firestore/server`, or the equivalent for your package manager.

## Usage

### Type Your Database Collections

Create a file in which you define refs for all of your database collections, and
map each to the appropriate type, as shown below.

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
  const user = await getDocumentFromTransaction(tx, refs.users, "id123");

  /**
   * In this case, the typed update function calls the transaction, and is
   * therefore not async. It will execute when the transaction is committed.
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

The functions below that query collections should look familiar, but there are a
few key things to note:

1. The functions take only a collection reference, and then return a function
   that is typed to take the query and handler. This is necessary for the
   handler to be typed correctly.
2. The optional select statement should be defined separately from the query. In
   theory you can still also set it on the query but your data will not be typed
   properly and it can lead to serious mistakes, so be mindful of that.

```ts
import { refs } from "./db-refs";
import { processQuery } from "@typed-firestore/server";

/**
 * Process the results of a query, including an optional strongly-typed select
 * statement.
 */
await processQuery(refs.books)(
  (book) => book.where("is_published", "==", true),
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
await processQuery(refs.userWishlist(user.id))(null, {
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

## API

More documentation will follow. In the meantime, please look at the function
signatures. I think they are pretty self-explanatory.

## Document Types

All functions return a form of `FsDocument<T>` conveniently combine the data and
id.

The mutable version `FsMutableDocument<T>` also provides a strongly-typed
`update` function and the original `ref` in case you need to call any other
native Firestore functions.

### Single Documents

| Function                              | Description                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `getDocument`                         | Fetch a document                                                                     |
| `getDocumentData`                     | Fetch only the data part of a document                                               |
| `getDocumentMaybe`                    | Fetch a document that might not exist                                                |
| `getDocumentDataMaybe`                | Fetch only the data part of a that might not exist                                   |
| `getDocumentFromTransaction`          | Fetch a document as part of a transaction                                            |
| `getDocumentDataFromTransaction`      | Fetch only the data part of a document as part of a transaction                      |
| `getDocumentFromTransactionMaybe`     | Fetch a document that might not exist as part of a transaction                       |
| `getDocumentDataFromTransactionMaybe` | Fetch only the data part of a document that might not exist as part of a transaction |
| `getSpecificDocument`                 | Fetch a document using a typed document ref instead of a collection ref              |
| `getSpecificDocumentFromTransaction`  | Fetch a document using a typed document ref as part of a transaction                 |

### Collections and Queries

| Function                      | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `getDocuments`                | Fetch documents using a query                                           |
| `getDocumentsFromTransaction` | Fetch documents using a query as part of a transaction                  |
| `getFirstDocument`            | Fetch the first document from a query                                   |
| `processCollection`           | Process an entire collection using a handler per document               |
| `processCollectionByChunk`    | Process an entire collection using a handler per chunk                  |
| `processQuery`                | Query a collection and process the results using a handler per document |
| `processQueryByChunk`         | Query a collection and process the results using a handler per chunk    |

### Cloud Functions

| Function                     | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `getDataOnWritten`           | Get the data from a document write event                   |
| `getDataOnUpdated`           | Get the data from a document update event                  |
| `getBeforeAndAfterOnWritten` | Get the before and after data from a document write event  |
| `getBeforeAndAfterOnUpdated` | Get the before and after data from a document update event |

## Where Typing Was Ignored

You might notice that the query `where()` function is still the regular untyped
Firestore API, and that is deliberate. I think this part would be difficult to
type, and the API shape would be very different from the official API.

Besides having strong typing, I also wanted to make this library non intrusive
and thus easy to adopt.

I would argue that the `where()` clause is the least critical part anyway. If
you make a mistake there, there is little chance to ruin things and you will
likely find out during development.

In my experience, if you use a `select()` without matching typing, or send the
wrong data to `update()` you could easily mess things up in a way that is risky
or time consuming to fix, especially when writing database migration scripts.

So I think the trade-off for simplicity is worth it.

It might be possible to create a clean fully-typed API for queries with some
type gymnastics, but that is not something I am willing to spend lots of time
on.
