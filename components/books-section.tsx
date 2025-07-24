import { getBooks } from "./actions";
import BooksGrid from "./books-grid";

export default async function BooksSection() {
  const books = await getBooks();

  return (
    <section id="books" className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
            My Reading List
          </h2>
          <BooksGrid books={books} />
        </div>
      </div>
    </section>
  );
}
