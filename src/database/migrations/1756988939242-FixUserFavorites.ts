import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserFavorites1756988939242 implements MigrationInterface {
    name = 'FixUserFavorites1756988939242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "book_genres" DROP CONSTRAINT "FK_book_genres_books"`);
        await queryRunner.query(`ALTER TABLE "book_genres" DROP CONSTRAINT "FK_book_genres_genres"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_user_favorites_users"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_user_favorites_books"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_users"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_books"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_favorites_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_favorites_book_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_books_title"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_books_author"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reviews_rating"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id", "userId")`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD "bookId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id", "userId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("userId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("book_id", "userId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ALTER COLUMN "book_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_1cfc14574d4eb732d7bc65c7150" PRIMARY KEY ("userId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "isbn" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "description" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "published_date" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "book_genres" ADD CONSTRAINT "FK_dc378b8311ff85f0dd38f163090" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_genres" ADD CONSTRAINT "FK_43ff7d87d7506e768ca6491a1dd" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_5238ce0a21cc77dc16c8efe3d36" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_d1d18a20ce97c552adcf83dd03f" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_1259866c6ef3e58270e2ff6abfd" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_1259866c6ef3e58270e2ff6abfd"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_d1d18a20ce97c552adcf83dd03f"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_5238ce0a21cc77dc16c8efe3d36"`);
        await queryRunner.query(`ALTER TABLE "book_genres" DROP CONSTRAINT "FK_43ff7d87d7506e768ca6491a1dd"`);
        await queryRunner.query(`ALTER TABLE "book_genres" DROP CONSTRAINT "FK_dc378b8311ff85f0dd38f163090"`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "published_date" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "isbn" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_1cfc14574d4eb732d7bc65c7150"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("book_id", "userId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ALTER COLUMN "book_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id", "userId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id", "userId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id", "userId")`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP COLUMN "bookId"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "PK_user_favorites"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id")`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP COLUMN "userId"`);
        await queryRunner.query(`CREATE INDEX "IDX_reviews_rating" ON "reviews" ("rating") `);
        await queryRunner.query(`CREATE INDEX "IDX_books_author" ON "books" ("author") `);
        await queryRunner.query(`CREATE INDEX "IDX_books_title" ON "books" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_favorites_book_id" ON "user_favorites" ("book_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_favorites_user_id" ON "user_favorites" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_books" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_books" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_genres" ADD CONSTRAINT "FK_book_genres_genres" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_genres" ADD CONSTRAINT "FK_book_genres_books" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
