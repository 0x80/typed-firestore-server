# Typed Firestore

Elegant, strongly-typed, zero-dependency abstractions for Firestore in server
environments.

All functions are designed to take a re-usable typed collection reference as
their first argument. The various functions can infer their return type from it,
which greatly reduces boilerplate code as well as the risk of mistakes.

For client-side check out
[firestore-hooks](https://github.com/0x80/firestore-hooks) which provides
similar abstractions, but doesn't have the same .

## Installation

`pnpm i @typed-firestore/server`, or the equivalent for your package manager.

## Usage

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

```ts
import { refs } from "./db-refs";
import { getDocument, processQuery } from "@codecompose/typed-firestore";

/** Get a document, the result will be typed to FsMutableDocument<User> */
const user = await getDocument(refs.users, "123");

/** The returned document has a typed update function */
await user.update({
  /** Properties here will be restricted to what is available in the User type */
  is_active: true,
  /** Field values are allowed to be passed for any of the defined properties */
  modified_at: FieldValue.serverTimestamp(),
});

/**
 * Process an entire collection, without a query or property selection. This is
 * typically useful if you need to migrate data after the document type
 * changes.
 */
await processCollection(refs.userWishlist(user.id), {
  handler: async (item) => {
    /** The returned document has a typed update function */
    await item.update({
      /** Properties here will be restricted to what is available in the type */
      is_archived: false,
      /** Field values are allowed to be passed for any of the defined properties */
      modified_at: FieldValue.serverTimestamp(),
    });
  },
});

/** Process the results of a query, including a strongly-typed select */
await processQuery(refs.books, {
  query: (book) => book.where("is_published", "==", true),
  /**
   * Select is defined separately from the query, otherwise we can't type the
   * result.
   */
  select: ["author", "title"],
  handler: async (book) => {
    /** Only title and is_published are available here, because we selected them. */
    console.log(book.author, book.title);
  },
});
```

## API

More detailed documentation will follow, but I think the function signatures are
pretty self-explanatory.

## Document Types

All functions return `FsDocument<T>` or `FsMutableDocument<T>`. These types
conveniently combine the data and id together with the document reference. The
mutable version also provides a strongly-typed `update` function and the raw
`ref` in case you want to call any of the other native Firestore functions.

### Single Document

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

### Collection Query

| Function                      | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `getDocuments`                | Fetch documents using a query                                           |
| `getDocumentsFromTransaction` | Fetch documents using a query as part of a transaction                  |
| `getFirstDocument`            | Fetch the first document from a query                                   |
| `processCollection`           | Process an entire collection using a handler per document               |
| `processCollectionByChunk`    | Process an entire collection using a handler per chunk                  |
| `processQuery`                | Query a collection and process the results using a handler per document |
| `processQueryByChunk`         | Query a collection and process the results using a handler per chunk    |
